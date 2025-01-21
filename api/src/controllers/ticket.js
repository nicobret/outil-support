const express = require("express");
const router = express.Router();
const passport = require("passport");
const { capture } = require("../sentry");
const { captureMessage } = require("@sentry/node");
const esClient = require("../es");
const TicketModel = require("../models/ticket");
const ContactModel = require("../models/contact");
const AgentModel = require("../models/agent");
const MessageModel = require("../models/message");
const TagModel = require("../models/tag");

const { sendEmailWithConditions, weekday, getHoursDifference, sendNotif, SENDINBLUE_TEMPLATES } = require("../utils");
const { matchVentilationRule } = require("../utils/ventilation");

const WRONG_REQUEST = "WRONG_REQUEST";
const SERVER_ERROR = "SERVER_ERROR";
const NOT_FOUND = "NOT_FOUND";

router.post("/", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const { subject, contactEmail, canal, internalNote, tags, message, copyRecipients, files, agent } = req.body;
    const user = req.user;

    let contact = await ContactModel.findOne({ email: contactEmail.toLowerCase() });
    if (!contact) contact = await ContactModel.create({ email: contactEmail.toLowerCase() });

    if (!contact) return res.status(402).send({ ok: false, code: WRONG_REQUEST });
    const lastTicket = await TicketModel.find().sort({ number: -1 }).collation({ locale: "en_US", numericOrdering: true }).limit(1);

    const ticket = {
      number: Number(lastTicket[0].number) + 1,
      contactId: contact._id,
      contactLastName: contact.lastName,
      contactFirstName: contact.firstName,
      contactEmail: contact.email,
      contactAttributes: contact.attributes,
      contactGroup: contact.attributes?.find((att) => att?.name === "role")?.value || "unknown",
      contactDepartment: contact.attributes?.find((att) => att?.name === "departement")?.value,
      contactCohort: contact.attributes?.find((att) => att?.name === "cohorte")?.value,
      contactRegion: contact.attributes?.find((att) => att?.name === "region")?.value,
      source: "PLATFORM",
      status: "CLOSED",
      notes: internalNote,
      tagsId: tags.map((tag) => tag._id),
      subject,
      lastUpdateAgent: req.user._id,
      canal,
      createdHourAt: new Date().getHours(),
      createdDayAt: weekday[new Date().getDay()],
      createdBy: req.user.role,
    };
    if (user.role === "AGENT") {
      ticket.agentId = agent ? agent._id : user._id;
      ticket.agentLastName = agent ? agent.lastName : user.lastName;
      ticket.agentFirstName = agent ? agent.firstName : user.firstName;
      ticket.agentEmail = agent ? agent.email : user.email;
    }
    if (user.role === "REFERENT_DEPARTMENT" || user.role === "REFERENT_REGION") {
      const defaultReferent = await AgentModel.findOne({ isReferent: true });
      ticket.agentId = defaultReferent && defaultReferent._id;
      ticket.agentLastName = defaultReferent && defaultReferent.lastName;
      ticket.agentFirstName = defaultReferent && defaultReferent.firstName;
      ticket.agentEmail = defaultReferent && defaultReferent.email;
    }
    if (user.role === "REFERENT_DEPARTMENT") {
      ticket.referentDepartmentId = user._id;
      ticket.referentDepartmentFirstName = user.lastName;
      ticket.referentDepartmentLastName = user.firstName;
      ticket.referentDepartmentEmail = user.email;
      ticket.formSubjectStep1 = "QUESTION";
    }
    if (user.role === "REFERENT_REGION") {
      ticket.referentRegionId = user._id;
      ticket.referentRegionFirstName = user.lastName;
      ticket.referentRegionLastName = user.firstName;
      ticket.referentRegionEmail = user.email;
      ticket.formSubjectStep1 = "QUESTION";
    }
    let newTicket = await TicketModel.create(ticket);
    if (!newTicket) return res.status(400).send({ ok: false, code: WRONG_REQUEST });
    newTicket = await matchVentilationRule(newTicket);
    await newTicket.save();
    await newTicket.index();

    if (files.length === 0) {
      let newMessage = await MessageModel.create({
        ticketId: newTicket._id,
        text: message,
        authorId: user._id,
        authorFirstName: user.firstName,
        authorLastName: user.lastName,
        copyRecipient: copyRecipients,
        fromEmail: "contact@mail-support.snu.gouv.fr",
        toEmail: contact.email,
      });
      if (newTicket.canal === "MAIL") {
        await sendEmailWithConditions({ ticket: newTicket, dest: contact.email, copyRecipient: copyRecipients, lastMessageId: newMessage._id });
      } else {
        await sendNotif({ ticket: newTicket, templateId: SENDINBLUE_TEMPLATES.NEW_TICKET });
      }
      if (!newMessage) return res.status(400).send({ ok: false, code: WRONG_REQUEST });
    }

    return res.status(200).send({ ok: true, data: { ticket: newTicket } });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.post("/aggregate", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const field = req.body.field;
    if (!field) return res.status(400).send({ ok: false, code: WRONG_REQUEST });
    const query = { query: { match_all: {} }, size: 0, track_total_hits: true };
    query.aggs = { aggdata: { terms: { field } } };
    const d = await esClient.search({ index: "ticket", body: query });
    const facets = {};
    for (let i = 0; i < Object.keys(d.aggregations).length; i++) {
      const key = Object.keys(d.aggregations)[i];
      facets[key] = d.aggregations[key].buckets;
    }
    return res.status(200).send({ ok: true, data: facets.aggdata });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.post("/search", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const size = req.body.size || 10;
    const from = (req.body.page - 1) * size || 0;
    const query = { sort: [], query: { bool: { must: [], must_not: [] } }, size: size, from, track_total_hits: true };

    if (req.body.folderId) query.query.bool.must.push({ term: { "foldersId.keyword": req.body.folderId } });
    if (req.body.tag && req.body.tag !== "null") query.query.bool.must.push({ term: { "tagsId.keyword": req.body.tag } });
    // find tickets with empty tag array
    else if (req.body.tag && req.body.tag === "null") query.query.bool.must_not.push({ exists: { field: "tagsId" } });
    if (req.body.status === "TOTREAT") query.query.bool.must.push({ terms: { "status.keyword": ["NEW", "OPEN", "PENDING"] } });
    else if (req.body.status) query.query.bool.must.push({ term: { "status.keyword": req.body.status } });
    else query.query.bool.must.push({ terms: { "status.keyword": ["NEW", "OPEN", "PENDING", "CLOSED"] } });
    if (req.body.contactId) query.query.bool.must.push({ term: { "contactId.keyword": req.body.contactId } });
    if (req.user.role === "AGENT" && req.body.agentId) query.query.bool.must.push({ term: { "agentId.keyword": req.body.agentId } });
    else if (req.user.role === "REFERENT_DEPARTMENT" && req.body.agentId) query.query.bool.must.push({ term: { "referentDepartmentId.keyword": req.body.agentId } });
    else if (req.user.role === "REFERENT_REGION" && req.body.agentId) query.query.bool.must.push({ term: { "referentRegionId.keyword": req.body.agentId } });
    if (req.body.ticketId) query.query.bool.must.push({ term: { _id: req.body.ticketId } });
    if (req.body.sources?.length) query.query.bool.must.push({ terms: { "source.keyword": req.body.sources } });
    if (req.body.contactGroup?.length) query.query.bool.must.push({ terms: { "contactGroup.keyword": req.body.contactGroup } });
    if (req.body.contactDepartment?.length) query.query.bool.must.push({ terms: { "contactDepartment.keyword": req.body.contactDepartment } });
    if (req.body.contactCohort?.length) query.query.bool.must.push({ terms: { "contactCohort.keyword": req.body.contactCohort } });
    if (req.body.parcours?.length) query.query.bool.must.push({ terms: { "parcours.keyword": req.body.parcours } });
    if (req.body.agent?.includes("undefined")) {
      query.query.bool.must_not.push({ exists: { field: "agentId" } });
    } else if (req.body.agent?.length) query.query.bool.must.push({ terms: { "agentId.keyword": req.body.agent } });

    if (req.body.sorting === "AGENT") query.sort.push({ "agentLastName.keyword": "asc" }, { "agentFirstName.keyword": "asc" });
    else if (req.body.sorting === "CREATIONDATE") query.sort.push({ createdAt: "desc" });
    else query.sort.push({ updatedAt: "desc" });
    if (req.user.role === "REFERENT_DEPARTMENT") {
      query.query.bool.must.push({ terms: { "contactDepartment.keyword": req.user.departments } });
      query.query.bool.must.push({ term: { "formSubjectStep1.keyword": "QUESTION" } });
    }
    if (req.user.role === "REFERENT_REGION") {
      query.query.bool.must.push({ term: { "contactRegion.keyword": req.user.region } });
      query.query.bool.must.push({ term: { "formSubjectStep1.keyword": "QUESTION" } });
    }

    const body = [];
    body.push({ index: "ticket", type: "_doc" });
    body.push(query);
    body.push({ index: "ticket", type: "_doc" });

    //aggregation on all tickets without first filter on status or folder
    const must = query.query.bool.must.filter((item) =>
      item.term ? !item.term["status.keyword"] && !item.term["foldersId.keyword"] : !item.terms["status.keyword"] && !item.terms["foldersId.keyword"]
    );

    //advanced search query
    if (req.body.advancedSearch) {
      const advancedSearch = {
        multi_match: {
          query: req.body.advancedSearch,
          fields: ["subject^4", "contactEmail^4", "contactLastName^2", "contactFirstName", "textMessage^2", "number^3"],
          type: "phrase_prefix",
        },
      };
      query.query.bool.must.push(advancedSearch);
      must.push(advancedSearch);
    }
    const mustStatus = JSON.parse(JSON.stringify(must));
    if (req.body.folderId) mustStatus.push({ term: { "foldersId.keyword": req.body.folderId } });

    // aggregation on status
    body.push({ query: { bool: { must: mustStatus, must_not: query.query.bool.must_not } }, aggs: { status: { terms: { field: "status.keyword" } } } });
    body.push({ index: "ticket", type: "_doc" });

    //aggregation on folder
    const filterFolder = [];
    filterFolder.push({ terms: { "status.keyword": ["NEW"] } });

    body.push({
      query: { bool: { must } },
      aggs: { filtered: { filter: { bool: { must: filterFolder } }, aggs: { foldersId: { terms: { field: "foldersId.keyword", size: 200 } } } } },
    });

    // aggregation on department
    body.push({ index: "ticket", type: "_doc" });
    body.push({
      query: { bool: { must } },
      aggs: {
        contactDepartment: {
          terms: { field: "contactDepartment.keyword", size: 200 },
          aggs: {
            status: {
              terms: { field: "status.keyword" },
            },
          },
        },
      },
    });

    const d = await esClient.msearch({ body });

    const aggregations = {};
    for (let i = 0; i < Object.keys(d.responses[1].aggregations).length; i++) {
      const key = Object.keys(d.responses[1].aggregations)[i];
      aggregations[key] = d.responses[1].aggregations[key].buckets;
    }

    for (let i = 0; i < Object.keys(d.responses[2].aggregations.filtered).length; i++) {
      const key = Object.keys(d.responses[2].aggregations.filtered)[i];
      aggregations[key] = d.responses[2].aggregations.filtered[key].buckets;
    }

    for (let i = 0; i < Object.keys(d.responses[3].aggregations).length; i++) {
      const key = Object.keys(d.responses[3].aggregations)[i];
      aggregations[key] = d.responses[3].aggregations[key].buckets;
    }

    const total = d.responses[0].hits.total.value;
    const data = d.responses[0].hits.hits.map((item) => ({ ...item._source, _id: item._id }));

    return res.status(200).send({ ok: true, data, total, aggregations });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.get("/searchAll", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const query = {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: req.query.q || "",
                fields: ["subject^4", "contactEmail^4", "contactLastName^2", "contactFirstName", "textMessage^2", "number^3"],
                type: "phrase_prefix",
              },
            },
          ],
        },
      },
      size: req.query.limit || 100,
      track_total_hits: true,
      sort: { updatedAt: "desc" },
    };

    if (req.user.role === "REFERENT_DEPARTMENT") {
      query.query.bool.must.push({ terms: { "contactDepartment.keyword": req.user.departments } });
      query.query.bool.must.push({ term: { "formSubjectStep1.keyword": "QUESTION" } });
    }
    if (req.user.role === "REFERENT_REGION") {
      query.query.bool.must.push({ term: { "contactRegion.keyword": req.user.region } });
      query.query.bool.must.push({ term: { "formSubjectStep1.keyword": "QUESTION" } });
    }
    const { hits } = await esClient.search({ index: "ticket", body: query });
    const data = hits.hits.map((e) => ({ _id: e._id, ...e._source }));

    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

function getDate(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

//! Ne pas delete
// router.get(
//   "/tags",
//   // passport.authenticate("user", { session: false, failWithError: true }),
//   async (req, res) => {
//     try {
//       let query = {
//         query: {},
//         size: 0,
//         track_total_hits: true,
//         aggs: {
//           tags: {
//             terms: {
//               field: "tags.keyword",
//               size: 100,
//             },
//           },
//         },
//       };

//       if (req.query.q) query.query = { match_phrase_prefix: { tags: { query: req.query.q } } };
//       else query.query = { match_all: {} };

//       const d = await esClient.search({ index: "ticket", body: query });
//       const tags = d.aggregations.tags.buckets;
//       return res.status(200).send({ ok: true, data: tags });
//     } catch (error) {
//       capture(error);
//       return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
//     }
//   }
// );

router.post("/stats/date", passport.authenticate("agent", { session: false }), async (req, res) => {
  const tag = await TagModel.findOne({ name: "Spam" });
  try {
    const period = req.body.period || 7;
    let startDate;
    if (req.body.startDate) {
      startDate = new Date(req.body.startDate);
    } else {
      startDate = getDate(new Date(), -period);
    }

    const endDate = req.body.endDate ? new Date(req.body.endDate) : new Date();
    const body = [];
    body.push({ index: "ticket", type: "_doc" });
    body.push({ query: { bool: { must: [{ range: { createdAt: { gte: startDate, lte: endDate } } }] } }, size: 0, track_total_hits: true });
    body.push({ index: "ticket", type: "_doc" });
    body.push({ query: { bool: { must: [{ range: { closedAt: { gte: startDate, lte: endDate } } }] } }, size: 0, track_total_hits: true });
    body.push({ index: "ticket", type: "_doc" });
    body.push({
      query: { bool: { must: [{ range: { createdAt: { gte: startDate, lte: endDate } } }, { term: { "tagsId.keyword": tag._id.toString() } }] } },
      size: 0,
      track_total_hits: true,
    });
    body.push({ index: "ticket", type: "_doc" });
    body.push({
      query: { bool: { must: [{ range: { closedAt: { gte: startDate, lte: endDate } } }, { term: { "tagsId.keyword": tag._id.toString() } }] } },
      size: 0,
      track_total_hits: true,
    });
    //update query regarding referent role
    if (req.user.role === "REFERENT_REGION") {
      body[1].query.bool.must.push({ term: { "contactRegion.keyword": req.user.region } });
      body[1].query.bool.must.push({ term: { "formSubjectStep1.keyword": "QUESTION" } });
      body[3].query.bool.must.push({ term: { "contactRegion.keyword": req.user.region } });
      body[3].query.bool.must.push({ term: { "formSubjectStep1.keyword": "QUESTION" } });
      body[5].query.bool.must.push({ term: { "contactRegion.keyword": req.user.region } });
      body[5].query.bool.must.push({ term: { "formSubjectStep1.keyword": "QUESTION" } });
      body[7].query.bool.must.push({ term: { "contactRegion.keyword": req.user.region } });
      body[7].query.bool.must.push({ term: { "formSubjectStep1.keyword": "QUESTION" } });
    }
    if (req.user.role === "REFERENT_DEPARTMENT") {
      body[1].query.bool.must.push({ terms: { "contactDepartment.keyword": req.user.departments } });
      body[1].query.bool.must.push({ term: { "formSubjectStep1.keyword": "QUESTION" } });
      body[3].query.bool.must.push({ terms: { "contactDepartment.keyword": req.user.departments } });
      body[3].query.bool.must.push({ term: { "formSubjectStep1.keyword": "QUESTION" } });
      body[5].query.bool.must.push({ terms: { "contactDepartment.keyword": req.user.departments } });
      body[5].query.bool.must.push({ term: { "formSubjectStep1.keyword": "QUESTION" } });
      body[7].query.bool.must.push({ terms: { "contactDepartment.keyword": req.user.departments } });
      body[7].query.bool.must.push({ term: { "formSubjectStep1.keyword": "QUESTION" } });
    }
    const d = await esClient.msearch({ body });
    const data = {
      ticketsCreated: d.responses[0].hits.total.value,
      ticketsClosed: d.responses[1].hits.total.value,
      ticketsCreatedSpam: d.responses[2].hits.total.value,
      ticketsClosedSpam: d.responses[3].hits.total.value,
    };
    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.post("/stats/tags", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const period = req.body.period || 7;

    let startDate;
    let startDate2;
    if (req.body.startDate) {
      startDate = new Date(req.body.startDate);
      // start date 2 is 2 times the difference between start date and today
      startDate2 = new Date(startDate);
      startDate2.setDate(startDate2.getDate() - (new Date().getDate() - startDate.getDate()) * 2);
    } else {
      startDate = getDate(new Date(), -period);
      startDate2 = getDate(new Date(), -period * 2);
    }
    const endDate = req.body.endDate ? new Date(req.body.endDate) : new Date();

    const body = [];
    body.push({ index: "ticket", type: "_doc" });
    body.push({
      query: { bool: { must: [{ range: { createdAt: { gte: startDate, lte: endDate } } }] } },
      size: 0,
      track_total_hits: true,
      aggs: { tags: { terms: { field: "tagsId.keyword", size: 300 } } },
    });
    //update query regarding referent role
    if (req.user.role === "REFERENT_REGION") {
      body[1].query.bool.must.push({ term: { "contactRegion.keyword": req.user.region } });
      body[1].query.bool.must.push({ term: { "formSubjectStep1.keyword": "QUESTION" } });
    }
    if (req.user.role === "REFERENT_DEPARTMENT") {
      body[1].query.bool.must.push({ terms: { "contactDepartment.keyword": req.user.departments } });
      body[1].query.bool.must.push({ term: { "formSubjectStep1.keyword": "QUESTION" } });
    }
    body.push({ index: "ticket", type: "_doc" });
    body.push({
      query: { bool: { must: [{ range: { createdAt: { gte: startDate2, lte: endDate } } }] } },
      size: 0,
      track_total_hits: true,
      aggs: { tags: { terms: { field: "tagsId.keyword", size: 300 } } },
    });
    if (req.user.role === "REFERENT_REGION") {
      body[3].query.bool.must.push({ term: { "contactRegion.keyword": req.user.region } });
      body[3].query.bool.must.push({ term: { "formSubjectStep1.keyword": "QUESTION" } });
    }
    if (req.user.role === "REFERENT_DEPARTMENT") {
      body[3].query.bool.must.push({ terms: { "contactDepartment.keyword": req.user.departments } });
      body[3].query.bool.must.push({ term: { "formSubjectStep1.keyword": "QUESTION" } });
    }
    const d = await esClient.msearch({ body });

    d.responses[0].aggregations.tags.buckets.forEach((tag1) => {
      d.responses[1].aggregations.tags.buckets.forEach((tag2) => {
        if (tag1.key === tag2.key) tag1.percentage = tag2.doc_count - tag1.doc_count !== 0 ? (tag1.doc_count / (tag2.doc_count - tag1.doc_count) - 1) * 100 : 0;
      });
    });
    const tags = d.responses[0].aggregations.tags.buckets;

    // Pour la page de setting tags, on envoie tous sauf le spam
    // Ce n'est pas l'idéal pour l'instant mais cela fonctionne sur cette page la
    // car on couple les data d'une autre route ou on filtre les deletedAt
    let filteredTags = [];

    for (const tag of tags) {
      const tagData = await TagModel.findById(tag.key);
      if (!tagData?.name) {
        captureMessage("Tag not found", { extra: { tag, tagData } });
        continue;
      }

      if (tagData.deletedAt || tagData.name === "Spam") continue;

      tag.name = tagData?.name;
      filteredTags.push(tag);

      if (filteredTags.length === 12 && req.query.source === "dashboard") break;
    }

    return res.status(200).send({ ok: true, data: filteredTags });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.post("/stats/source", passport.authenticate("agent", { session: false }), async (req, res) => {
  const tag = await TagModel.findOne({ name: "Spam" });
  try {
    const period = req.body.period || 7;
    let startDate;
    if (req.body.startDate) {
      startDate = new Date(req.body.startDate);
    } else {
      startDate = getDate(new Date(), -period);
    }
    const endDate = req.body.endDate ? new Date(req.body.endDate) : new Date();
    const body = [];
    body.push({ index: "ticket", type: "_doc" });
    body.push({
      query: { bool: { must: [{ range: { createdAt: { gte: startDate, lte: endDate } } }] } },
      size: 0,
      track_total_hits: true,
      aggs: { tags: { terms: { field: "source.keyword", size: 100 } } },
    });
    body.push({ index: "ticket", type: "_doc" });
    body.push({
      query: {
        bool: {
          must: [{ range: { createdAt: { gte: startDate, lte: endDate } } }, { term: { "tagsId.keyword": tag._id.toString() } }, { term: { "source.keyword": "MAIL" } }],
        },
      },
      size: 0,
      track_total_hits: true,
    });
    //update query regarding referent role
    if (req.user.role === "REFERENT_REGION") {
      body[1].query.bool.must.push({ term: { "contactRegion.keyword": req.user.region } });
      body[1].query.bool.must.push({ term: { "formSubjectStep1.keyword": "QUESTION" } });
      body[3].query.bool.must.push({ term: { "contactRegion.keyword": req.user.region } });
      body[3].query.bool.must.push({ term: { "formSubjectStep1.keyword": "QUESTION" } });
    }
    if (req.user.role === "REFERENT_DEPARTMENT") {
      body[1].query.bool.must.push({ terms: { "contactDepartment.keyword": req.user.departments } });
      body[1].query.bool.must.push({ term: { "formSubjectStep1.keyword": "QUESTION" } });
      body[3].query.bool.must.push({ terms: { "contactDepartment.keyword": req.user.departments } });
      body[3].query.bool.must.push({ term: { "formSubjectStep1.keyword": "QUESTION" } });
    }
    const d = await esClient.msearch({ body });
    const sources = d.responses[0].aggregations.tags.buckets;
    return res.status(200).send({ ok: true, data: { sources, mailSpam: d.responses[1].hits.total.value } });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.post("/stats/feedback", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const period = req.body.period || 7;
    let startDate;
    if (req.body.startDate) {
      startDate = new Date(req.body.startDate);
    } else {
      startDate = getDate(new Date(), -period);
    }
    const endDate = req.body.endDate ? new Date(req.body.endDate) : new Date();
    let body = {
      query: { bool: { must: [{ range: { createdAt: { gte: startDate, lte: endDate } } }] } },
      size: 0,
      track_total_hits: true,
      aggs: { tags: { terms: { field: "feedback.keyword", size: 100 } } },
    };
    //update query regarding referent role
    if (req.user.role === "REFERENT_REGION") {
      body.query.bool.must.push({ term: { "contactRegion.keyword": req.user.region } });
      body.query.bool.must.push({ term: { "formSubjectStep1.keyword": "QUESTION" } });
    }
    if (req.user.role === "REFERENT_DEPARTMENT") {
      body.query.bool.must.push({ terms: { "contactDepartment.keyword": req.user.departments } });
      body.query.bool.must.push({ term: { "formSubjectStep1.keyword": "QUESTION" } });
    }
    const d = await esClient.search({ index: "ticket", body });
    const feedbacks = d.aggregations.tags.buckets;
    return res.status(200).send({ ok: true, data: feedbacks });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.get("/:id", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const ticket = await TicketModel.findById(req.params.id);
    if (!ticket) return res.status(404).send({ ok: false, code: NOT_FOUND });
    const tags = await TagModel.find({ _id: { $in: ticket.tagsId }, deletedAt: null });
    return res.status(200).send({ ok: true, data: { ticket, tags } });
  } catch (error) {
    console.log("ER", error);
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.get("/linkTicket/:id", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    let query = { contactId: req.params.id };
    if (req.user.role === "REFERENT_DEPARTMENT" || req.user.role === "REFERENT_REGION") {
      query.formSubjectStep1 = "QUESTION";
    }
    const ticket = await TicketModel.find(query);
    return res.status(200).send({ ok: true, data: ticket });
  } catch (error) {
    console.log("ER", error);
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.put("/:id", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const id = req.params.id;

    let ticket = await TicketModel.findOne({ _id: id });

    if (req.body.hasOwnProperty("status")) ticket.status = req.body.status;
    if (ticket.status === "CLOSED") {
      ticket.closedAt = new Date();
      if (!ticket.closedTimeHours) ticket.closedTimeHours = Number(getHoursDifference(new Date(), ticket.createdAt)).toFixed(2);
    }
    if (req.body.hasOwnProperty("notes")) ticket.notes = req.body.notes;
    if (req.body.hasOwnProperty("agentId")) ticket.agentId = req.body.agentId;
    if (req.body.hasOwnProperty("agentFirstName")) ticket.agentFirstName = req.body.agentFirstName;
    if (req.body.hasOwnProperty("agentLastName")) ticket.agentLastName = req.body.agentLastName;
    if (req.body.hasOwnProperty("agentEmail")) ticket.agentEmail = req.body.agentEmail;
    if (req.body.hasOwnProperty("folder")) {
      ticket.folder = req.body.folder;
      ticket.folders = [req.body.folder];
    }
    if (req.body.hasOwnProperty("folderId")) {
      ticket.foldersId.push(req.body.folderId);
    }
    if (req.body.hasOwnProperty("tags")) {
      ticket.tagsId = req.body.tags.map((tag) => tag._id);
      ticket.tags = req.body.tags.map((tag) => tag.name);
    }
    if (req.body.hasOwnProperty("recipients")) ticket.recipients = req.body.recipients;
    if (req.body.hasOwnProperty("copyRecipient")) ticket.copyRecipient = req.body.copyRecipient;
    if (req.body.hasOwnProperty("messageDraft")) {
      ticket.messageDraft = req.body.messageDraft;
      // messageDraft is not empty
      if (req.body.messageDraft) {
        ticket.status = "DRAFT";
      }
    }
    if (req.body.hasOwnProperty("subject")) {
      ticket.subject = req.body.subject;
      if (req.body.subject.includes("question")) ticket.formSubjectStep1 = "QUESTION";
      if (req.body.subject.includes("problème")) ticket.formSubjectStep1 = "TECHNICAL";
    }
    if (req.body.hasOwnProperty("canal")) ticket.canal = req.body.canal;
    if (req.body.hasOwnProperty("contactEmail")) ticket.contactEmail = req.body.contactEmail;
    if (req.body.hasOwnProperty("contactDepartment")) ticket.contactDepartment = req.body.contactDepartment;
    if (req.body.hasOwnProperty("contactAttributes")) ticket.contactAttributes = req.body.contactAttributes;
    if (req.body.hasOwnProperty("feedback")) ticket.feedback = req.body.feedback;
    if (req.body.hasOwnProperty("contactGroup")) ticket.contactGroup = req.body.contactGroup;
    if (req.body.hasOwnProperty("referentDepartmentId")) ticket.referentDepartmentId = req.body.referentDepartmentId;
    if (req.body.hasOwnProperty("referentDepartmentFirstName")) ticket.referentDepartmentFirstName = req.body.referentDepartmentFirstName;
    if (req.body.hasOwnProperty("referentDepartmentLastName")) ticket.referentDepartmentLastName = req.body.referentDepartmentLastName;
    if (req.body.hasOwnProperty("referentDepartmentEmail")) ticket.referentDepartmentEmail = req.body.referentDepartmentEmail;
    if (req.body.hasOwnProperty("referentRegionId")) ticket.referentRegionId = req.body.referentRegionId;
    if (req.body.hasOwnProperty("referentRegionFirstName")) ticket.referentRegionFirstName = req.body.referentRegionFirstName;
    if (req.body.hasOwnProperty("referentRegionLastName")) ticket.referentRegionLastName = req.body.referentRegionLastName;
    if (req.body.hasOwnProperty("referentRegionEmail")) ticket.referentRegionEmail = req.body.referentRegionEmail;
    ticket.lastUpdateAgent = req.user._id;
    ticket.updatedAt = new Date();

    ["agentId", "agentFirstName", "agentLastName", "agentEmail"].forEach((field) => {
      if (req.body[field] === "") {
        ticket[field] = undefined;
      }
    });

    const tags = await TagModel.find({ _id: { $in: ticket.tagsId }, deletedAt: null });
    ticket = await matchVentilationRule(ticket);

    // Sauvegarde des changements finaux
    await ticket.save();
    return res.status(200).send({ ok: true, data: { ticket, tags } });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.delete("/:id", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const id = req.params.id;
    await TicketModel.findOneAndDelete({ _id: id });
    await esClient.delete({ index: "ticket", type: "_doc", refresh: true, id: id });
    return res.status(200).send({ ok: true });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.put("/transfer/:id", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const id = req.params.id;
    let ticket = await TicketModel.findById(id);
    if (!ticket) return res.status(400).send({ ok: false, code: WRONG_REQUEST });
    await sendEmailWithConditions({ ticket, dest: req.body.contactEmail, messageHistory: "all" });
    const agent = await AgentModel.findById(req.user._id);
    ticket.notes.push({
      content: `Ticket transféré le ${Intl.DateTimeFormat("fr-FR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(Date.now())}`,
      authorName: agent.firstName + " " + agent.lastName + " à " + req.body.contactEmail,
    });
    await ticket.save();
    return res.status(200).send({ ok: true });
  } catch (error) {
    console.log("ER", error);
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.put("/viewing/:id", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const id = req.params.id;
    const { isViewing } = req.body;
    let ticket = await TicketModel.findById(id);
    if (!ticket) return res.status(400).send({ ok: false, code: WRONG_REQUEST });
    ticket.viewingAgent = isViewing
      ? [...new Set([...ticket.viewingAgent, { email: req.user.email, lastName: req.user.lastName, firstName: req.user.firstName, role: req.user.role }])]
      : ticket.viewingAgent.filter((agent) => agent.email !== req.user.email);
    await ticket.save();
    return res.status(200).send({ ok: true });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.get("/viewing/:id", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const id = req.params.id;
    let ticket = await TicketModel.findById(id);
    if (!ticket) return res.status(404).send({ ok: false, code: NOT_FOUND });
    return res.status(200).send({ ok: true, data: ticket.viewingAgent });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});
module.exports = router;
