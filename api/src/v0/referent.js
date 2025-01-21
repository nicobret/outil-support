const express = require("express");
const passport = require("passport");
const router = express.Router();
const { capture } = require("../sentry");
const AgentModel = require("../models/agent");
const OrganisationModel = require("../models/organisation");

const WRONG_REQUEST = "WRONG_REQUEST";
const SERVER_ERROR = "SERVER_ERROR";
const NOT_FOUND = "NOT FOUND";

router.post("/", passport.authenticate("apikey", { session: false }), async (req, res) => {
  try {
    const agentsSNU = req.body.referents;
    for (let agentSNU of agentsSNU) {
      let agent = await AgentModel.findOne({ snuReferentId: agentSNU._id });
      if (!agent) agent = await AgentModel.findOne({ email: agentSNU.email });
      else if (agent.email !== agentSNU.email) {
        await AgentModel.findOneAndDelete({ email: agentSNU.email });
      }

      if (agent) {
        if (isIdenticalAgent(agent, agentSNU)) continue;
        agent.email = agentSNU.email;
        agent.firstName = agentSNU.firstName;
        agent.lastName = agentSNU.lastName;
        agent.departments = agentSNU.department;
        agent.region = agentSNU.region;
        agent.role = agentSNU.role.toUpperCase();
        agent.snuReferentId = agentSNU._id;
        await agent.save();
      } else {
        const organisation = await OrganisationModel.findOne({ name: "SNU" });
        await AgentModel.create({
          snuReferentId: agentSNU._id,
          email: agentSNU.email,
          firstName: agentSNU.firstName,
          lastName: agentSNU.lastName,
          departments: agentSNU.department,
          region: agentSNU.region,
          role: agentSNU.role.toUpperCase(),
          organisationId: organisation._id,
        });
      }
    }
    return res.status(200).send({ ok: true });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.delete("/", passport.authenticate("apikey", { session: false }), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).send({ ok: false, code: "INVALID_REQUEST" });

    const agent = await AgentModel.findOne({ email });
    if (!agent) return res.status(404).send({ ok: false, code: "NOT_FOUND" });

    await agent.deleteOne();
    return res.status(200).send({ ok: true });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: "SERVER_ERROR", error });
  }
});

module.exports = router;

function isIdenticalAgent(agentBdd, agentSnu) {
  if (agentBdd.email !== agentSnu.email) return false;
  if (agentBdd.firstName !== agentSnu.firstName) return false;
  if (agentBdd.lastName !== agentSnu.lastName) return false;
  if (agentBdd.region !== agentSnu.region) return false;
  if (agentBdd.departments !== agentSnu.department) return false;
  if (agentBdd.role !== agentSnu.role.toUpperCase()) return false;
  return true;
}
