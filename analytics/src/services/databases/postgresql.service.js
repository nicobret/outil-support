require("dotenv").config();
const { Sequelize } = require("sequelize");
const { ENVIRONMENT, POSTGRESQL } = require("../../config");
const { capture } = require("../../sentry");

const db = new Sequelize(POSTGRESQL, {
  logging: ENVIRONMENT === "development",
});

db.authenticate()
  .then(() => console.info("Postgresql connection has been established successfully."))
  .catch(capture);

/**
 *
 * @param {Object} model - Sequelize model or DB instance
 * @param {string} action - Sequelize action (e.g., count, findAll, query)
 * @param {Object|string} query - Sequelize query object or raw query
 * @param {Object} [queryOptions] - Sequelize query options, e.g., db.query('SELECT * FROM log_youngs WHERE id = :id', { type: db.QueryTypes.SELECT, replacements: { id: 1 }})
 *
 * @returns - Sequelize result
 */
db.cacheRequest = async (model, action, query, queryOptions) => {
  if (!model[action]) throw new Error(`Missing action ${action} in model`);

  try {
    return await model[action](query, queryOptions);
  } catch (error) {
    capture(error);
    throw error;
  }
};

module.exports = { db };
