const express = require("express");
const path = require("path");
const hsts = require("hsts");

const app = express();
const port = 8080;

// app.use(forceDomain({ hostname: "app.api-engagement.beta.gouv.fr", protocol: "https" }));

app.use(hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }));
app.use(express.static(path.join(__dirname, "../dist")));

app.route("*").all((req, res) => {
  res.status(200).sendFile(path.join(__dirname, "/../dist/index.html"));
});

app.listen(port, () => {
  console.log(`App listening at port:${port}`);
});
