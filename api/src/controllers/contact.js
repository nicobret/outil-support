const express = require("express");
const router = express.Router();
const passport = require("passport");
const { capture } = require("../sentry");
const ContactModel = require("../models/contact");
const AgentModel = require("../models/agent");
const esClient = require("../es");

const SERVER_ERROR = "SERVER_ERROR";
const NOT_FOUND = "NOT_FOUND";

router.get("/search", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const esQuery = {
      index: "contact",
      body: {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: req.query.q,
                  type: "bool_prefix",
                  fields: ["firstName", "email^2", "lastName^2"],
                },
              },
            ],
          },
        },
        size: 6,
      },
    };
    if (req.user.role === "REFERENT_DEPARTMENT") {
      esQuery.body.query.bool.filter = [
        {
          terms: { "department.keyword": req.user.departments },
        },
        {
          terms: { "role.keyword": ["young", "responsible", "supervisor"] },
        },
      ];
    }
    if (req.user.role === "REFERENT_REGION") {
      esQuery.body.query.bool.filter = [
        {
          term: { "region.keyword": req.user.region },
        },
        {
          terms: { "role.keyword": ["young", "responsible", "supervisor"] },
        },
      ];
    }
    const response = await esClient.search(esQuery);
    res.status(200).send({
      ok: true,
      data: response.hits.hits.map((hit) => ({
        _id: hit._id,
        ...hit._source,
      })),
    });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.get("/:id", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const id = req.params.id;
    let data = await ContactModel.findById(id);
    if (!data) data = await AgentModel.findById(id);
    if (!data) return res.status(404).send({ ok: false, code: NOT_FOUND });
    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

// WARNING check if exist, if no create it, does not send error if already exists but return the contact
router.post("/", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    var obj = {};
    if (req.body.hasOwnProperty("firstName")) obj.firstName = req.body.firstName;
    if (req.body.hasOwnProperty("lastName")) obj.lastName = req.body.lastName;
    if (req.body.hasOwnProperty("email")) obj.email = req.body.email.toLowerCase();

    let contact = await ContactModel.findOne({ email: obj.email });
    if (!contact) contact = await AgentModel.findOne({ email: obj.email });
    if (!contact)
      contact = await ContactModel.create({
        firstName: obj.firstName,
        lastName: obj.lastName,
        email: obj.email,
      });
    if (!contact) return res.status(404).send({ ok: false, code: NOT_FOUND });

    return res.status(200).send({ ok: true, data: contact });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR });
  }
});

module.exports = router;
