const express = require("express");
const router = express.Router();
const passport = require("passport");
const { capture } = require("../sentry");
const esClient = require("../es");

const FolderModel = require("../models/folder");

const SERVER_ERROR = "SERVER_ERROR";

router.get("/", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "REFERENT_DEPARTMENT") {
      query.userRole = req.user.role;
      query.userDepartment = { $in: req.user.departments };
    } else if (req.user.role === "REFERENT_REGION") {
      query.userRole = req.user.role;
      query.userRegion = req.user.region;
    } else {
      query.userRole = req.user.role;
    }

    const folders = await FolderModel.find(query).sort({ folderIndex: 1 }).exec();

    return res.status(200).send({ ok: true, data: folders });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.get("/all", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    let folders = await FolderModel.find({});

    return res.status(200).send({ ok: true, data: folders });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.post("/", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const newFolderIndex = await FolderModel.countDocuments();
    let folder = req.body.folder;
    folder.folderIndex = newFolderIndex;
    folder.userRole = req.user.role;
    if (req.user.role === "REFERENT_DEPARTMENT") {
      folder.userDepartment = req.user.departments[0];
    }
    if (req.user.role === "REFERENT_REGION") {
      folder.userRegion = req.user.region;
    }
    const data = await FolderModel.create(folder);
    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.put("/:id", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const query = { _id: req.params.id };
    const obj = {};
    obj.name = req.body.name;
    obj.abbreviation = req.body.abbreviation;
    obj.folderIndex = req.body.folderIndex;
    const data = await FolderModel.findOneAndUpdate(query, obj);
    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.post("/reindex", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    for (let folder of req.body.folders) {
      await FolderModel.findOneAndUpdate({ _id: folder._id }, { folderIndex: folder.folderIndex });
    }
    return res.status(200).send({ ok: true });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.delete("/:id", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const query = { _id: req.params.id };
    const data = await FolderModel.findOneAndDelete(query);
    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

module.exports = router;
