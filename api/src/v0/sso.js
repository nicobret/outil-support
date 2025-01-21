const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { capture } = require("../sentry");
const AgentModel = require("../models/agent");
const config = require("../config");
const { JWT_MAX_AGE, JWT_VERSION } = require("../jwt-options");

const WRONG_REQUEST = "WRONG_REQUEST";
const SERVER_ERROR = "SERVER_ERROR";
const NOT_FOUND = "NOT_FOUND";

router.get("/signin", passport.authenticate("apikey", { session: false }), async (req, res) => {
  try {
    const query = { email: req.query.email };
    const agent = await AgentModel.findOne(query);
    if (!agent) return res.status(404).send({ ok: false, code: NOT_FOUND });

    agent.set({ lastLoginAt: Date.now() });
    await agent.save();

    const token = jwt.sign({ __v: JWT_VERSION, _id: agent._id }, config.SECRET, {
      expiresIn: JWT_MAX_AGE,
    });
    const redirectLink = `${config.SNU_URL}/ticket`;
    return res.status(200).send({ ok: true, data: redirectLink, token });
  } catch (e) {
    capture(e);
    return res.status(500).send({ ok: false, code: SERVER_ERROR });
  }
});

module.exports = router;
