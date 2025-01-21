const { Client } = require("@elastic/elasticsearch");

const { ES_URL } = require("./config");

let esClient;

if (ES_URL) {
  esClient = new Client({ node: `${ES_URL}` });
} else {
  console.log("Can't initialize ES. Missing envs");
}

module.exports = esClient;
