const express = require("express");
const router = express.Router();
const passport = require("passport");
const { capture } = require("../sentry");
const TemplateModel = require("../models/template");

const SERVER_ERROR = "SERVER_ERROR";
const NOT_FOUND = "NOT_FOUND";

router.post("/", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const macro = await TemplateModel.create({ ...req.body, createdBy: req.user._id });
    return res.status(200).send({ ok: true, data: macro });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.put("/:id", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const template = await TemplateModel.findById(req.params.id);
    if (!template) {
      return res.status(404).send({ ok: false, code: NOT_FOUND });
    }

    template.set({ ...req.body, updatedAt: new Date() });
    await template.save();

    return res.status(200).send({ ok: true, data: template });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.delete("/:id", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const data = await TemplateModel.findOneAndDelete({ _id: req.params.id });
    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.get("/", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const templates = await TemplateModel.find(req.query).populate(["createdBy", "tags", "attributedTo"]);
    return res.status(200).send({ ok: true, data: templates });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

module.exports = router;
