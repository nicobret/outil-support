const express = require("express");
const router = express.Router();
const passport = require("passport");
const { capture } = require("../sentry");
const ShortcutModel = require("../models/shortcut");
const esClient = require("../es");

const SERVER_ERROR = "SERVER_ERROR";

const updateChildrenRecursive = async (content, user) => {
  for (const object of content) {
    if (object.children) await updateChildrenRecursive(object.children, user);
    if (object.text) {
      const regex = /#{(.*?)}/g;
      const matches = object.text.match(regex);
      if (matches) {
        for (const match of matches) {
          const value = match.replace("#{", "").replace("}", "").split(".")[1];
          object.text = object.text.replace(match, user[value]);
        }
      }
    }
  }
  return content;
};

router.get("/", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    const query = {};
    if (req.query.signatureDest) {
      query.dest = { $in: [req.query.signatureDest] };
    }
    const data = await ShortcutModel.findOne(query);
    if (data) {
      data.content = await updateChildrenRecursive(data.content ? data.content : [], req.user);
      return res.status(200).send({ ok: true, data });
    }
    return res.status(404).send({ ok: false, message: "No matching shortcut data found" });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.get("/search", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    let query = {};
    const q = req.query.q || "";
    if (req.user.role === "REFERENT_DEPARTMENT") {
      query = {
        $or: [
          { userRole: req.user.role, userDepartment: req.user.departments, name: { $regex: q } },
          { userRole: "AGENT", name: { $regex: q }, userVisibility: "ALL" },
        ],
      };
    } else if (req.user.role === "REFERENT_REGION") {
      query = {
        $or: [
          { userRole: req.user.role, userRegion: req.user.region, name: { $regex: q } },
          { userRole: "AGENT", name: { $regex: q }, userVisibility: "ALL" },
        ],
      };
    } else {
      query = {
        userRole: req.user.role,
        name: { $regex: q },
      };
    }
    const hits = await ShortcutModel.find(query);
    const data = hits.map((e) => ({
      _id: e._id,
      name: e.name,
      text: e.text,
      status: e.status,
      content: e.content,
      keyword: e.keyword,
      userVisibility: e.userVisibility,
      dest: e.dest,
      ...e._source,
    }));

    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.post("/search", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    let query = {};
    const q = req.body.q || "";
    if (req.user.role === "REFERENT_DEPARTMENT") {
      query = {
        $or: [
          { userRole: req.user.role, userDepartment: req.user.departments, name: { $regex: q } },
          { userRole: "AGENT", name: { $regex: q }, userVisibility: "ALL" },
        ],
      };
    } else if (req.user.role === "REFERENT_REGION") {
      query = {
        $or: [
          { userRole: req.user.role, userRegion: req.user.region, name: { $regex: q } },
          { userRole: "AGENT", name: { $regex: q }, userVisibility: "ALL" },
        ],
      };
    } else {
      query = {
        userRole: req.user.role,
        name: { $regex: q },
      };
    }
    if (req.body.filter.contactGroup?.length > 0) {
      query = {
        ...query,
        dest: { $in: req.body.filter.contactGroup },
      };
    }
    if (req.body.isSignature) {
      query = {
        ...query,
        isSignature: true,
      };
    } else {
      query = {
        ...query,
        isSignature: { $ne: true },
      };
    }
    const hits = await ShortcutModel.find(query);
    const data = hits.map((e) => ({
      _id: e._id,
      name: e.name,
      text: e.text,
      status: e.status,
      content: e.content,
      keyword: e.keyword,
      userVisibility: e.userVisibility,
      dest: e.dest,
      ...e._source,
    }));

    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.post("/", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    let shortcut = req.body.shortcut;
    shortcut.userRole = req.user.role;
    if (req.user.role === "REFERENT_REGION") shortcut.userRegion = req.user.region;
    const data = await ShortcutModel.create(shortcut);
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
    if (req.body.hasOwnProperty("name")) obj.name = req.body.name;
    if (req.body.hasOwnProperty("text")) obj.text = req.body.text;
    if (req.body.hasOwnProperty("status")) obj.status = req.body.status;
    if (req.body.hasOwnProperty("content")) obj.content = req.body.content;
    if (req.body.hasOwnProperty("keyword")) obj.keyword = req.body.keyword;
    if (req.body.hasOwnProperty("userVisibility")) obj.userVisibility = req.body.userVisibility;
    if (req.body.hasOwnProperty("dest")) obj.dest = req.body.dest;

    const data = await ShortcutModel.findOneAndUpdate(query, obj);
    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

router.delete("/:id", passport.authenticate("agent", { session: false }), async (req, res) => {
  try {
    await ShortcutModel.findByIdAndDelete(req.params.id);

    return res.status(200).send({ ok: true });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});
module.exports = router;
