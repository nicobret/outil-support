const ENVIRONMENT = getEnvironment();
const MONGO_URL = process.env.MONGO_URL || "mongodb://uyaapdbxhh0ak4k1umtv:smmhe7h1RHijbJps7zt@btl1zkdb3n5pxrzl3wzv-mongodb.services.clever-cloud.com:2462/btl1zkdb3n5pxrzl3wzv";
const ES_URL = process.env.ES_URL || "https://u6zEbu9LY6ttIWBZH9c4:3PISA2LL8PFS6tA9zP3Z@bm7p8vhzhvv6sjvwlitb-elasticsearch.services.clever-cloud.com";

const APP_URL = process.env.APP_URL || "http://localhost:8081";
const ADMIN_URL = process.env.ADMIN_URL || "http://localhost:8082";
const SNU_URL = process.env.SNU_URL || "http://localhost:8083";
const KB_URL = process.env.KB_URL || "http://localhost:8084";
const SECRET = process.env.SECRET || "NO_SO_SECRET_4";
const PORT = process.env.PORT || 3000;

const CELLAR_ENDPOINT = process.env.CELLAR_ENDPOINT || "";
const CELLAR_KEYID = process.env.CELLAR_KEYID || "";
const CELLAR_KEYSECRET = process.env.CELLAR_KEYSECRET || "";
const PUBLIC_BUCKET_NAME = process.env.PUBLIC_BUCKET_NAME || "";

const CELLAR_ENDPOINT_SUPPORT = process.env.CELLAR_ENDPOINT_SUPPORT || "";
const CELLAR_KEYID_SUPPORT = process.env.CELLAR_KEYID_SUPPORT || "";
const CELLAR_KEYSECRET_SUPPORT = process.env.CELLAR_KEYSECRET_SUPPORT || "";
const PUBLIC_BUCKET_NAME_SUPPORT = process.env.PUBLIC_BUCKET_NAME_SUPPORT || "";
const PUBLIC_BUCKET_NAME_SUPPORT_OLD = process.env.PUBLIC_BUCKET_NAME_SUPPORT_OLD || "";

const SENTRY_URL = process.env.SENTRY_URL || "";
const SENTRY_TRACING_SAMPLE_RATE = process.env.SENTRY_TRACING_SAMPLE_RATE || "";

const FILE_ENCRYPTION_SECRET = process.env.FILE_ENCRYPTION_SECRET || "";
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN || "";
const SLACK_BOT_CHANNEL = process.env.SLACK_BOT_CHANNEL || "";

const API_ANALYTICS_ENDPOINT = process.env.API_ANALYTICS_ENDPOINT || "http://localhost:8085";

const API_ANALYTICS_API_KEY = process.env.API_ANALYTICS_API_KEY || "api-key";

const SENDINBLUE_API_KEY = process.env.SENDINBLUE_API_KEY || "";

module.exports = {
  MONGO_URL,
  ES_URL,
  SECRET,
  PORT,
  APP_URL,
  ADMIN_URL,
  SNU_URL,
  KB_URL,
  ENVIRONMENT,
  CELLAR_ENDPOINT,
  CELLAR_KEYID,
  CELLAR_KEYSECRET,
  PUBLIC_BUCKET_NAME,
  CELLAR_ENDPOINT_SUPPORT,
  CELLAR_KEYID_SUPPORT,
  CELLAR_KEYSECRET_SUPPORT,
  PUBLIC_BUCKET_NAME_SUPPORT,
  SENTRY_URL,
  SENTRY_TRACING_SAMPLE_RATE,
  FILE_ENCRYPTION_SECRET,
  PUBLIC_BUCKET_NAME_SUPPORT_OLD,
  getEnvironment,
  SLACK_BOT_CHANNEL,
  SLACK_BOT_TOKEN,
  API_ANALYTICS_API_KEY,
  API_ANALYTICS_ENDPOINT,
  SENDINBLUE_API_KEY,
};

function getEnvironment() {
  if (process.env.STAGING === "true") return "staging";
  else if (process.env.PRODUCTION === "true") return "production";
  else if (process.env.TESTING === "true" || process.env.NODE_ENV === "test") return "testing";
  return "development";
}
