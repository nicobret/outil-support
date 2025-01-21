const cron = require("node-cron");
const { ENVIRONMENT } = require("../config");

const ticketPatch = require("./patch/ticket");
const sendTicketReportReferent = require("./sendTicketReportReferent");

// doubt ? -> https://crontab.guru/

/* eslint-disable no-unused-vars */
// dev : */5 * * * * * (every 5 secs)
// prod : 0 8 * * 1 (every monday at 0800)
const EVERY_MINUTE = "* * * * *";
const EVERY_HOUR = "0 * * * *";
const everySeconds = (x) => `*/${x} * * * * *`;
const everyMinutes = (x) => `*/${x} * * * *`;
const everyHours = (x) => `0 */${x} * * *`;
/* eslint-enable no-unused-vars */

// See: https://www.clever-cloud.com/doc/administrate/cron/#deduplicating-crons (INSTANCE_NUMBER)

if (ENVIRONMENT === "production" && process.env.INSTANCE_NUMBER === "0") {
  // Every day at 02:00
  cron.schedule("0 2 * * *", () => {
    ticketPatch.handler();
  });
  // Every monday at 09:00
  cron.schedule("0 9 * * 1", function () {
    sendTicketReportReferent.handler();
  });
}
