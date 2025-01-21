const express = require("express");
const passport = require("passport");
const router = express.Router();
const { capture } = require("../sentry");
const MessageModel = require("../models/message");
const TicketModel = require("../models/ticket");
const ContactModel = require("../models/contact");
const AgentModel = require("../models/agent");
const mongoose = require("mongoose");
const { matchVentilationRule } = require("../utils/ventilation");
const { weekday, sendNotif, SENDINBLUE_TEMPLATES } = require("../utils");

const WRONG_REQUEST = "WRONG_REQUEST";
const SERVER_ERROR = "SERVER_ERROR";
const NOT_FOUND = "NOT FOUND";

router.get("/", passport.authenticate("apikey", { session: false }), async (req, res) => {
  try {
    const query = {};
    if (req.query.ticketId) query.ticketId = req.query.ticketId;
    const data = await MessageModel.find(query);
    if (!data.length) return res.status(404).send({ ok: false, code: NOT_FOUND });
    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.post("/", passport.authenticate("apikey", { session: false }), async (req, res) => {
  try {
    const { subject, message, source, email, firstName, lastName, ticketId, attributes, author, formSubjectStep1, formSubjectStep2, tags, files, parcours } = req.body;
    const valuesForMail = ["young exterior", "admin exterior", "administrateur_cle", "referent_classe"];

    const organisation = req.user;

    const flatAttributes = (arr) => arr.map((e) => e.name);
    const filterAttributes = flatAttributes(attributes).map((e) => {
      if (flatAttributes(organisation.attributes).includes(e)) {
        return { name: e, value: attributes.find((att) => att.name === e).value, format: organisation.attributes.find((att) => att.name === e).format };
      }
      return null;
    });
    const contactGroupAttribute = filterAttributes.find((att) => att.name === "role");

    if (Array.isArray(filterAttributes.find((att) => att.name === "departement").value)) {
      filterAttributes.find((att) => att.name === "departement").value = filterAttributes.find((att) => att.name === "departement").value[0];
    }

    let user = await ContactModel.findOneAndUpdate({ email: email.toLowerCase() }, { email: email.toLowerCase(), firstName, lastName, attributes: filterAttributes });
    if (!user) user = await AgentModel.findOne({ email: email.toLowerCase() });
    if (!user) user = await ContactModel.create({ email: email.toLowerCase(), firstName, lastName, attributes: filterAttributes });

    let ticket = await TicketModel.findById(ticketId);
    if (ticket) {
      ticket.status = "OPEN";
      ticket.messageCount = ticket.messageCount + 1 || 2;
      ticket.textMessage.push(message);
    }
    const lastTicket = await TicketModel.find().sort({ number: -1 }).collation({ locale: "en_US", numericOrdering: true }).limit(1);

    if (!ticket) {
      ticket = await TicketModel.create({
        number: Number(lastTicket[0].number) + 1,
        contactId: user._id,
        contactLastName: user.lastName,
        contactFirstName: user.firstName,
        contactEmail: user.email,
        contactAttributes: filterAttributes,
        contactGroup: contactGroupAttribute?.value || "unknown",
        contactDepartment: filterAttributes?.find((att) => att?.name === "departement")?.value,
        contactCohort: filterAttributes?.find((att) => att?.name === "cohorte")?.value,
        contactRegion: filterAttributes?.find((att) => att?.name === "region")?.value,
        source,
        status: "NEW",
        subject,
        author,
        parcours,
        formSubjectStep1: subject.includes("question") ? "QUESTION" : formSubjectStep1,
        formSubjectStep2,
        canal: valuesForMail.includes(contactGroupAttribute?.value) ? "MAIL" : "PLATFORM",
        tags: tags || [],
        textMessage: [message],
        createdHourAt: new Date().getHours(),
        createdDayAt: weekday[new Date().getDay()],
      });

      ticket = await matchVentilationRule(ticket);

      await ticket.index();
      await sendNotif({ ticket, templateId: SENDINBLUE_TEMPLATES.MESSAGE_RECEIVED, message });
    }
    if (!ticket) return res.status(400).send({ ok: false, code: WRONG_REQUEST });

    ticket.updatedAt = new Date();

    await ticket.save();

    let formatedMessage = "<p> " + message.replaceAll("\n", " <br> ") + " </p>";
    formatedMessage = urlify(formatedMessage);

    const newMessage = await MessageModel.create({
      ticketId: ticket._id,
      authorId: user._id,
      authorLastName: user.lastName,
      authorFirstName: user.firstName,
      text: formatedMessage,
      files,
    });

    if (!newMessage) return res.status(400).send({ ok: false, code: WRONG_REQUEST });

    return res.status(200).send({ ok: true, data: { ticket, message: newMessage } });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

module.exports = router;

function urlify(text) {
  var urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, function (url) {
    return ' <a href="' + url + '" target="_blank"> ' + url + " </a> ";
  });
}
