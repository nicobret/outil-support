const AWS = require("aws-sdk");
const passwordValidator = require("password-validator");
const MessageModel = require("../models/message");
const AgentModel = require("../models/agent");
const ContactModel = require("../models/contact");
const TicketModel = require("../models/ticket");
const cron = require("node-cron");
const { decrypt } = require("../utils/crypto");
const { PUBLIC_BUCKET_NAME_SUPPORT } = require("../config");

const { sendEmail, sendTemplate } = require("../sendinblue");

const config = require("../config");
const { capture } = require("../sentry");
const { info } = require("../slack");

cron.schedule("*/30 * * * *", () => {
  try {
    updateTicketAgentViewings();
  } catch (e) {
    capture(e);
  }
});

const ERRORS = {
  SERVER_ERROR: "SERVER_ERROR",
  NOT_FOUND: "NOT_FOUND",
  PASSWORD_TOKEN_EXPIRED_OR_INVALID: "PASSWORD_TOKEN_EXPIRED_OR_INVALID",
  OPERATION_UNAUTHORIZED: "OPERATION_UNAUTHORIZED",
  OPERATION_NOT_ALLOWED: "OPERATION_NOT_ALLOWED",
  USER_ALREADY_REGISTERED: "USER_ALREADY_REGISTERED",
  PASSWORD_NOT_VALIDATED: "PASSWORD_NOT_VALIDATED",
  INVITATION_TOKEN_EXPIRED_OR_INVALID: "INVITATION_TOKEN_EXPIRED_OR_INVALID",
  FILE_CORRUPTED: "FILE_CORRUPTED",
  YOUNG_ALREADY_REGISTERED: "YOUNG_ALREADY_REGISTERED",
  UNSUPPORTED_TYPE: "UNSUPPORTED_TYPE",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  LINKED_OBJECT: "LINKED_OBJECT",
  NO_TEMPLATE_FOUND: "NO_TEMPLATE_FOUND",
  INVALID_BODY: "INVALID_BODY",
  INVALID_PARAMS: "INVALID_PARAMS",
  EMAIL_OR_PASSWORD_INVALID: "EMAIL_OR_PASSWORD_INVALID",
  PASSWORD_INVALID: "PASSWORD_INVALID",
  EMAIL_INVALID: "EMAIL_INVALID",
  EMAIL_AND_PASSWORD_REQUIRED: "EMAIL_AND_PASSWORD_REQUIRED",
  EMAIL_ALREADY_USED: "EMAIL_ALREADY_USED",
  PASSWORDS_NOT_MATCH: "PASSWORDS_NOT_MATCH",
  USER_NOT_EXISTS: "USER_NOT_EXISTS",
  NEW_PASSWORD_IDENTICAL_PASSWORD: "NEW_PASSWORD_IDENTICAL_PASSWORD",
  INVALID_IP: "INVALID_IP",
};

const SENDINBLUE_TEMPLATES = {
  ANSWER_RECEIVED: "1278",
  NEW_TICKET: "1254",
  MESSAGE_RECEIVED: "1255",
  TICKET_REPORT: "1386",
};

function validatePassword(password) {
  const schema = new passwordValidator();
  schema.is().min(6); // Minimum length 6
  // .is()
  // .max(100) // Maximum length 100
  // .has()
  // .letters() // Must have letters
  // .digits(); // Must have digits
  return schema.validate(password);
}

const sendEmailWithConditions = async ({ ticket, copyRecipient, dest, attachment, messageHistory, lastMessageId }) => {
  try {
    let mailTicket;
    let attachmentsEmail = attachment || [];
    let attachments;

    if (messageHistory === "all") {
      ({ mailMessages: mailTicket, attachments } = await getTicketHistory(ticket._id));

      await Promise.all(
        attachments.map(async (attachment) => {
          const fileData = await getFile(attachment.path, PUBLIC_BUCKET_NAME_SUPPORT);
          const buffer = decrypt(fileData.Body);

          attachmentsEmail.push({
            content: buffer.toString("base64"),
            name: attachment.name,
          });
        })
      );
    } else if (messageHistory !== null && messageHistory !== undefined) mailTicket = await getLastAndSpecificIdMessageFromTicket(lastMessageId, messageHistory);
    else mailTicket = await getLastMessageFromTicket(lastMessageId);

    const formatMessageForReading = (formattedMessage) => {
      const message = formattedMessage.replace(/\\n/g, "<br>").replace(/\\r/g, "<br>");
      return message;
    };

    const mail = await sendEmail({
      htmlContent: formatMessageForReading(mailTicket),
      subject: ticket.subject + " [#" + ticket.number + "]",
      // * TODO: uncomment this line in April 2023 or update imapEmail of the tickets !
      //sender: { email: ticket.imapEmail || "contact@mail-support.snu.gouv.fr" },
      sender: { email: "contact@mail-support.snu.gouv.fr" },
      to: [dest],
      cc: copyRecipient ?? [],
      attachment: attachmentsEmail.length > 0 ? attachmentsEmail : undefined,
    });
    if (!mail.messageId) {
      capture("ticket " + ticket._id + " not transfered to " + ticket.contactEmail);
    }
    return mail;
  } catch (error) {
    capture(error);
  }
};

const sendNotif = async ({ ticket, templateId, message }) => {
  try {
    const youngRoles = ["young", "young exterior", "parent"];

    let ticketUrl = youngRoles.includes(ticket.contactGroup)
      ? `https://moncompte.snu.gouv.fr/echanges/${ticket._id}`
      : `https://admin.snu.gouv.fr/besoin-d-aide/ticket/${ticket._id}`;

    const params = { cta: ticketUrl };
    if (templateId === SENDINBLUE_TEMPLATES.MESSAGE_RECEIVED) {
      params.message = message;
    }
    if (templateId === SENDINBLUE_TEMPLATES.ANSWER_RECEIVED) {
      params.message = message;
    }

    let notifMail = await sendTemplate({
      templateId,
      to: [ticket.contactEmail],
      params,
    });
    if (!notifMail.messageId) {
      capture("ticket " + ticket._id + " not transfered to " + ticket.contactEmail);
    }
  } catch (error) {
    capture(error);
  }
};

const sendReferentReport = async (infos, templateId) => {
  try {
    let params = {
      WAITING_PROCESSING: infos.ticketNew,
      NEW: infos.ticketOpen,
      OPENED: infos.ticketPending,
      PROCESSED_S_1a: infos.ticketDepartment,
      PROCESSED_S_1b: infos.ticketSnupport,
      DEPARTMENT: infos.department,
      PROCESSED_TIME_REFERENT: infos.timeToCloseReferent,
      PROCESSED_TIME_SUPPORT: infos.timeToCloseSupport,
    };

    for (const emailAddress of infos.refEmails) {
      const response = await sendTemplate({
        templateId,
        to: [emailAddress],
        params,
      });
      console.log(`Email sent to ${emailAddress}`, response);
    }
  } catch (error) {
    capture(error);
  }
};

const getTicketHistory = async (ticketId) => {
  try {
    let attachments;

    const messages = await MessageModel.find({ ticketId });
    attachments = messages
      .map((message) => message.files)
      .filter((files) => files.length > 0)
      .flat();

    if (!messages) return null;
    let mailMessages = "";
    mailMessages += `<strong>${messages.at(-1).authorLastName} ${messages.at(-1).authorFirstName} <${messages.at(-1).fromEmail}> <br>
    envoyé le ${messages.at(-1).createdAt.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}</strong> <br>
    ${messages.at(-1).text}`;
    for (let message of messages.reverse().slice(1, messages.length)) {
      mailMessages += `<blockquote style="border-left: 3px solid; padding: 5px 2px "> <strong>${message.authorLastName} ${message.authorFirstName} <${message.fromEmail}> <br>
      envoyé le ${message.createdAt.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })} </strong> <br>
      ${message.text}`;
    }
    messages.forEach(() => {
      mailMessages += `</blockquote>`;
    });
    return { mailMessages, attachments };
  } catch (error) {
    capture(error);
  }
};

const getLastMessageFromTicket = async (lastMessageId) => {
  try {
    const message = await MessageModel.findById(lastMessageId);
    const mailMessages = `<strong> ${message.authorFirstName} - Assistance du Service national universel (SNU) <br>
    a écrit le ${message.createdAt.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })} </strong> <br>
    ${message.text}`;
    return mailMessages;
  } catch (error) {
    capture(error);
  }
};

const getLastAndSpecificIdMessageFromTicket = async (lastMessageId, specificMessageId) => {
  try {
    const specificMessage = await MessageModel.findById(specificMessageId);
    const lastMessage = await MessageModel.findById(lastMessageId);
    let mailMessages = "";
    mailMessages += `<strong> ${lastMessage.authorFirstName} - Assistance du Service national universel (SNU) <br>
    a écrit le ${lastMessage.createdAt.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })} </strong> <br>
    ${lastMessage.text}`;
    mailMessages += `<blockquote style="border-left: 3px solid; padding: 5px 2px "> <strong>${specificMessage.authorLastName} ${specificMessage.authorFirstName} <${
      specificMessage.fromEmail
    }> <br>
    envoyé le ${specificMessage.createdAt.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })} </strong> <br>
    ${specificMessage.text} </blockquote>`;
    return mailMessages;
  } catch (error) {
    capture(error);
  }
};

///S3\\\
function uploadPublicPicture(path, file) {
  return new Promise((resolve, reject) => {
    const s3bucket = new AWS.S3({ endpoint: config.CELLAR_ENDPOINT, accessKeyId: config.CELLAR_KEYID, secretAccessKey: config.CELLAR_KEYSECRET });
    const params = {
      Bucket: config.PUBLIC_BUCKET_NAME,
      Key: path,
      Body: file.data,
      ContentType: file.mimetype,
      ACL: "public-read",
      Metadata: { "Cache-Control": "max-age=31536000" },
    };
    s3bucket.upload(params, function (err, data) {
      if (err) return reject(`error in callback:${err}`);
      resolve(data);
    });
  });
}

function uploadAttachment(path, file) {
  return new Promise((resolve, reject) => {
    const s3bucket = new AWS.S3({ endpoint: config.CELLAR_ENDPOINT_SUPPORT, accessKeyId: config.CELLAR_KEYID_SUPPORT, secretAccessKey: config.CELLAR_KEYSECRET_SUPPORT });
    const params = {
      Bucket: config.PUBLIC_BUCKET_NAME_SUPPORT,
      Key: path,
      Body: file.data,
      ContentType: file.mimetype,
      Metadata: { "Cache-Control": "max-age=31536000" },
    };

    s3bucket.upload(params, function (err, data) {
      if (err) return reject(`error in callback:${err}`);
      resolve(data.Location);
    });
  });
}

function getSignedUrl(path) {
  const s3bucket = new AWS.S3({ endpoint: config.CELLAR_ENDPOINT_SUPPORT, accessKeyId: config.CELLAR_KEYID_SUPPORT, secretAccessKey: config.CELLAR_KEYSECRET_SUPPORT });
  return s3bucket.getSignedUrl("getObject", { Bucket: config.PUBLIC_BUCKET_NAME_SUPPORT, Key: path, Expires: 60 * 5 });
}

const getFile = (path, bucket) => {
  const p = new Promise((resolve, reject) => {
    const s3bucket = new AWS.S3({ endpoint: config.CELLAR_ENDPOINT_SUPPORT, accessKeyId: config.CELLAR_KEYID_SUPPORT, secretAccessKey: config.CELLAR_KEYSECRET_SUPPORT });
    const params = { Bucket: bucket || config.PUBLIC_BUCKET_NAME_SUPPORT, Key: path };
    s3bucket.getObject(params, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
  return p;
};

function deleteFile(path) {
  return new Promise((resolve, reject) => {
    const s3bucket = new AWS.S3({ endpoint: config.CELLAR_ENDPOINT_SUPPORT, accessKeyId: config.CELLAR_KEYID_SUPPORT, secretAccessKey: config.CELLAR_KEYSECRET_SUPPORT });
    const params = { Bucket: config.PUBLIC_BUCKET_NAME_SUPPORT, Key: path };
    s3bucket.deleteObject(params, (err, data) => {
      if (err) return reject(`error in callback:${err}`);
      resolve(data);
    });
  });
}

///S3\\\

const setAgent = async (ticket) => {
  try {
    const agent = await AgentModel.findById(ticket.agentId);
    ticket.agentFirstName = agent.firstName;
    ticket.agentLastName = agent.lastName;
    ticket.agentEmail = agent.email;
    return ticket;
  } catch (error) {
    capture(error);
  }
};

const setContact = async (ticket) => {
  try {
    const contact = await ContactModel.findOne({ _id: ticket.contactId });
    ticket.contactFirstName = contact.firstName;
    ticket.contactLastName = contact.lastName;
    ticket.contactEmail = contact.email;
    return ticket;
  } catch (error) {
    capture(error);
  }
};

const weekday = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const getHoursDifference = (date1, date2) => {
  const diff = date1.getTime() - date2.getTime();
  return diff / (1000 * 60 * 60);
};

async function updateTicketAgentViewings() {
  try {
    const tickets = await TicketModel.find({ viewingAgent: { $gt: [] } });
    for (let ticket of tickets) {
      ticket.viewingAgent = [];
      await ticket.save();
    }
  } catch (error) {
    capture(error);
  }
}

function diacriticSensitiveRegex(string = "") {
  return string.replace(/a/g, "[a,á,à,ä,â]").replace(/e/g, "[e,é,ë,è]").replace(/i/g, "[i,í,ï,ì]").replace(/o/g, "[o,ó,ö,ò]").replace(/u/g, "[u,ü,ú,ù]");
}
module.exports = {
  ERRORS,
  uploadPublicPicture,
  validatePassword,
  sendEmailWithConditions,
  setAgent,
  setContact,
  getSignedUrl,
  getFile,
  deleteFile,
  uploadAttachment,
  getTicketHistory,
  weekday,
  getHoursDifference,
  SENDINBLUE_TEMPLATES,
  sendNotif,
  diacriticSensitiveRegex,
  sendReferentReport,
};
