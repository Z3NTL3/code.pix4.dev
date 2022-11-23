const path = require("node:path");
const ini = require("ini");
const fs = require("node:fs");
const config = ini.parse(
  fs.readFileSync(path.join(__dirname, "../", "server.ini"), "utf8")
);
const home = config.home.url;
const site_key = config.google.site_key

async function routes(fastify, options) {
  fastify.get("/", async function (req, res) {
    return res.render("home", { home: home, key: site_key });
  });
}

module.exports = routes;
