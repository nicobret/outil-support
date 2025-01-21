const express = require("express");
const router = express.Router();
const passport = require("passport");
const { capture } = require("../sentry");
const KbSearchModel = require("../models/kbSearch");
const { diacriticSensitiveRegex } = require("../utils");

const esClient = require("../es");

const SERVER_ERROR = "SERVER_ERROR";

router.post("/", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    console.log("req.body", req.body);
    let query = {};
    const q = req.body.q || "";
    query.search = { $regex: diacriticSensitiveRegex(q), $options: "-i" };
    // console.log(new Date(req.body,))
    if (req.body.filter.contactGroup?.length > 0) {
      query = {
        ...query,
        role: { $in: req.body.filter.contactGroup },
      };
    }
    if (req.body.filter.beginningDate) {
      query = {
        ...query,
        createdAt: { $gte: req.body.filter.beginningDate },
      };
    }
    if (req.body.filter.endingDate) {
      query = {
        ...query,
        createdAt: { $lte: req.body.filter.endingDate },
      };
    }
    if (req.body.filter.beginningDate && req.body.filter.endingDate) {
      query = {
        ...query,
        createdAt: { $gte: req.body.filter.beginningDate, $lte: req.body.filter.endingDate },
      };
    }
    const data = await KbSearchModel.find(query).sort({ createdAt: -1 });

    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

module.exports = router;
