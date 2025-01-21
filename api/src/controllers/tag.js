const express = require("express");
const router = express.Router();
const passport = require("passport");
const { capture } = require("../sentry");
const esClient = require("../es");
const TagModel = require("../models/tag");
const { diacriticSensitiveRegex } = require("../utils");

const SERVER_ERROR = "SERVER_ERROR";
const WRONG_REQUEST = "WRONG_REQUEST";

router.get("/search", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    let query = { deletedAt: null };
    const q = req.query.q;
    if (req.user.role === "REFERENT_DEPARTMENT" || req.user.role === "REFERENT_REGION") query.userVisibility = "ALL";
    query.name = { $regex: diacriticSensitiveRegex(q), $options: "-i" };
    const data = await TagModel.find(query).sort({ name: 1 });
    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.get("/", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    let query = { deletedAt: null };
    if (req.user.role === "REFERENT_DEPARTMENT" || req.user.role === "REFERENT_REGION") query.userVisibility = "ALL";
    const data = await TagModel.find(query);
    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.post("/", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    if (req.user.role !== "AGENT") {
      return res.status(403).send({ ok: false, code: WRONG_REQUEST });
    }
    const data = await TagModel.create(req.body);
    return res.status(200).send({ ok: true, data });
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
    if (req.body.hasOwnProperty("userVisibility")) obj.userVisibility = req.body.userVisibility;

    const data = await TagModel.findOneAndUpdate(query, obj);
    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.delete("/:id", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    await TagModel.findByIdAndDelete(req.params.id);

    await esClient.delete({ id: req.params.id, index: "tag", refresh: true });

    return res.status(200).send({ ok: true });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.put("/soft-delete/:id", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const tag = await TagModel.findById(req.params.id);
    if (!tag) {
      return res.status(404).send({ ok: false, message: "Tag not found" });
    }

    tag.deletedAt = new Date();
    await tag.save();

    return res.status(200).send({ ok: true });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

module.exports = router;
