const mongoose = require("mongoose");

module.exports = mongoose.model("ticket_patches", new mongoose.Schema({}, { collection: "ticket_patches" }));
