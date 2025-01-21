const mongoose = require("mongoose");
const mongooseElastic = require("@selego/mongoose-elastic");

const esClient = require("../es");

const MODELNAME = "kbsearch";

const Schema = new mongoose.Schema({
  search: {
    type: String,
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  resultsNumber: {
    type: Number,
  },
  role: {
    type: String,
  },
});

Schema.plugin(mongooseElastic.default(esClient), MODELNAME);

const OBJ = mongoose.model(MODELNAME, Schema);
module.exports = OBJ;
