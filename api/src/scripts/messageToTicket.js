require("../mongo");
const esClient = require("../es");

const contactModel = require("../models/contact");
const ticketModel = require("../models/ticket");
const messageModel = require("../models/message");

const fs = require("fs");

(async function messageToTicket() {
  try {
    let tickets = await ticketModel.find({});
    let i = 0;
    for (let ticket of tickets) {
      let messages = await messageModel.find({ ticketId: ticket._id });
      for (let message of messages) {
        if (!ticket.textMessage?.includes(message.text)) {
          ticket.textMessage.push(message.text);
        }
      }
      await ticket.save();
      await ticket.index();
      if (i % 100 === 0) {
        console.log("index", i);
      }
      i++;
    }
    console.log("index", i);
    console.log(tickets.length);
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(0);
  }
})();
