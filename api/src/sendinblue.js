const fetch = require("node-fetch");
// https://my.sendinblue.com/lists/add-attributes

const { ENVIRONMENT } = require("./config");
const { capture } = require("./sentry");
const { SENDINBLUE_API_KEY } = require("./config");

const apiKey = SENDINBLUE_API_KEY;

const api = async (path, options = {}) => {
  const res = await fetch(`https://api.sendinblue.com/v3${path}`, {
    ...options,
    headers: { "api-key": apiKey, "Content-Type": "application/json", ...(options.headers || {}) },
  });
  // if (!res.ok) throw res;
  const contentType = res.headers.raw()["content-type"];
  if (contentType && contentType.length && contentType[0].includes("application/json")) return await res.json();
  return await res.text();
};

// https://developers.sendinblue.com/reference#sendtransacemail

async function sendEmail({ htmlContent, subject, sender, to, params, attachment, cc } = {}) {
  try {
    const body = {};
    if (ENVIRONMENT !== "production") {
      const regexp = /(selego\.co|(beta|education|jeunesse-sports)\.gouv\.fr|fr\.ey\.com)/;
      to = to.filter((email) => email.match(regexp));
      if (cc?.length) cc = cc.filter((email) => email.match(regexp));
      if (to.length === 0) return { messageId: "fakeId" };
    }
    body.to = to.map((email) => ({ email }));
    if (cc?.length) body.cc = cc.map((email) => ({ email }));
    body.htmlContent = htmlContent;
    body.sender = sender;
    body.subject = subject;

    if (params) body.params = params;
    if (attachment) body.attachment = attachment;
    const mail = await api("/smtp/email", { method: "POST", body: JSON.stringify(body) });
    if (!mail || mail.code) capture("Error with SIB sendEmail", { extra: { mail, body } });
    return mail;
  } catch (e) {
    console.log("Erreur in sendEmail", e);
    capture(e);
  }
}

// https://developers.sendinblue.com/reference#sendtransacemail
async function sendTemplate({ templateId, params, to, cc } = {}) {
  try {
    const body = { templateId: parseInt(templateId) };
    if (ENVIRONMENT !== "production") {
      console.log("to before filter:", to);
      const regexp = /(selego\.co|(beta|education|jeunesse-sports)\.gouv\.fr|fr\.ey\.com)/;
      to = to.filter((email) => email.match(regexp));
      if (cc?.length) cc = cc.filter((email) => email.match(regexp));
    }
    body.to = to.map((email) => ({ email }));
    if (cc?.length) body.cc = cc.map((email) => ({ email }));
    if (params) body.params = params;

    const mail = await api("/smtp/email", { method: "POST", body: JSON.stringify(body) });
    if (!mail || mail.code) capture("Error with SIB sendTemplate", { extra: { mail, body } });
    return mail;
  } catch (e) {
    console.log("Erreur in sendTemplate", e);
    capture(e);
  }
}

/**
 * https://api.sendinblue.com/v3/contacts
 * @param email {string}
 * @param attributes {object}
 * @param emailBlacklisted {boolean}
 * @param smsBlacklisted {boolean}
 * @param listIds {integer[]}
 * @param updateEnabled {boolean}
 * @param smtpBlacklistSender {string[]}
 * @returns {Promise<void>}
 */
async function createContact(email, attributes, listIds) {
  const body = { email, attributes, listIds };
  return await api("/contacts", { method: "POST", body: JSON.stringify(body) });
}

/**
 * https://developers.sendinblue.com/reference#deletecontact
 * @param id {string|number} Email (urlencoded) OR ID of the contact
 * @returns {Promise<void>}
 */
async function deleteContact(id) {
  const identifier = typeof id === "string" ? encodeURIComponent(id) : id;
  return await api(`/contacts/${identifier}`, { method: "DELETE" });
}

/**
 * https://developers.sendinblue.com/reference#updatecontact
 * @param id {string|number} Email (urlencoded) OR ID of the contact
 * @param attributes {object}
 * @returns {Promise<void>}
 */
async function updateContact(id, attributes) {
  const identifier = typeof id === "string" ? encodeURIComponent(id) : id;
  const body = { attributes };
  const res = await api(`/contacts/${identifier}`, { method: "PUT", body: JSON.stringify(body) });
  if (!res) return true;
  return false;
}

async function sync(obj, listIds, transform) {
  // if (process.env.NODE_ENV !== "production") return;

  try {
    if (!obj.email) return console.log("EMAIL MISSING ", obj);

    let attributes = {};
    const fields = Object.keys(obj._doc);
    for (let i = 0; i < fields.length; i++) {
      const key = fields[i];
      if (obj[fields[i]] instanceof Date) {
        attributes[key.toUpperCase()] = obj[key].toISOString().slice(0, 10); // convert to date
      } else {
        attributes[key.toUpperCase()] = obj[key];
      }
    }

    attributes.TYPE = obj.collection.collectionName.toUpperCase(); // Add type

    delete attributes.EMAIL;
    delete attributes.PASSWORD;
    delete attributes.__V;
    delete attributes._ID;

    if (transform) attributes = transform(attributes);

    const ok = await updateContact(obj.email, attributes);
    if (!ok) await createContact(obj.email, attributes, listIds);
  } catch (e) {
    console.log("error", e);
  }
}

async function unsync(obj) {
  try {
    await deleteContact(obj.email);
  } catch (e) {
    console.log("Can't delete in sendinblue", obj.email);
  }
}

module.exports = { sync, unsync, sendEmail, sendTemplate, createContact, updateContact, deleteContact };
