require("dotenv").config({ path: "./../../../.env-prod" });
require("../../mongo");

const { ObjectId } = require("mongodb");
const fetch = require("node-fetch");

const { capture } = require("../../sentry");
const slack = require("../../slack");

const TicketModel = require("../../models/ticket");
const TicketPatchModel = require("./models/ticketPatch");

const { API_ANALYTICS_ENDPOINT, API_ANALYTICS_API_KEY } = require("../../config.js");
const { mongooseFilterForDayBefore, checkResponseStatus, getAccessToken, findAll, printResult } = require("./utils");

let token;
const result = { event: {} };

async function processPatch(patch, count, total) {
  try {
    result.ticketPatchScanned = result.ticketPatchScanned + 1 || 1;
    if (count % 100 === 0) console.log(count, "/", total);
    const actualTicket = await TicketModel.findById(patch.ref.toString());
    if (!actualTicket) return;
    if (patch.ops.length > 0) {
      for (const op of patch.ops) {
        let operation = op.path.split("/")[1];
        let eventName = null;

        if (operation === "status") {
          eventName = "TICKET_STATUS_CHANGE";
        }
        if (eventName) {
          result.event[eventName] = result.event[eventName] + 1 || 1;
          await createLog(patch, actualTicket, eventName, op.value);
        }
      }
    }
  } catch (e) {
    capture(e);
    throw e;
  }
}

async function createLog(patch, actualTicket, event, value) {
  const ticketInfos = await actualTicket.patches.find({ ref: ObjectId(patch.ref.toString()), date: { $lte: patch.date } }).sort({ date: 1 });
  let ticket = rebuildTicket(ticketInfos);

  const filteredTagsId = actualTicket.tagsId.filter((tagId) => tagId !== null);

  const response = await fetch(`${API_ANALYTICS_ENDPOINT}/log/ticket`, {
    method: "POST",
    redirect: "follow",
    headers: {
      Accept: "application/json, text/plain, */*",
      "User-Agent": "*",
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body: JSON.stringify({
      evenement_nom: event,
      evenement_type: "ticket",
      evenement_valeur: value || "",
      ticket_id: actualTicket._id.toString(),
      ticket_source: actualTicket.source,
      ticket_contact_id: actualTicket.contactId,
      ticket_agent_id: actualTicket.agentId || "",
      ticket_tags_id: filteredTagsId || "",
      ticket_created_at: actualTicket.createdAt,
      ticket_closed_at: actualTicket.closedAt === undefined ? null : actualTicket.closedAt,
      date: patch.date,
      raw_data: ticket,
    }),
  });

  const successResponse = checkResponseStatus(response);
  return successResponse.json();
}

const rebuildTicket = (ticketInfos) => {
  let ticket = {};
  for (const ticketInfo of ticketInfos) {
    for (const op of ticketInfo.ops) {
      let operation = op.path.split("/")[1];
      ticket[operation] = op.value;
    }
  }
  return ticket;
};

exports.handler = async () => {
  try {
    token = await getAccessToken(API_ANALYTICS_ENDPOINT, API_ANALYTICS_API_KEY);

    await findAll(TicketPatchModel, mongooseFilterForDayBefore(), processPatch);
    await slack.info({
      title: "✅ Ticket",
      text: `${result.ticketPatchScanned} ticket patches were scanned:\n ${printResult(result.event)}`,
    });
  } catch (e) {
    slack.error({ title: "❌ Ticket Logs", text: e });
    capture(e);
  }
};

// Script de rattrapage manuel
// commande terminal : node -e "require('./ticket').manualHandler('2023-10-19', '2023-10-20')"
exports.manualHandler = async (startDate, endDate) => {
  try {
    token = await getAccessToken(API_ANALYTICS_ENDPOINT, API_ANALYTICS_API_KEY);

    await findAll(TicketPatchModel, { date: { $gte: new Date(startDate), $lt: new Date(endDate) } }, processPatch);

    console.log(result);
  } catch (e) {
    console.log(e);
  }
};
