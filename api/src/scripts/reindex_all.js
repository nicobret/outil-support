const fs = require("fs");
const path = require("path");
const dir = path.dirname(__filename);
require("dotenv").config({ path: `${dir}/../.env-prod` });
require("../mongo");

const esClient = require("../es");

const TicketModel = require("../models/ticket");
const AgentModel = require("../models/agent");
const ContactModel = require("../models/contact");
const FeedbackModel = require("../models/feedback");
const FolderModel = require("../models/folder");
const KbSearchModel = require("../models/kbSearch");
const KnowledgeBaseModel = require("../models/knowledgeBase");
const MacroModel = require("../models/macro");
const MessageModel = require("../models/message");
const OrganisationModel = require("../models/organisation");
const ShortcutModel = require("../models/shortcut");
const TagModel = require("../models/tag");
const TemplateModel = require("../models/template");
const VentilationModel = require("../models/ventilation");

const MAPPING_DIR = path.join(dir, "./mappings");

const models_indexed = [TagModel];

const useful_models = [TicketModel];

const all_models = [
  TicketModel,
  AgentModel,
  ContactModel,
  FeedbackModel,
  FolderModel,
  KbSearchModel,
  KnowledgeBaseModel,
  MacroModel,
  MessageModel,
  OrganisationModel,
  ShortcutModel,
  TagModel,
  TemplateModel,
  VentilationModel,
]; // useful_models;

async function cleanIndex(model) {
  const index = model.modelName;
  const exist = await esClient.indices.exists({ index });
  if (exist) {
    await esClient.indices.delete({ index: index });
    console.log(`Index ${index} deleted`);
  } else console.log(`Index ${index} doesn't exist already`);

  console.log("Add mappings");
  try {
    const data = fs.readFileSync(`${MAPPING_DIR}/${index}.json`);
    const body = JSON.parse(data);
    await esClient.indices.create({ index, body });
  } catch (error) {
    console.log("Mapping by default : Everything will be mapped");
  }

  console.log("INDEXING", index);
  let bulk = [];

  async function flush() {
    if (!bulk.length) return;
    const bodyES = bulk.flatMap((obj) => {
      let objFormatted = obj.toObject();
      delete objFormatted._id;
      return [{ index: { _index: index, _id: obj._id.toString() } }, objFormatted];
    });
    await esClient.bulk({ refresh: true, body: bodyES });
    console.log("INDEXED", bulk.length);
    bulk = [];
  }

  async function findAll(Model, where, cb) {
    let count = 0;
    const total = await Model.countDocuments(where);
    await Model.find(where)
      .cursor()
      .addCursorFlag("noCursorTimeout", true)
      .eachAsync(async (doc) => {
        try {
          await cb(doc, count++, total);
        } catch (e) {
          console.log("e", e);
        }
      });
  }

  await findAll(model, {}, async (doc, i, total) => {
    try {
      console.log(`Indexing ${index} ${i + 1}/${total}`);
      bulk.push(doc);
      if (bulk.length >= 1000) await flush();
    } catch (e) {
      console.log("Error", e);
    }
  });

  await flush();
}

(async () => {
  try {
    console.time("Indexing models");
    for (const model of models_indexed) {
      await cleanIndex(model);
    }
    console.timeEnd("Indexing models");
    process.exit(0);
  } catch (e) {
    console.log(e);
  }
})();
