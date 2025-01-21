require("../mongo");
const esClient = require("../es");

const AgentModel = require("../models/agent");
const TicketModel = require("../models/ticket");
const ContactModel = require("../models/contact");
const MessageModel = require("../models/message");
const TagModel = require("../models/tag");
const FolderModel = require("../models/folder");
const ShortcutModel = require("../models/shortcut");

(async () => {
  console.log("START DELETE ALL AGENTS");
  await TicketModel.deleteMany({});
  await cleanIndex("ticket", TicketModel);
  console.log("END CREATE AGENTS");

  console.log("START DELETE ALL AGENTS");
  await MessageModel.deleteMany({});
  await cleanIndex("message", MessageModel);
  console.log("END CREATE AGENTS");

  console.log("START DELETE ALL AGENTS");
  await ContactModel.deleteMany({});
  await cleanIndex("contact", ContactModel);
  console.log("END CREATE AGENTS");

  console.log("START DELETE ALL AGENTS");
  await AgentModel.deleteMany({});
  await cleanIndex("agent", AgentModel);
  console.log("END CREATE AGENTS");
})();

async function cleanIndex(index, model) {
  const exists = await esClient.indices.exists({ index });
  if (exists) {
    console.log("REMOVE INDEX ", index);
    await esClient.indices.delete({ index });
  }
  console.log("CREATE INDEX");

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
      console.log(`Indexing ${index} ${i}/${total}`);
      bulk.push(doc);
      if (bulk.length >= 100) await flush();
    } catch (e) {
      console.log("Error", e);
    }
  });

  await flush();
}
