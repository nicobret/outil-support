let apiURL = "http://localhost:3000";
let appURL = "http://localhost:8083";
let API_SNU_URL = "http://localhost:8080";

const environment = getEnvironment();
let SENTRY_URL;
let SENTRY_TRACING_SAMPLE_RATE;

if (environment === "production") {
  apiURL = "https://api-support.snu.gouv.fr";
  appURL = "https://admin-support.snu.gouv.fr";
  API_SNU_URL = "https://api.snu.gouv.fr";
  SENTRY_URL = "https://d09670865360498e9567369808de4064@sentry.selego.co/13";
  SENTRY_TRACING_SAMPLE_RATE = 1.0;
}
if (environment === "staging") {
  apiURL = "https://api-support.beta-snu.dev";
  appURL = "https://admin-support.beta-snu.dev";
  API_SNU_URL = "https://api.beta-snu.dev";
  SENTRY_URL = "https://c5165ba99b4f4f2d8f1d4c0b16a654db@sentry.selego.co/14";
  SENTRY_TRACING_SAMPLE_RATE = 1.0;
}
if (environment === "development") {
}

export { apiURL, appURL, API_SNU_URL, environment, SENTRY_URL, SENTRY_TRACING_SAMPLE_RATE };

function getEnvironment() {
  if (window.location.href.indexOf("beta-snu.dev") !== -1) return "staging";
  if (window.location.href.indexOf("localhost") !== -1 || window.location.href.indexOf("127.0.0.1") !== -1) return "development";
  return "production";
}
