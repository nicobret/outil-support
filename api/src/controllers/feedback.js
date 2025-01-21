const express = require("express");
const router = express.Router();
const { capture } = require("../sentry");
const passport = require("passport");
const FeedbackModel = require("../models/feedback");
const ContactModel = require("../models/contact");
const KnowledgeBaseModel = require("../models/knowledgeBase");

const SERVER_ERROR = "SERVER_ERROR";

router.post("/", async function (req, res) {
  try {
    const { contactEmail, ...rest } = req.body;
    let contact;
    if (contactEmail) {
      contact = await ContactModel.findOne({ email: contactEmail.toLowerCase() });
      if (!contact) contact = await ContactModel.create({ email: contactEmail.toLowerCase() });
    }
    const feedback = { ...rest };
    if (contact) feedback.createdBy = contact._id;
    const newFeedback = await FeedbackModel.create(feedback);
    return res.status(200).send({ ok: true, data: newFeedback });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.get("/", passport.authenticate("agent", { session: false, failWithError: true }), async (req, res) => {
  try {
    const data = await FeedbackModel.find(req.query || {});
    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR });
  }
});

router.put("/archivefeedbacks", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    await FeedbackModel.updateMany({ _id: req.body.selectedComments }, { treatedAt: new Date(), treatedBy: req.user });
    return res.status(200).send({ ok: true });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.get("/usefulArticles", passport.authenticate("agent", { session: false, failWithError: true }), async (req, res) => {
  try {
    const mostUsefulArticles = await FeedbackModel.aggregate([
      {
        $group: {
          _id: "$knowledgeBaseArticle",
          positiveFeedback: { $sum: { $cond: ["$isPositive", 1, 0] } },
          negativeFeedback: { $sum: { $cond: ["$isPositive", 0, 1] } },
          untreatedComment: { $sum: { $cond: [{ $and: [{ $ifNull: ["$comment", false] }, { $not: { $ifNull: ["$treatedAt", false] } }] }, 1, 0] } },
          treatedComment: { $sum: { $cond: [{ $and: [{ $ifNull: ["$comment", false] }, { $ifNull: ["$treatedAt", false] }] }, 1, 0] } },
        },
      },
      { $sort: { positiveFeedback: -1 } },
    ]);

    await KnowledgeBaseModel.populate(mostUsefulArticles, { path: "_id" });

    const lessLikedArticles = [...mostUsefulArticles];
    lessLikedArticles.sort((a, b) => b.negativeFeedback - a.negativeFeedback);

    const mostUntreatedComments = [...mostUsefulArticles];
    mostUntreatedComments.sort((a, b) => b.untreatedComment - a.untreatedComment);

    const mostTreatedComments = [...mostUsefulArticles];
    mostTreatedComments.sort((a, b) => b.treatedComment - a.treatedComment);

    return res.status(200).send({ ok: true, data: { mostUsefulArticles, lessLikedArticles, mostUntreatedComments, mostTreatedComments } });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR });
  }
});

module.exports = router;
