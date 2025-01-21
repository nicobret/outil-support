const express = require("express");
const passport = require("passport");
const router = express.Router();
const { capture } = require("../sentry");
const MessageModel = require("../models/message");
const TicketModel = require("../models/ticket");
const { matchVentilationRule } = require("../utils/ventilation");

const { sendEmailWithConditions, getFile, deleteFile, uploadAttachment, getTicketHistory, getHoursDifference, sendNotif, SENDINBLUE_TEMPLATES, getSignedUrl } = require("../utils");
const { decrypt, encrypt } = require("../utils/crypto");
const { getS3Path } = require("../utils/file");

const WRONG_REQUEST = "WRONG_REQUEST";
const SERVER_ERROR = "SERVER_ERROR";

router.post("/", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const { message, ticketId, slateContent, copyRecipient, dest, messageHistory } = req.body;
    const user = req.user;
    let ticket = await TicketModel.findById(ticketId);
    if (!ticket) return res.status(400).send({ ok: false, code: WRONG_REQUEST });

    const messageCount = await MessageModel.find({ ticketId: ticket._id }).countDocuments();
    if (ticket.messageCount === 1) {
      ticket.firstResponseAgentAt = new Date();
      ticket.firstResponseAgentTime = getHoursDifference(new Date(), ticket.createdAt);
    }
    ticket.messageCount = messageCount + 1;
    ticket.updatedAt = new Date();
    ticket.messageDraft = "";
    ticket.status = "OPEN";
    ticket.textMessage.push(message);
    ticket.lastUpdateAgent = req.user._id;
    if (user.role === "AGENT") {
      ticket.agentId = user._id;
      ticket.agentLastName = user.lastName;
      ticket.agentFirstName = user.firstName;
      ticket.agentEmail = user.email;
    }
    if (user.role === "REFERENT_DEPARTMENT") {
      ticket.agentId = "6221baf75282c875b597b6f2";
      ticket.agentLastName = "Référent";
      ticket.agentFirstName = "Réponse";
      ticket.agentEmail = "se.legoff@gmail.com";
      ticket.referentDepartmentId = user._id;
      ticket.referentDepartmentFirstName = user.lastName;
      ticket.referentDepartmentLastName = user.firstName;
      ticket.referentDepartmentEmail = user.email;
    }
    if (user.role === "REFERENT_REGION") {
      ticket.agentId = "6221baf75282c875b597b6f2";
      ticket.agentLastName = "Référent";
      ticket.agentFirstName = "Réponse";
      ticket.agentEmail = "se.legoff@gmail.com";
      ticket.referentRegionId = user._id;
      ticket.referentRegionFirstName = user.lastName;
      ticket.referentRegionLastName = user.firstName;
      ticket.referentRegionEmail = user.email;
    }
    if (ticket.status === "CLOSED") {
      ticket.closedAt = new Date();
      if (!ticket.closedTimeHours) ticket.closedTimeHours = Number(getHoursDifference(new Date(), ticket.createdAt)).toFixed(2);
    }
    ticket = await matchVentilationRule(ticket);
    await ticket.save();

    const dataMessage = await MessageModel.create({
      ticketId,
      authorId: req.user._id,
      authorLastName: req.user.lastName,
      authorFirstName: req.user.firstName,
      text: message,
      slateContent,
      copyRecipient,
      fromEmail: "contact@mail-support.snu.gouv.fr",
      toEmail: dest,
    });
    ticket.textMessage.push(message);

    const lastMessage = ticket.textMessage[ticket.textMessage.length - 1].replace(/\\n/g, "<br>");

    if (ticket.canal === "MAIL" || ticket.contactGroup === "unknown") {
      await sendEmailWithConditions({ ticket, copyRecipient: dataMessage.copyRecipient, dest, messageHistory, lastMessageId: dataMessage._id });
    } else {
      await sendNotif({ ticket, templateId: SENDINBLUE_TEMPLATES.ANSWER_RECEIVED, message: lastMessage });
    }

    return res.status(200).send({ ok: true, dataMessage });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.get("/", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const ticketId = req.query.ticketId;
    if (!ticketId) return res.status(400).send({ ok: false, code: WRONG_REQUEST });
    const data = await MessageModel.find({ ticketId });
    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

// GET s3File buffer
router.post("/s3file", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const file = await getFile(`${req.body.path}`);
    const buffer = decrypt(file.Body);
    return res.status(200).send({ ok: true, data: buffer });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

// GET s3File temp public url
router.post("/s3file/publicUrl", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const file = await getFile(`${req.body.path}`);
    // decrypt and upload the file to a temp private folder (deleted after 1 day)
    const tempPath = req.body.path.replace("message", "temp");
    await uploadAttachment(tempPath, { mimetype: file.ContentType, data: decrypt(file.Body) });
    // get a temp public url
    const url = await getSignedUrl(tempPath);
    return res.status(200).send({ ok: true, data: url });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.delete("/s3file/:id", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    await deleteFile(req.body.path);
    const message = await MessageModel.findById(req.params.id);
    message.files = message.files.filter((file) => file.path !== req.body.path);
    await message.save();
    return res.status(200).send({ ok: true });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.post("/sendEmailFile/:id", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const id = req.params.id;
    let ticket = await TicketModel.findById(id);
    if (!ticket) return res.status(400).send({ ok: false, code: WRONG_REQUEST });

    let parsedBody;

    try {
      if (typeof req.body.body === "string") {
        parsedBody = JSON.parse(req.body.body);
      }

      if (Array.isArray(req.body.body)) {
        parsedBody = JSON.parse(req.body.body[0]);
      }

      if (!parsedBody) {
        throw new Error("req.body.body is not a string or an array of strings");
      }
    } catch (error) {
      capture(error);
      return res.status(400).send({ ok: false, code: WRONG_REQUEST, error: "Invalid request format" });
    }

    const { message: messageHtml, copyRecipient, dest, messageHistory } = parsedBody;
    const files = Object.keys(req.files || {}).map((e) => req.files[e]);
    // If multiple file with same names are provided, file is an array. We just take the latest.

    const mailFormatFiles = [];
    for (let file of files) {
      let base64content = file.data.toString("base64");
      mailFormatFiles.push({ content: base64content, name: file.name });
    }

    const message = await MessageModel.create({
      ticketId: ticket._id,
      authorId: req.user._id,
      authorLastName: req.user.lastName,
      authorFirstName: req.user.firstName,
      text: `${messageHtml}`,
      copyRecipient,
    });
    if (ticket.canal === "MAIL") {
      const mail = await sendEmailWithConditions({ ticket, copyRecipient, dest, attachment: mailFormatFiles, messageHistory, lastMessageId: message._id });
      if (!mail || mail.code) {
        capture("Error with SIB :", JSON.stringify({ mail, ticket, copyRecipient, dest, attachment: mailFormatFiles, messageHistory, lastMessageId: message._id }));
        return res.status(400).send({ ok: false, code: WRONG_REQUEST });
      }
    }
    for (let file of files) {
      const { name, data, mimetype } = file;
      const path = getS3Path(name);
      const encryptedBuffer = encrypt(data);
      const encryptedFile = { mimetype, encoding: "7bit", data: encryptedBuffer };
      const url = await uploadAttachment(path, encryptedFile);
      if (url) {
        message.files.push({ name: file.name, path, url });
      }
    }
    await message.save();
    ticket.messageCount = ticket.messageCount + 1;
    ticket.updatedAt = new Date();
    ticket.messageDraft = "";
    ticket.status = "CLOSED";
    ticket.textMessage.push(messageHtml);
    ticket.lastUpdateAgent = req.user._id;
    await ticket.save();
    return res.status(200).send({ ok: true });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

module.exports = router;
