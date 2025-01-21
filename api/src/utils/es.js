const esClient = require("../es");

// Variables should be renamed to avoid confusion.
async function* scrollSearch(params, client) {
  let response = await client.search(params);
  console.log("response", response.aggregations.filtered.foldersId.buckets);
  while (true) {
    const sourceHits = response.hits.hits;

    if (sourceHits.length === 0) {
      break;
    }

    for (const hit of sourceHits) {
      yield hit;
    }

    if (!response._scroll_id) {
      break;
    }

    response = await client.scroll({
      scroll_id: response._scroll_id,
      scroll: params.scroll,
    });
  }
}

// Can get more than 10k results.
// The es param is given to scroll function
async function allRecords(index, query, client = esClient) {
  const params = {
    index,
    scroll: "1m",
    size: 1000,
    body: query,
  };
  console.log("params", params);
  const result = [];

  for await (const hit of scrollSearch(params, client)) {
    result.push({ _id: hit._id, ...hit._source });
  }
  return result;
}

module.exports = {
  allRecords,
};
