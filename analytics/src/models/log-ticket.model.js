const { DataTypes } = require("sequelize");
const { db } = require("../services/databases/postgresql.service");

const OBJ = db.define(
  "log_tickets",
  {
    evenement_nom: DataTypes.TEXT,
    evenement_type: DataTypes.TEXT,
    evenement_valeur: DataTypes.TEXT,
    ticket_id: DataTypes.TEXT,
    ticket_source: DataTypes.TEXT,
    ticket_contact_id: DataTypes.TEXT,
    ticket_agent_id: DataTypes.TEXT,
    ticket_tags_id: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },
    ticket_created_at: DataTypes.DATE,
    ticket_closed_at: DataTypes.DATE,
    date: DataTypes.DATE,
    raw_data: DataTypes.JSONB,
  },
  {
    defaultScope: {
      attributes: { exclude: ["createdAt", "updatedAt", "raw_data"] },
    },
  },
);

module.exports = OBJ;
