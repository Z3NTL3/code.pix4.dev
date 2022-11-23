const path = require("node:path");
const fs = require("node:fs");
const ini = require("ini");
const config = ini.parse(
  fs.readFileSync(path.join(__dirname, "../", "server.ini"), "utf8")
);
const home = config.home.url;
const secret = config.google.secret
const site_key = config.google.secret
const verification = "https://www.google.com/recaptcha/api/siteverify"

function getAllLanguages() {
  return new Promise((resolve) => {
    fs.readdir(
      path.join(__dirname, "../", "public_html", "code", "languages"),
      (err, files) => {
        resolve(files);
      }
    );
  });
}

function sandBoxExistance(token) {
  return new Promise((resolve) => {
    fs.access(
      path.join(__dirname, "../", "sandbox", `${token}.txt`),
      fs.F_OK,
      (err) => {
        if (err) {
          return resolve(null);
        }
        resolve(true);
      }
    );
  });
}

function getFile(token) {
  return new Promise((resolve) => {
    fs.readFile(
      path.join(__dirname, "../", "sandbox", `${token}.txt`),
      (err, data) => {
        if (err) {
          return resolve(null);
        }
        resolve(data.toString());
      }
    );
  });
}

async function routes(fastify, options) {
  fastify.get("/sandbox/:token", async function (req, res) {
    let languages = await getAllLanguages();
    let tokenExists = await sandBoxExistance(req.params.token);

    if (tokenExists === null) {
      return res.type("text/plain").compress(`
================================
  This sandbox does not exist
================================
`);
    }

    let sandbox = await getFile(req.params.token);
    if (sandbox === null) {
      return res.type("text/plain").compress(`
================================
  This sandbox does not exist
================================
            `);
    }
    return res.render("index", {
      code: sandbox,
      languages: languages,
      home: home,
    });
  });
}

module.exports = routes;
