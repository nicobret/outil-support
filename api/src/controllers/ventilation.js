const express = require("express");
const router = express.Router();
const passport = require("passport");
const { capture } = require("../sentry");
const VentilationModel = require("../models/ventilation");

const SERVER_ERROR = "SERVER_ERROR";

router.post("/", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    req.body.userRole = req.user.role;
    const ventilation = await VentilationModel.create(req.body);
    return res.status(200).send({ ok: true, data: ventilation });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.get("/", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const ventilation = await VentilationModel.find({});
    return res.status(200).send({ ok: true, data: ventilation });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.put("/:id", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const query = { _id: req.params.id };
    const obj = {};
    if (req.body.hasOwnProperty("name")) obj.name = req.body.name;
    if (req.body.hasOwnProperty("description")) obj.description = req.body.description;
    if (req.body.hasOwnProperty("active")) obj.active = req.body.active;
    if (req.body.hasOwnProperty("conditionsOu")) obj.conditionsOu = req.body.conditionsOu;
    if (req.body.hasOwnProperty("conditionsEt")) obj.conditionsEt = req.body.conditionsEt;
    if (req.body.hasOwnProperty("actions")) obj.actions = req.body.actions;

    const data = await VentilationModel.findOneAndUpdate(query, obj);
    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.delete("/:id", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    await VentilationModel.findByIdAndDelete(req.params.id);
    return res.status(200).send({ ok: true });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

module.exports = router;
