const express = require("express");
const router = express.Router();
const passport = require("passport");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { capture } = require("../sentry");
const esClient = require("../es");
const OrganisationModel = require("../models/organisation");

const config = require("../config");
const AgentModel = require("../models/agent");
const { ERRORS } = require("../utils");
const { validatePassword } = require("../utils");
const { cookieOptions, logoutCookieOptions } = require("../cookie-options");
const { JWT_MAX_AGE, JWT_VERSION } = require("../jwt-options");

const { sendEmail } = require("../sendinblue");

const USER_NOT_EXISTS = "USER_NOT_EXISTS";
const SERVER_ERROR = "SERVER_ERROR";
const EMAIL_OR_PASSWORD_INVALID = "EMAIL_OR_PASSWORD_INVALID";
const PASSWORD_NOT_VALIDATED = "PASSWORD_NOT_VALIDATED";
const USER_ALREADY_REGISTERED = "USER_ALREADY_REGISTERED";
const PASSWORD_TOKEN_EXPIRED_OR_INVALID = "PASSWORD_TOKEN_EXPIRED_OR_INVALID";

const requireRole = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).send({ ok: false, code: "FORBIDDEN ACCESS" });
  }
  next();
};

router.post("/signin", async (req, res) => {
  let { password, email } = req.body;
  email = (email || "").trim().toLowerCase();

  if (!email || !password) return res.status(400).send({ ok: false, code: EMAIL_AND_PASSWORD_REQUIRED });

  try {
    const user = await AgentModel.findOne({ email });
    if (!user) return res.status(401).send({ ok: false, code: USER_NOT_EXISTS });

    const userWithPassword = await AgentModel.findById(user._id).select("password");
    // TODO: remove this code when all new users have password
    if (!userWithPassword.password) {
      user.set({ password });
      await user.save();
    } else {
      const match = config.ENVIRONMENT === "development" || (await userWithPassword.comparePassword(password));
      if (!match) return res.status(401).send({ ok: false, code: EMAIL_OR_PASSWORD_INVALID });
    }

    user.set({ lastLoginAt: Date.now() });
    await user.save();
    const token = jwt.sign({ __v: JWT_VERSION, _id: user._id }, config.SECRET, {
      expiresIn: JWT_MAX_AGE,
    });
    res.cookie("jwtzamoud", token, cookieOptions());
    const organisations = await OrganisationModel.find({});

    return res.status(200).send({ ok: true, user, organisation: organisations[0], token });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR });
  }
});

router.post("/logout", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    res.clearCookie("jwtzamoud", logoutCookieOptions());
    return res.status(200).send({ ok: true });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, error });
  }
});

router.post("/", passport.authenticate("agent", { session: false }), requireRole("AGENT"), async (req, res) => {
  try {
    const { firstName, lastName, role } = req.body;
    const email = req.body.email.toLowerCase();
    const password = crypto.randomBytes(16).toString("hex");

    if (!validatePassword(password)) return res.status(200).send({ ok: false, code: PASSWORD_NOT_VALIDATED });

    const organisation = await OrganisationModel.findOne({ name: "SNU" });

    const user = await AgentModel.create({
      firstName,
      lastName,
      password,
      email,
      role,
      organisationId: organisation._id,
    });

    return res.status(200).send({ data: { user, organisation }, ok: true });
  } catch (error) {
    if (error.code === 11000) return res.status(200).send({ ok: false, code: USER_ALREADY_REGISTERED });
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR });
  }
});

router.delete("/:id", passport.authenticate("agent", { session: false }), requireRole("AGENT"), async (req, res) => {
  try {
    const { id } = req.params;
    const agent = await AgentModel.findById(id);
    if (!agent) {
      return res.status(404).send({ ok: false, code: USER_NOT_EXISTS });
    }
    await AgentModel.findByIdAndDelete(id);
    return res.status(200).send({ ok: true, message: "Agent deleted successfully" });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR });
  }
});

router.put("/", passport.authenticate("agent", { session: false }), requireRole("AGENT"), async (req, res) => {
  try {
    let _id = req.user._id;
    const user = await AgentModel.findOneAndUpdate({ _id }, req.body, { new: true });
    res.status(200).send({ ok: true, user });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.put("/:id", passport.authenticate("agent", { session: false }), requireRole("AGENT"), async (req, res) => {
  try {
    const obj = {};
    if (req.body.hasOwnProperty("firstName")) obj.firstName = req.body.firstName;
    if (req.body.hasOwnProperty("lastName")) obj.lastName = req.body.lastName;
    if (req.body.hasOwnProperty("email")) obj.email = req.body.email;
    await AgentModel.findOneAndUpdate({ _id: req.user._id, organisationId: req.user.organisationId }, obj, { new: true });
    return res.status(200).send({ ok: true });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.get("/me", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const { user } = req;
    user.set({ lastLoginAt: Date.now() });
    const organisation = await OrganisationModel.findOne({ _id: user.organisationId });
    await user.save();

    res.send({ user, organisation, ok: true, token: req.cookies.jwtzamoud });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR });
  }
});

router.get("/", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const agents = await AgentModel.find({});
    const obj = { AGENT: [], REFERENT_DEPARTMENT: [], REFERENT_REGION: [], DG: [] };
    agents.map((a) => obj[a.role].push(a));
    return res.status(200).send({ ok: true, data: obj });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR });
  }
});

router.post("/forgot_password", async (req, res) => {
  try {
    const agent = await AgentModel.findOne({ email: req.body.email.toLowerCase() });
    if (!agent) return res.status(404).send({ ok: false, code: USER_NOT_EXISTS });
    const token = crypto.randomBytes(20).toString("hex");
    agent.set({ forgotPasswordResetToken: token, forgotPasswordResetExpires: Date.now() + JWT_MAX_AGE });
    await agent.save();
    const subject = "Réinitialiser votre mot de passe";
    const body = `Une demande de réinitialisation de mot de passe a été faite, si elle vient bien de vous vous pouvez <a href="${config.SNU_URL}/auth/reset?token=${token}" style="color: #584FEC">cliquer ici pour réinitialiser votre mot de passe</a>`;
    await sendEmail({ htmlContent: body, subject, sender: { email: "contact@mail-support.snu.gouv.fr" }, to: [agent.email] });
    res.status(200).send({ ok: true });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR });
  }
});

router.post("/forgot_password_reset", async (req, res) => {
  try {
    const agent = await AgentModel.findOne({ forgotPasswordResetToken: req.body.token, forgotPasswordResetExpires: { $gt: Date.now() } });
    if (!agent) return res.status(400).send({ ok: false, code: PASSWORD_TOKEN_EXPIRED_OR_INVALID });
    if (req.body.password !== req.body.passwordConfirm) return res.status(400).send({ ok: false, code: PASSWORD_NOT_VALIDATED });
    if (!validatePassword(req.body.password)) return res.status(400).send({ ok: false, code: PASSWORD_NOT_VALIDATED });

    agent.password = req.body.password;
    agent.forgotPasswordResetToken = "";
    agent.forgotPasswordResetExpires = "";
    await agent.save();
    return res.status(200).send({ ok: true });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR });
  }
});

router.get("/search", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    let query = {
      query: { multi_match: { query: req.query.q || "", fields: ["firstName", "email", "lastName"], type: "phrase_prefix" } },
      size: req.query.limit || 5,
      track_total_hits: true,
    };
    const { hits } = await esClient.search({ index: "agent", body: query });
    const data = hits.hits.map((e) => ({ _id: e._id, ...e._source }));

    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: ERRORS.SERVER_ERROR, error });
  }
});

// (async function getNewConnection() {
//   try {
//     const newConnectionAgent = await AgentModel.find({ lastLoginAt: { $gt: "2022-09-14T09:00:03.199Z" } });
//     console.log(newConnectionAgent);
//   } catch (error) {}
// })();

module.exports = router;
