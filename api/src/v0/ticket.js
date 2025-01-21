const express = require("express");
const router = express.Router();
const passport = require("passport");
const { capture } = require("../sentry");
const TicketModel = require("../models/ticket");
const ContactModel = require("../models/contact");
const MessageModel = require("../models/message");

const WRONG_REQUEST = "WRONG_REQUEST";
const SERVER_ERROR = "SERVER_ERROR";
const NOT_FOUND = "NOT_FOUND";

router.get("/", passport.authenticate("apikey", { session: false }), async (req, res) => {
  try {
    const query = { email: req.query.email.toLowerCase() };
    const contact = await ContactModel.findOne(query);
    let tickets = [];
    if (contact) tickets = await TicketModel.find({ contactId: contact._id });
    return res.status(200).send({ ok: true, data: tickets });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.get("/withMessages", passport.authenticate("apikey", { session: false }), async (req, res) => {
  try {
    const ticket = await TicketModel.findOne({ _id: req.query.ticketId });
    if (!ticket) return res.status(404).send({ ok: false, code: NOT_FOUND });
    const messages = await MessageModel.find({ ticketId: ticket._id });

    if (!messages.length) return res.status(404).send({ ok: false, code: NOT_FOUND });
    return res.status(200).send({ ok: true, data: { ticket, messages } });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.post("/search", passport.authenticate("apikey", { session: false }), async (req, res) => {
  try {
    let query = { $and: [] };
    let queryContactAttributes = {
      $and: [],
    };
    if (req.body.hasOwnProperty("department")) {
      for (const department of req.body.department) {
        queryContactAttributes.$and.push({ contactAttributes: { $elemMatch: { value: department } } });
      }
    }
    if (req.body.hasOwnProperty("region")) queryContactAttributes.$and.push({ contactAttributes: { $elemMatch: { value: req.body.region } } });
    if (req.body.hasOwnProperty("role")) queryContactAttributes.$and.push({ contactAttributes: { $elemMatch: { value: req.body.role } } });
    if (queryContactAttributes.$and.length > 0) query.$and.push(queryContactAttributes);
    if (req.body.hasOwnProperty("subject")) query.$and.push({ subject: { $regex: req.body.subject } });

    let queryOpenAndNew = JSON.parse(JSON.stringify(query));
    queryOpenAndNew.$and.push({ status: { $in: ["OPEN", "NEW"] } });

    let queryClosed = query;
    queryClosed.$and.push({ status: "CLOSED" });
    queryClosed.$and.push({ updatedAt: { $gte: getDate(new Date(), -30) } });
    const queryOr = {
      $or: [queryOpenAndNew, queryClosed],
    };

    const tickets = await TicketModel.find(queryOr);
    if (!tickets) return res.status(404).send({ ok: false, code: NOT_FOUND });
    return res.status(200).send({ ok: true, data: tickets });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.post("/count", passport.authenticate("apikey", { session: false }), async (req, res) => {
  try {
    let query = { $and: [] };
    let queryContactAttributes = { $and: [] };

    if (req.body.hasOwnProperty("department")) {
      queryContactAttributes.$and.push({ contactAttributes: { $elemMatch: { value: { $in: req.body.department } } } });
    }
    if (req.body.hasOwnProperty("region")) {
      queryContactAttributes.$and.push({ contactAttributes: { $elemMatch: { value: req.body.region } } });
    }
    if (req.body.hasOwnProperty("role")) {
      queryContactAttributes.$and.push({ contactAttributes: { $elemMatch: { value: req.body.role } } });
    }
    if (queryContactAttributes.$and.length > 0) {
      query.$and.push(queryContactAttributes);
    }
    if (req.body.hasOwnProperty("subject")) {
      query.$and.push({ subject: { $regex: req.body.subject } });
    }

    let queryOpenAndNew = JSON.parse(JSON.stringify(query));
    queryOpenAndNew.$and.push({ status: { $in: ["OPEN", "NEW"] } });

    let queryClosed = JSON.parse(JSON.stringify(query));
    queryClosed.$and.push({ status: "CLOSED" });
    queryClosed.$and.push({ updatedAt: { $gte: getDate(new Date(), -30) } });

    const queryOr = {
      $or: [queryOpenAndNew, queryClosed],
    };

    const pipeline = [{ $match: queryOr }, { $group: { _id: "$status", total: { $sum: 1 } } }];
    const tickets = await TicketModel.aggregate(pipeline);
    if (!tickets) return res.status(404).send({ ok: false, code: NOT_FOUND });
    return res.status(200).send({ ok: true, data: tickets });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.put("/:id", passport.authenticate("apikey", { session: false }), async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await TicketModel.findOneAndUpdate({ _id: req.params.id }, { status });
    if (!ticket) return res.status(404).send({ ok: false, code: NOT_FOUND });
    await ticket.index();
    return res.status(200).send({ ok: true, data: ticket });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

module.exports = router;

function getDate(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
