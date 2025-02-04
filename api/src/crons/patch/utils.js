const fetch = require("node-fetch");

const slack = require("../../slack");
const getMinusDate = (v) => {
  const d = new Date();
  d.setDate(d.getDate() - v);
  return d;
};
const getDateString = (date) => {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

const mongooseFilterForDayBefore = () => {
  const todayDateString = getDateString(new Date());
  const yesterdayDateString = getDateString(getMinusDate(1));
  return { date: { $gte: new Date(yesterdayDateString), $lt: new Date(todayDateString) } };
};

class HTTPResponseError extends Error {
  constructor(response, ...args) {
    super(`HTTP Error Response: ${response.status} ${response.statusText}`, ...args);
    this.response = response;
  }
}

const checkResponseStatus = (response) => {
  if (response.ok) {
    return response;
  } else {
    slack.error({ title: "Error during log creation", text: response });
    throw new HTTPResponseError(response);
  }
};

async function getAccessToken(endpoint, apiKey) {
  const response = await fetch(`${endpoint}/auth/token`, {
    method: "GET",
    redirect: "follow",
    headers: {
      Accept: "application/json, text/plain, */*",
      "User-Agent": "*",
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
  });

  const data = await response.json();
  if (data.ok == true && data.token) {
    return data.token;
  } else {
    throw new Error("Couldn't retrieve auth token");
  }
}

async function findAll(Model, where, cb) {
  let count = 0;

  const total = await Model.collection.countDocuments(where);

  const cursor = Model.collection.find(where);

  for await (const doc of cursor) {
    count++;
    await cb(doc, count, total);
  }
}

function printResult(events) {
  return Object.keys(events)
    .map((key) => `${key} => ${events[key]}`)
    .join(`\n`);
}

module.exports = {
  mongooseFilterForDayBefore,
  checkResponseStatus,
  getAccessToken,
  findAll,
  printResult,
  getDateString,
};
