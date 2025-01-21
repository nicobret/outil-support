const express = require("express");
const router = express.Router();

const { capture } = require("../sentry");
const { db } = require("../services/databases/postgresql.service");

router.get("/.health", async (req, res) => {
  try {
    const services = {
      database: await db
        .authenticate()
        .then(() => "up")
        .catch(() => "down"),
    };

    return res.status(200).send({ ok: true, services });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, error: "Internal Server Error" });
  }
});

module.exports = router;
