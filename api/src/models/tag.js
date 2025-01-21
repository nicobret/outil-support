const mongoose = require("mongoose");
const mongooseElastic = require("@selego/mongoose-elastic");

const esClient = require("../es");

const MODELNAME = "tag";
const patchHistory = require("mongoose-patch-history").default;

const Schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  userVisibility: {
    type: String,
    enum: ["ALL", "AGENT"],
    default: "AGENT",
    documentation: {
      description: "Visibilité du tag pour uniquement les agents ou pour agents et référents ",
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
    documentation: {
      description: "Date de création du tag",
    },
  },
  deletedAt: {
    type: Date,
    default: null,
    documentation: {
      description: "Date de suppression du tag",
    },
  },
});

Schema.plugin(patchHistory, {
  mongoose,
  name: `${MODELNAME}Patches`,
  trackOriginalValue: true,
  includes: {
    modelName: { type: String, required: true, default: MODELNAME },
    user: { type: Object, required: false, from: "_user" },
  },
  excludes: [],
});
Schema.plugin(mongooseElastic.default(esClient), MODELNAME);

const OBJ = mongoose.model(MODELNAME, Schema);
module.exports = OBJ;
