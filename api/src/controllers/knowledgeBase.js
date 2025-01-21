/* eslint-disable no-prototype-builtins */
const express = require("express");
const router = express.Router();
const passport = require("passport");
const slugify = require("slugify");

const esClient = require("../es");
const { capture } = require("../sentry");
const KnowledgeBaseModel = require("../models/knowledgeBase");
const KbSearchModel = require("../models/kbSearch");
const { uploadPublicPicture, ERRORS } = require("../utils/index.js");
const { revalidateSiteMap, formatSectionsIntoSitemap } = require("../utils/sitemap.utils");

const findChildrenRecursive = async (section, allChildren, { findAll = false }) => {
  if (section.type !== "section") return;
  const children = await KnowledgeBaseModel.find({ parentId: section._id })
    .sort({ type: -1, position: 1 })
    .populate({ path: "author", select: "_id firstName lastName role" })
    .lean(); // to json;
  for (const child of children) {
    allChildren.push(child);
    if (findAll) await findChildrenRecursive(child, allChildren, { findAll });
  }
};

const findParents = async (item) => {
  const fromRootToItem = [{ ...item }]; // we spread item to avoid circular reference in item.parents = parents
  let currentItem = item;
  while (currentItem.parentId) {
    const parent = await KnowledgeBaseModel.findById(currentItem.parentId).lean(); // to json;
    fromRootToItem.unshift(parent);
    currentItem = parent;
  }
  return fromRootToItem;
};

const findChildren = async (section, findAll = false) => {
  const allChildren = [];
  await findChildrenRecursive(section, allChildren, { findAll });
  return allChildren;
};

const buildTree = async (root, { lean = true } = {}) => {
  root.children = [];
  const children = [];
  await findChildrenRecursive(root, children, { lean });
  for (const child of children) {
    await buildTree(child);
  }
  root.children = children;
  return root;
};

const consolidateAllowedRoles = async (initSection = { type: "section" }, newAllowedRoles = []) => {
  const tree = await buildTree(initSection, { lean: true });
  const checkAllowedRoles = async (section) => {
    if (!section?.children?.length) return;
    for (const child of section.children) {
      const unallowedRoles = child.allowedRoles.filter((role) => !section.allowedRoles.includes(role));
      const childNewAllowedRoles = newAllowedRoles.filter((role) => !child.allowedRoles.includes(role));
      if (unallowedRoles.length || childNewAllowedRoles.length) {
        await KnowledgeBaseModel.findByIdAndUpdate(child._id, {
          allowedRoles: [...child.allowedRoles.filter((role) => section.allowedRoles.includes(role)), ...childNewAllowedRoles],
        });
      }
      await checkAllowedRoles(child);
    }
  };
  checkAllowedRoles(tree);
};

const findArticlesWithSlug = (slug, content) => {
  if (!content) return false;
  for (const item of content) {
    if (item.type === "link") {
      if (item.url.includes(slug)) return true;
    }
    if (item.children) {
      const hasSlug = findArticlesWithSlug(slug, item.children);
      if (hasSlug) return true;
    }
  }
  return false;
};

const findAndUpdateArticlesWithLinksWithSlug = async (oldSlug, newSlug) => {
  const articles = await KnowledgeBaseModel.find({ type: "article", slug: { $ne: newSlug } });
  const findAndUpdateLink = (item) => {
    if (item.type === "link") {
      if (item.url.includes(oldSlug)) {
        const url = `/base-de-connaissance/${newSlug}`;
        return {
          ...item,
          url,
        };
      }
      return item;
    }
    if (item.children) {
      return {
        ...item,
        children: item.children.map(findAndUpdateLink),
      };
    }
    return item;
  };
  for (const article of articles) {
    const { content } = article;
    if (!!content && JSON.stringify(content).includes(oldSlug)) {
      article.set({ content: content.map(findAndUpdateLink) });
      await article.save();
    }
  }
};

const getSlug = async (title) => {
  const slug = slugify(title.trim(), {
    replacement: "-",
    remove: /[*+~.()'"!?:@]/g,
    lower: true, // convert to lower case, defaults to `false`
    strict: true, // strip special characters except replacement, defaults to `false`
    locale: "fr", // language code of the locale to use
    trim: true, // trim leading and trailing replacement chars, defaults to `true`
  });
  let itemWithSameSlug = await KnowledgeBaseModel.findOne({ slug });
  let inc = 0;
  let newSlug = slug;
  while (itemWithSameSlug) {
    inc++;
    newSlug = `${slug}-${inc}`;
    itemWithSameSlug = await KnowledgeBaseModel.findOne({ slug: newSlug });
  }
  return newSlug;
};

const getContentAsText = (content) => {
  const getTextFromElement = (element, strings) => {
    for (const key of Object.keys(element)) {
      if (["text", "url"].includes(key)) strings.push(element[key].trim());
      if (["children"].includes(key)) {
        for (const childElement of element[key]) {
          getTextFromElement(childElement, strings);
        }
      }
    }
  };
  return content
    .reduce((strings, element) => {
      getTextFromElement(element, strings);
      return strings;
    }, [])
    .join(" ");
};

router.post("/:allowedRole/siblings", async (req, res) => {
  try {
    const item = req.body;
    const allowedRole = req.params.allowedRole;
    const siblings = await KnowledgeBaseModel.find({ allowedRoles: allowedRole, parentId: item.parentId }).lean();

    return res.status(200).send({ siblings: siblings, ok: true });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: ERRORS.SERVER_ERROR, error });
  }
});

router.post("/picture", passport.authenticate("agent", { session: false, failWithError: true }), async (req, res) => {
  try {
    const files = Object.keys(req.files || {}).map((e) => req.files[e]);
    let file = files[0];
    // If multiple file with same names are provided, file is an array. We just take the latest.
    if (Array.isArray(file)) {
      file = file[file.length - 1];
    }
    const { name, data, mimetype } = file;
    if (!["image/jpeg", "image/png"].includes(mimetype)) return res.status(500).send({ ok: false, code: "UNSUPPORTED_TYPE" });

    const resultingFile = { mimetype: "image/png", data };
    const filename = slugify(`kn/${Date.now()}-${name.replace(".png", "").replace(".jpg", "").replace(".jpeg", "")}`, {
      replacement: "-",
      remove: /[*+~.()'"!?:@]/g,
      lower: true, // convert to lower case, defaults to `false`
      strict: true, // strip special characters except replacement, defaults to `false`
      locale: "fr", // language code of the locale to use
      trim: true, // trim leading and trailing replacement chars, defaults to `true`
    });
    const result = await uploadPublicPicture(`${filename}.png`, resultingFile);
    return res.status(200).send({ data: result.Location, ok: true });
  } catch (error) {
    capture(error);
    if (error === "FILE_CORRUPTED") return res.status(500).send({ ok: false, code: ERRORS.FILE_CORRUPTED });
    return res.status(500).send({ ok: false, code: ERRORS.SERVER_ERROR });
  }
});

router.post("/", passport.authenticate("agent", { session: false, failWithError: true }), async (req, res) => {
  try {
    const kb = {};

    kb.author = req.user._id;
    kb.status = "DRAFT";

    if (!req.body.hasOwnProperty("title") || !req.body.title.trim()) {
      return res.status(400).send({
        ok: false,
        error: "Un titre est obligatoire !",
      });
    }
    if (req.body.hasOwnProperty("type")) kb.type = req.body.type;
    if (req.body.hasOwnProperty("parentId")) kb.parentId = req.body.parentId;
    if (req.body.hasOwnProperty("position")) kb.position = req.body.position;
    if (req.body.hasOwnProperty("description")) kb.description = req.body.description;
    if (req.body.hasOwnProperty("title")) {
      kb.title = req.body.title.trim();
      kb.slug = await getSlug(req.body.title);
    }
    if (req.body.hasOwnProperty("allowedRoles")) {
      kb.allowedRoles = req.body.allowedRoles;
      if (kb.parentId) {
        const parent = await KnowledgeBaseModel.findById(kb.parentId);
        if (parent) {
          kb.allowedRoles = req.body.allowedRoles.filter((role) => parent.allowedRoles.includes(role));
        }
      }
    }
    if (req.body.hasOwnProperty("status")) kb.status = req.body.status;
    if (req.body.hasOwnProperty("keywords")) kb.keywords = req.body.keywords;
    if (req.body.hasOwnProperty("content")) {
      kb.content = req.body.content;
      kb.contentAsText = getContentAsText(req.body.content);
    }

    const newKb = await KnowledgeBaseModel.create(kb);
    await revalidateSiteMap();

    const data = await KnowledgeBaseModel.findById(newKb._id).populate({ path: "author", select: "_id firstName lastName role" }).lean();
    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: ERRORS.SERVER_ERROR, error });
  }
});

router.post("/duplicate/:id", passport.authenticate("agent", { session: false, failWithError: true }), async (req, res) => {
  try {
    const oldKb = await KnowledgeBaseModel.findById(req.params.id);
    if (!oldKb) {
      return res.status(404).send({ ok: false, code: ERRORS.NOT_FOUND });
    }
    //duplicate old kb
    const newKb = await KnowledgeBaseModel.create({
      type: oldKb.type,
      parentId: oldKb.parentId,
      position: oldKb.position + 1,
      title: oldKb.title + " - (Copie)",
      slug: oldKb.slug + "-copie",
      allowedRoles: oldKb.allowedRoles,
      status: "DRAFT",
      author: req.user._id,
      icon: oldKb.icon,
      content: oldKb.content,
      contentAsText: oldKb.contentAsText,
      group: oldKb.group,
      keywords: oldKb.keywords,
    });
    await revalidateSiteMap();
    const data = await KnowledgeBaseModel.findById(newKb._id).populate({ path: "author", select: "_id firstName lastName role" }).lean();
    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: ERRORS.SERVER_ERROR, error });
  }
});
// this is when reordering by drag and drop, in the tree or in a section
router.put("/reorder", passport.authenticate("agent", { session: false, failWithError: true }), async (req, res) => {
  try {
    const itemsToReorder = req.body;
    const session = await KnowledgeBaseModel.startSession();
    await session.withTransaction(async () => {
      for (const item of itemsToReorder) {
        await KnowledgeBaseModel.findByIdAndUpdate(item._id, { position: item.position, parentId: item.parentId || null });
        await consolidateAllowedRoles(item, item.allowedRoles);
      }
    });
    session.endSession();
    await revalidateSiteMap();
    const data = await KnowledgeBaseModel.find().populate({ path: "author", select: "_id firstName lastName role" });
    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: ERRORS.SERVER_ERROR, error });
  }
});

router.put("/:id", passport.authenticate("agent", { session: false, failWithError: true }), async (req, res) => {
  try {
    const existingKb = await KnowledgeBaseModel.findById(req.params.id);
    if (!existingKb) return res.status(404).send({ ok: false, code: ERRORS.NOT_FOUND });

    const updateKb = {};
    let updateChildrenAllowedRoles = false;
    let oldSlugToUpdate = null;
    let newAllowedRoles = [];

    if (req.body.hasOwnProperty("type")) updateKb.type = req.body.type;
    if (req.body.hasOwnProperty("parentId")) updateKb.parentId = req.body.parentId;
    if (req.body.hasOwnProperty("position")) updateKb.position = req.body.position;
    if (req.body.hasOwnProperty("title")) {
      if (!req.body.title.trim().length) {
        return res.status(400).send({
          ok: false,
          error: "Un titre est obligatoire !",
        });
      }
      updateKb.title = req.body.title;
    }
    if (req.body.hasOwnProperty("slug")) {
      if (req.body.slug.trim() !== existingKb.slug) {
        updateKb.slug = await getSlug(req.body.slug.trim());
        if (existingKb.slug !== updateKb.slug) oldSlugToUpdate = existingKb.slug;
      }
    }
    if (req.body.hasOwnProperty("imageSrc")) updateKb.imageSrc = req.body.imageSrc;
    if (req.body.hasOwnProperty("imageAlt")) updateKb.imageAlt = req.body.imageAlt;
    if (req.body.hasOwnProperty("icon")) updateKb.icon = req.body.icon;
    if (req.body.hasOwnProperty("group")) updateKb.group = req.body.group;
    if (req.body.hasOwnProperty("keywords")) updateKb.keywords = req.body.keywords;
    if (req.body.hasOwnProperty("description")) updateKb.description = req.body.description;
    if (req.body.hasOwnProperty("allowedRoles")) {
      updateKb.allowedRoles = req.body.allowedRoles;
      if (JSON.stringify(existingKb.allowedRoles) !== JSON.stringify(updateKb.allowedRoles)) {
        if (existingKb.parentId) {
          const parent = await KnowledgeBaseModel.findById(existingKb.parentId);
          if (parent) {
            updateKb.allowedRoles = req.body.allowedRoles.filter((role) => parent.allowedRoles.includes(role));
          }
        }
        newAllowedRoles = updateKb.allowedRoles.filter((role) => !existingKb.allowedRoles.includes(role));
        updateChildrenAllowedRoles = true;
      }
    }
    if (req.body.hasOwnProperty("status")) {
      updateKb.status = req.body.status;
      if (req.body.status === "ARCHIVED") {
        updateKb.parentId = "637df076cf15bd3fed5ff754";
      }
    }
    if (req.body.hasOwnProperty("author")) updateKb.author = req.body.author;
    if (req.body.hasOwnProperty("read")) updateKb.read = req.body.read;

    existingKb.set(updateKb);
    await existingKb.save({ fromUser: req.user });

    if (updateChildrenAllowedRoles) {
      await consolidateAllowedRoles(existingKb, newAllowedRoles);
    }

    if (oldSlugToUpdate) {
      await findAndUpdateArticlesWithLinksWithSlug(oldSlugToUpdate, existingKb.slug);
    }

    await revalidateSiteMap();

    return res.status(200).send({
      ok: true,
      data: await KnowledgeBaseModel.findById(existingKb._id).populate({ path: "author", select: "_id firstName lastName role" }).lean(), // to json,
    });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: ERRORS.SERVER_ERROR, error });
  }
});

router.put("/:id/content", passport.authenticate("agent", { session: false, failWithError: true }), async (req, res) => {
  try {
    if (!req.body.hasOwnProperty("content")) {
      return res.status(400).send({ ok: false, code: ERRORS.INVALID_BODY });
    }
    const existingKb = await KnowledgeBaseModel.findById(req.params.id);
    if (!existingKb) return res.status(404).send({ ok: false, code: ERRORS.NOT_FOUND });

    const updateKb = {};

    updateKb.content = req.body.content;
    updateKb.contentAsText = getContentAsText(req.body.content);
    updateKb.contentUpdatedAt = new Date();

    existingKb.set(updateKb);
    await existingKb.save({ fromUser: req.user });

    if (existingKb.type === "section") await revalidateSiteMap();

    return res.status(200).send({
      ok: true,
      data: await KnowledgeBaseModel.findById(existingKb._id).populate({ path: "author", select: "_id firstName lastName role" }).lean(), // to json,
    });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: ERRORS.SERVER_ERROR, error });
  }
});

router.get("/:id/patches", passport.authenticate("agent", { session: false, failWithError: true }), async (req, res) => {
  try {
    if (!req.user?.role === "AGENT") return res.status(403).send({ ok: false, code: ERRORS.OPERATION_UNAUTHORIZED });
    const elem = await KnowledgeBaseModel.findById(req.params.id);
    if (!elem) return res.status(404).send({ ok: false, code: ERRORS.NOT_FOUND });

    const data = await elem.patches.find({ ref: elem._id }).sort("-date");
    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: ERRORS.SERVER_ERROR });
  }
});

// this is for admin: we download all in once so that we can build the tree and navigate quickly
router.get("/all", passport.authenticate("agent", { session: false, failWithError: true }), async (req, res) => {
  try {
    const data = await KnowledgeBaseModel.find(req.query || {}).populate({ path: "author", select: "_id firstName lastName role" });

    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: ERRORS.SERVER_ERROR, error });
  }
});

router.get("/sitemap", async (req, res) => {
  try {
    const pipeline = [{ $match: { status: "PUBLISHED" } }, { $group: { _id: "$parentId", count: { $sum: 1 } } }];
    const sections = await KnowledgeBaseModel.aggregate(pipeline);
    // Filter out null group (sections and orphaned items) and map the rest into an array of IDs.
    const sectionIds = sections.filter((e) => e._id).map((e) => e._id.toString());
    const data = await KnowledgeBaseModel.find(
      { type: "section", status: "PUBLISHED", _id: { $in: sectionIds } },
      { title: 1, slug: 1, parentId: 1, position: 1, allowedRoles: 1 }
    );
    if (!data) return res.status(404).send({ ok: false, code: ERRORS.NOT_FOUND });
    return res.status(200).send({ ok: true, data: formatSectionsIntoSitemap(data) });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: ERRORS.SERVER_ERROR, error });
  }
});

router.post("/all", passport.authenticate("agent", { session: false, failWithError: true }), async (req, res) => {
  try {
    const data = await KnowledgeBaseModel.find({}).populate({ path: "author", select: "_id firstName lastName role" });
    //check if every element of data is included in req.query
    const filteredData = data.filter((item) =>
      item.type === "section" || req.body.allowedRoles.length > 0 ? req.body.allowedRoles?.every((v) => item.allowedRoles.includes(v)) : true
    );

    return res.status(200).send({ ok: true, data: filteredData });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: ERRORS.SERVER_ERROR, error });
  }
});

router.get("/:allowedRole/top4Article/:number", async (req, res) => {
  try {
    // Trouver et trier les articles par le nombre de 'read', et limiter le résultat à 5
    const top4Articles = await KnowledgeBaseModel.find({
      type: "article", // Spécifie que vous voulez seulement les articles
      allowedRoles: req.params.allowedRole,
      status: "PUBLISHED",
    })
      .sort({ read: -1 }) // Tri par ordre décroissant sur le champ 'read'
      .limit(req.params.number || 4) // Limite le nombre de documents retournés à 5
      .lean(); // to json;

    // Si aucun article n'a été trouvé
    if (!top4Articles.length) {
      return res.status(404).send({ ok: false, code: ERRORS.NOT_FOUND });
    }

    return res.status(200).send({ ok: true, data: top4Articles });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: ERRORS.SERVER_ERROR, error });
  }
});

router.get("/:allowedRole/search", async (req, res) => {
  try {
    // https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-multi-match-query.html#multi-match-types
    const esQuery = {
      index: "knowledgebase",
      body: {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: req.query.search,
                  type: "bool_prefix",
                  fields: ["title^3", "keywords^3", "contentAsText"],
                },
              },
            ],
          },
        },
        size: 1000,
      },
    };

    if (req.params.allowedRole !== "admin") {
      esQuery.body.query.bool.filter = [
        {
          term: { "allowedRoles.keyword": req.params.allowedRole },
        },
        {
          term: { "status.keyword": "PUBLISHED" },
        },
      ];
    }
    const response = await esClient.search(esQuery);
    if (req.params.allowedRole !== "admin") {
      for (const id of response.hits.hits.map((hit) => hit._id)) {
        await KnowledgeBaseModel.findByIdAndUpdate(id, { $inc: { searched: 1 } });
      }
    }
    await KbSearchModel.create({
      search: req.query.search,
      role: req.params.allowedRole,
      resultsNumber: response.hits.hits.length,
    });

    res.status(200).send({
      ok: true,
      data: response.hits.hits.map((hit) => ({
        _id: hit._id,
        ...hit._source,
      })),
    });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: ERRORS.SERVER_ERROR, error });
  }
});
// reset and redo es indexing
// (async () => {
//   let i = 0;
//   await esClient.indices.delete({ index: "knowledgebase" });
//   for await (const doc of KnowledgeBaseModel.find([{ $sort: { _id: 1 } }]).cursor()) {
//     await doc.index();
//     if (i % 100 === 0) console.log(i, doc._id);
//     i++;
//   }
//   console.log("DONE");
// })();

// this is for the public-access part of the knowledge base (not the admin part)
router.get("/:allowedRole/:slug", async (req, res) => {
  try {
    const existingKb = await KnowledgeBaseModel.findOne({ slug: req.params.slug, allowedRoles: req.params.allowedRole, status: "PUBLISHED" })
      .populate({
        path: "author",
        select: "_id firstName lastName role",
      })
      .lean(); // to json

    if (!existingKb) {
      // if already connected and document not existing with specified role, we just return NOT_FOUND
      if (req.params.allowedRole !== "public") return res.status(404).send({ ok: false, code: ERRORS.NOT_FOUND });
      // if not connected yet, we check if the document exists for specific roles
      const existingKbDifferentRole = await KnowledgeBaseModel.findOne({ slug: req.params.slug, status: "PUBLISHED" })
        .populate({
          path: "author",
          select: "_id firstName lastName role",
        })
        .lean(); // to json
      if (!existingKbDifferentRole) return res.status(404).send({ ok: false, code: ERRORS.NOT_FOUND });
      // this should trigger login modal
      return res.status(400).send({ ok: false, code: ERRORS.OPERATION_NOT_ALLOWED });
    }

    if (req.params.allowedRole !== "admin") {
      await KnowledgeBaseModel.findByIdAndUpdate(existingKb._id, { $inc: { read: 1 } });
    }

    const parents = await findParents(existingKb);
    existingKb.parents = parents;

    if (existingKb.type === "section") {
      const children = await KnowledgeBaseModel.find({ parentId: existingKb._id, allowedRoles: req.params.allowedRole, status: "PUBLISHED" })
        .sort({ type: -1, position: 1 })
        .populate({ path: "author", select: "_id firstName lastName role" })
        .lean(); // to json;
      existingKb.children = children;
      for (const child of existingKb.children) {
        if (child.type === "section") {
          const subChildren = await KnowledgeBaseModel.find({ parentId: child._id, allowedRoles: req.params.allowedRole, status: "PUBLISHED" })
            .sort({ type: -1, position: 1 })
            .populate({ path: "author", select: "_id firstName lastName role" })
            .lean(); // to json;
          child.children = subChildren;
        }
      }
    }

    return res.status(200).send({ ok: true, data: existingKb });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: ERRORS.SERVER_ERROR, error });
  }
});

// this is for the public-access part of the knowledge base (not the admin part)
router.get("/:allowedRole", async (req, res) => {
  try {
    const children = await KnowledgeBaseModel.find({ allowedRoles: req.params.allowedRole, status: "PUBLISHED" })
      .sort({ parentId: 1, type: -1, position: 1 })
      .populate({ path: "author", select: "_id firstName lastName role" })
      .lean(); // to json;

    const data = [];
    children.forEach((child) => {
      if (!child.parentId) {
        data.push(child);
      } else {
        const parent = data.find((item) => item._id.toString() === child.parentId.toString());
        if (!parent) return;
        if (!parent.children) parent.children = [];
        parent.children.push(child);
      }
    });

    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: ERRORS.SERVER_ERROR, error });
  }
});

router.delete("/:id", passport.authenticate("agent", { session: false, failWithError: true }), async (req, res) => {
  try {
    const kb = await KnowledgeBaseModel.findById(req.params.id);
    if (!kb) return res.status(404).send({ ok: false, code: ERRORS.NOT_FOUND });

    const childrenToDelete = await findChildren(kb, true);
    // check if there is no reference of existing article/section in links
    const slugs = [kb, ...childrenToDelete].map((item) => item.slug);
    const articlesReferingItemsToDelete = [];
    const articlesNotToDelete = await KnowledgeBaseModel.find({ type: "article", _id: { $nin: [kb, ...childrenToDelete].map((item) => item._id) } });
    for (const slug of slugs) {
      for (const article of articlesNotToDelete) {
        const hasSlug = findArticlesWithSlug(slug, article.content);
        if (hasSlug) articlesReferingItemsToDelete.push(article);
      }
    }

    if (articlesReferingItemsToDelete.length) {
      return res.status(400).send({
        ok: true,
        data: articlesReferingItemsToDelete,
        code: "ARTICLES_REFERING_TO_ITEMS",
        // error: `Il y a une référence de l'élément que vous souhaitez supprimer dans d'autres articles, veuillez les mettre à jour: ${articlesReferingItemsToDelete.map(
        //   (article) => `\n${article.title}`,
        // )}`,
      });
    }

    // delete items
    for (const child of [kb, ...childrenToDelete]) {
      await KnowledgeBaseModel.findByIdAndDelete(child._id);
    }

    if (kb.type === "section") await revalidateSiteMap();

    res.status(200).send({ ok: true });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, error, code: ERRORS.SERVER_ERROR });
  }
});

module.exports = router;
