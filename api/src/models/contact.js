const mongoose = require("mongoose");
const mongooseElastic = require("@selego/mongoose-elastic");
const esClient = require("../es");
const patchHistory = require("mongoose-patch-history").default;

const MODELNAME = "contact";

const Schema = new mongoose.Schema({
  firstName: {
    type: String,
    documentation: {
      description: "Prénom de l'utilisateur",
    },
  },
  lastName: {
    type: String,
    documentation: {
      description: "Nom de l'utilisateur",
    },
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
    documentation: {
      description: "Email de l'utilisateur",
    },
  },
  region: {
    type: String,
  },
  department: {
    type: String,
  },
  role: { type: String },
  createdAt: { type: Date, default: Date.now },
  attributes: [{ format: String, value: String, name: String }],
});

Schema.plugin(patchHistory, {
  mongoose,
  name: `${MODELNAME}Patches`,
  trackOriginalValue: true,
  includes: {
    modelName: { type: String, required: true, default: MODELNAME },
    user: { type: Object, required: false, from: "_user" },
  },
  excludes: ["email", "firstName", "lastName"],
});

Schema.plugin(mongooseElastic.default(esClient), MODELNAME);

module.exports = mongoose.model(MODELNAME, Schema);
