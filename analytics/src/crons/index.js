require("dotenv").config();
const cron = require("node-cron");

// ! Unused for now

const { ENVIRONMENT } = require("../config");

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

// ! A jour du 16 juin 2023 (Source ChatGPT)
// Voici les heures de déclenchement de chaque cron dans le fichier fourni (en UTC):

// See: https://www.clever-cloud.com/doc/administrate/cron/#deduplicating-crons (INSTANCE_NUMBER)
// if (ENVIRONMENT === "production" && process.env.INSTANCE_NUMBER === "0") {
//   // Every day at 02:00
//   cron.schedule("0 2 * * *", () => {});
// }
//
