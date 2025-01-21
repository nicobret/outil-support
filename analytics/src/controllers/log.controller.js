const express = require("express");
const router = express.Router();
const Joi = require("joi");

const { capture } = require("../sentry");
const LogTicketModel = require("../models/log-ticket.model");
const authMiddleware = require("../middlewares/auth.middleware");
const validationMiddleware = require("../middlewares/validation.middleware");

router.get("/", async (req, res) => {
  try {
    // const logs = await LogModel.findAll();
    // return res.status(200).send({ ok: false, data: logs });

    return res.status(200).send({ ok: true });
  } catch (error) {
    capture(error);
  }
});

router.post(
  "/ticket",
  authMiddleware,
  validationMiddleware({
    evenement_nom: Joi.string().trim().required(),
    evenement_type: Joi.string().trim().required(),
    evenement_valeur: Joi.string().allow(null, ""),
    ticket_id: Joi.string().allow(null, ""),
    ticket_source: Joi.string().allow(null, ""),
    ticket_contact_id: Joi.string().allow(null, ""),
    ticket_agent_id: Joi.string().allow(null, ""),
    ticket_tags_id: Joi.array().items(Joi.string()).allow(null),
    ticket_created_at: Joi.string().allow(null, ""),
    ticket_closed_at: Joi.string().allow(null, ""),
    date: Joi.string(),
    raw_data: Joi.object(),
  }),
  async ({ body }, res) => {
    try {
      body.date = new Date(body.date);

      const log = await LogTicketModel.create(body);
      return res.status(200).send({ ok: true, data: log });
    } catch (error) {
      console.log("Error ", error);
      capture(error);
    }
  },
);

module.exports = router;
