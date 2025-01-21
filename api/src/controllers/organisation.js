const express = require("express");
const router = express.Router();
const passport = require("passport");

const { capture } = require("../sentry");
const OrganisationModel = require("../models/organisation");

const SERVER_ERROR = "SERVER_ERROR";

router.get("/", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const q = req.query.q;
    const data = await OrganisationModel.find({ name: new RegExp(q, "i") });
    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.put("/:id", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const organisation = await OrganisationModel.findById(req.params.id);
    if (!organisation) return res.status(404).send({ ok: false, code: NOT_FOUND });
    var obj = {};

    if (req.body.hasOwnProperty("attributes")) {
      obj.attributes = req.body.attributes;
      const filteredAttributes = obj.attributes.map((e) => {
        return { name: e.name, format: e.type };
      });
      organisation.set({ attributes: filteredAttributes });
    }

    if (req.body.hasOwnProperty("imapConfig")) {
      obj.imapConfig = req.body.imapConfig;
      organisation.set({ imapConfig: obj.imapConfig });
    }

    if (req.body.hasOwnProperty("knowledgeBaseBaseUrl")) {
      obj.knowledgeBaseBaseUrl = req.body.knowledgeBaseBaseUrl;
      organisation.set({ knowledgeBaseBaseUrl: obj.knowledgeBaseBaseUrl });
    }

    if (req.body.hasOwnProperty("knowledgeBaseRoles")) {
      obj.knowledgeBaseRoles = req.body.knowledgeBaseRoles;
      organisation.set({ knowledgeBaseRoles: obj.knowledgeBaseRoles });
    }

    if (req.body.hasOwnProperty("spamEmails")) {
      organisation.set({ spamEmails: req.body.spamEmails });
    }
    await organisation.save();

    return res.status(200).send({ ok: true, data: organisation });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

module.exports = router;
