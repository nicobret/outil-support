const express = require("express");
const passport = require("passport");
const router = express.Router();
const { capture } = require("../sentry");
const ContactModel = require("../models/contact");

const WRONG_REQUEST = "WRONG_REQUEST";
const SERVER_ERROR = "SERVER_ERROR";
const NOT_FOUND = "NOT FOUND";

router.post("/", passport.authenticate("apikey", { session: false }), async (req, res) => {
  try {
    const contactsSNU = req.body.contacts;
    for (let contact of contactsSNU) {
      const obj = {};
      const organisation = req.user;
      const flatAttributes = (arr) => arr.map((e) => e.name);
      const filterAttributes = flatAttributes(contact.attributes).map((e) => {
        if (flatAttributes(organisation.attributes).includes(e)) {
          return { name: e, value: contact.attributes.find((att) => att.name === e).value, format: organisation.attributes.find((att) => att.name === e).format };
        }
        return null;
      });

      if (Array.isArray(filterAttributes.find((att) => att.name === "departement").value)) {
        filterAttributes.find((att) => att.name === "departement").value = filterAttributes.find((att) => att.name === "departement").value[0];
      }

      obj.email = contact.email;
      obj.firstName = contact.firstName;
      obj.lastName = contact.lastName;
      obj.attributes = filterAttributes;
      obj.department = filterAttributes.find((attr) => attr.name === "departement" || attr.name === "département" || attr.name === "department")?.value || undefined;
      obj.region = filterAttributes.find((attr) => attr.name === "region" || attr.name === "région")?.value || undefined;
      obj.role = filterAttributes.find((attr) => attr.name === "role" || attr.name === "rôle")?.value || undefined;

      await ContactModel.findOneAndUpdate({ email: obj.email.toLowerCase() }, obj, { new: true, upsert: true });
    }
    return res.status(200).send({ ok: true });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

module.exports = router;
