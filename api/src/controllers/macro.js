const express = require("express");
const router = express.Router();
const passport = require("passport");
const { capture } = require("../sentry");
const TicketModel = require("../models/ticket");
const MacroModel = require("../models/macro");
const AgentModel = require("../models/agent");
const FolderModel = require("../models/folder");
const TagModel = require("../models/tag");
const ShortcutModel = require("../models/shortcut");
const MessageModel = require("../models/message");
const { sendEmailWithConditions, getHoursDifference } = require("../utils");

const SERVER_ERROR = "SERVER_ERROR";
const NOT_FOUND = "NOT_FOUND";

router.post("/", passport.authenticate("agent", { session: false }), async (req, res) => {
  const { firstName, lastName, role, _id } = req.user;
  try {
    const macro = await MacroModel.create({ ...req.body, updatedBy: { firstName, lastName, role, _id } });
    return res.status(200).send({ ok: true, data: macro });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.put("/:id", passport.authenticate("agent", { session: false }), async (req, res) => {
  const { firstName, lastName, role, _id } = req.user;
  try {
    const macro = await MacroModel.findById(req.params.id);
    if (!macro) {
      return res.status(404).send({ ok: false, code: NOT_FOUND });
    }

    macro.set({ ...req.body, updatedAt: new Date(), updatedBy: { firstName, lastName, role, _id } });
    await macro.save();

    return res.status(200).send({ ok: true, data: macro });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.delete("/:id", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const data = await MacroModel.findOneAndDelete({ _id: req.params.id });
    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.post("/:id", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const ticketsId = req.body.ticketsId;

    const agentId = req.body.agentId;
    const agent = await AgentModel.findById(agentId);
    if (!agent) return res.status(404).send({ ok: false, code: NOT_FOUND });
    const macros = await MacroModel.findById(req.params.id);
    if (!macros) return res.status(404).send({ ok: false, code: NOT_FOUND });
    let ticketId = "";
    for (let tickId of ticketsId) {
      let ticket = await TicketModel.findById(tickId);
      if (ticket._id === ticketId) return res.status(200).send({ ok: true });
      ticketId = JSON.parse(JSON.stringify(ticket._id));
      // set default agent
      ticket.set({ agentId: agent._id, agentLastName: agent.lastName, agentFirstName: agent.firstName });
      for (j = 0; j < macros.macroAction.length; j++) {
        const macroAction = macros.macroAction[j];
        if (macroAction.action === "SET") ticket = await setField(ticket, macroAction);
        if (macroAction.action === "DELETE") ticket = await deleteField(ticket, macroAction);
        if (macroAction.action === "ADDMESSAGE") ticket = await addShortcutMessage(ticket, macroAction, agent);
      }
      ticket.updatedAt = new Date();
      if (ticket.status === "CLOSED") {
        ticket.closedAt = new Date();
        if (!ticket.closedTimeHours) ticket.closedTimeHours = Number(getHoursDifference(new Date(), ticket.createdAt)).toFixed(2);
      }
      await ticket.save();
      await ticket.index();
    }

    return res.status(200).send({ ok: true });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.get("/", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const macro = await MacroModel.find(req.query);
    return res.status(200).send({ ok: true, data: macro });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

const setField = async (ticket, macroAction) => {
  try {
    if (macroAction.field === "tagsId") {
      const tag = await TagModel.findById(macroAction.value);

      if (!ticket.tagsId) ticket.tagsId = [];
      if (!ticket.tags) ticket.tags = [];

      ticket.set({
        tagsId: [...ticket.tagsId, tag._id],
        tags: [...ticket.tags, tag.name],
      });
    }

    if (macroAction.field === "folder") {
      const folder = await FolderModel.findById(macroAction.value);

      if (!ticket.foldersId) ticket.foldersId = [];
      if (!ticket.folders) ticket.folders = [];

      ticket.set({
        foldersId: [...ticket.foldersId, folder._id],
        folders: [...ticket.folders, folder.name],
      });
    }

    if (macroAction.field === "notes.content") {
      if (!ticket.notes) ticket.notes = [];
      ticket.notes.push({ content: macroAction.value, authorName: "supi-bot" });
    } else {
      Array.isArray(ticket[macroAction.field]) ? ticket[macroAction.field].push(macroAction.value) : ticket.set({ [macroAction.field]: macroAction.value });
    }

    if (macroAction.field === "agentId") {
      const agent = await AgentModel.findById(macroAction.value);
      ticket.set({ agentLastName: agent.lastName, agentFirstName: agent.firstName });
    }
    return ticket;
  } catch (error) {
    capture(error);
  }
};

const deleteField = async (ticket, macroAction) => {
  try {
    Array.isArray(ticket[macroAction.field])
      ? ticket.set({ [macroAction.field]: ticket[macroAction.field].filter((t) => t !== macroAction.value) })
      : delete ticket[macroAction.field];
    return ticket;
  } catch (error) {
    capture(error);
  }
};

const addShortcutMessage = async (ticket, macroAction, agent) => {
  try {
    const shortcut = await ShortcutModel.findOne({ _id: macroAction.value });
    const messageCount = await MessageModel.find({ ticketId: ticket._id }).countDocuments();
    if (messageCount === 1) {
      ticket.firstResponseAgentAt = new Date();
      ticket.firstResponseAgentTime = getHoursDifference(new Date(), ticket.createdAt);
    }
    ticket.messageCount = messageCount + 1;
    ticket.textMessage.push(shortcut.text);
    const message = await MessageModel.create({
      ticketId: ticket._id,
      authorId: agent._id,
      authorLastName: agent.lastName,
      authorFirstName: agent.firstName,
      text: shortcut.text,
      slateContent: shortcut.content,
    });

    if (ticket.canal === "MAIL") {
      await sendEmailWithConditions({ ticket, dest: ticket.contactEmail, lastMessageId: message._id });
    }
    return ticket;
  } catch (error) {
    capture(error);
  }
};

module.exports = router;
