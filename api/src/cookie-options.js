const config = require("./config");

const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24; // 1 day (in ms)

function cookieOptions() {
  if (config.ENVIRONMENT === "development") {
    return { maxAge: COOKIE_MAX_AGE, httpOnly: true, secure: false, domain: "localhost", sameSite: "Lax" };
  } else if (config.ENVIRONMENT === "staging") {
    // Adjust the domain and SameSite attribute as needed
    return { maxAge: COOKIE_MAX_AGE, httpOnly: true, secure: true, domain: ".beta-snu.dev", sameSite: "Lax" };
  } else {
    // For production
    return { maxAge: COOKIE_MAX_AGE, httpOnly: true, secure: true, domain: ".snu.gouv.fr", sameSite: "Lax" };
  }
}

function logoutCookieOptions() {
  if (config.ENVIRONMENT === "development") {
    return { httpOnly: true, secure: false };
  } else if (config.ENVIRONMENT === "staging") {
    return { httpOnly: true, secure: true, sameSite: "Lax" };
  } else {
    return { httpOnly: true, secure: true, domain: ".snu.gouv.fr", sameSite: "Lax" };
  }
}

module.exports = {
  cookieOptions,
  logoutCookieOptions,
};
