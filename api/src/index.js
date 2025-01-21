require("dotenv").config({ path: "./.env-staging" });

const { initSentry } = require("./sentry");

const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const helmet = require("helmet");
const logger = require("morgan");
const passport = require("passport");
require("./mongo");
require("./imap");
require("./utils/ventilation");
require("./crons");
//const SCRIPT = require("./scripts/getContact");

const { PORT, APP_URL, ENVIRONMENT, ADMIN_URL, SNU_URL, KB_URL } = require("./config.js");

// if (process.env.NODE_ENV !== "test") {
//   console.log("APP_URL", APP_URL);
//   console.log("ADMIN_URL", ADMIN_URL);
//   console.log("SUPPORT_URL", SUPPORT_URL);
//   console.log("KNOWLEDGEBASE_URL", KNOWLEDGEBASE_URL);
//   console.log("ENVIRONMENT: ", ENVIRONMENT);
// }

const app = express();
const registerSentryErrorHandler = initSentry(app);
app.use(helmet());

console.log({ ENVIRONMENT });
if (ENVIRONMENT === "development") {
  app.use(logger("dev"));
}

// eslint-disable-next-line no-unused-vars
function handleError(err, req, res, next) {
  const output = { error: { name: err.name, message: err.message, text: err.toString() } };
  const statusCode = err.status || 500;
  res.status(statusCode).json(output);
}

const origin = [APP_URL, ADMIN_URL, KB_URL, SNU_URL];
console.log("origin", origin);
app.use(express.json({ limit: "10mb" }));
app.use(
  cors({
    credentials: true,
    origin,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "Referer", "User-Agent", "sentry-trace", "baggage"],
  })
);
app.use(bodyParser.json());
app.use(bodyParser.text({ type: "application/x-ndjson" }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(fileUpload({ limits: { fileSize: 10 * 1024 * 1024 } })); // 10 Mo
app.use(express.static(__dirname + "/../public"));

app.use(passport.initialize());

app.use("/agent", require("./controllers/agent"));
app.use("/ticket", require("./controllers/ticket"));
app.use("/message", require("./controllers/message"));
app.use("/folder", require("./controllers/folder"));
app.use("/contact", require("./controllers/contact"));
app.use("/organisation", require("./controllers/organisation"));
app.use("/tag", require("./controllers/tag"));
app.use("/shortcut", require("./controllers/shortcut"));
app.use("/macro", require("./controllers/macro"));
app.use("/ventilation", require("./controllers/ventilation"));
app.use("/knowledge-base", require("./controllers/knowledgeBase"));
app.use("/kb-search", require("./controllers/kbSearch"));
app.use("/template", require("./controllers/template"));
app.use("/feedback", require("./controllers/feedback"));

app.use("/v0/message", require("./v0/message"));
app.use("/v0/contact", require("./v0/contact"));
app.use("/v0/ticket", require("./v0/ticket"));
app.use("/v0/sso", require("./v0/sso"));
app.use("/v0/referent", require("./v0/referent"));

registerSentryErrorHandler();
app.use(handleError);

app.get("/", async (req, res) => {
  const d = new Date();
  res.status(200).send("SNU " + d.toLocaleString());
});

require("./passport")();

app.listen(PORT, () => console.log("Listening on port " + PORT));
