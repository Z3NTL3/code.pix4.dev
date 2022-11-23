/*
 *       Programmed by PIX4
 *          code.pix4.dev
 */

const path = require("node:path");
const fastify = require("fastify").fastify({
  logger: {
    level: "trace",
    transport: {
      target: "pino/file",
      options: { destination: path.join(__dirname, "logs", "log.log") },
    },
    serializers: {
      req(request) {
        return {
          id: request.id,
          url: request.url,
          ip: request.ip,
          proc: request.protocol,
          method: request.method,
        };
      },
    },
  },
});
const ini = require("ini");
const fs = require("node:fs");
const config = ini.parse(
  fs.readFileSync(path.join(__dirname, "server.ini"), "utf-8")
);
const AsciiTable = require("ascii-table");
const { createClient } = require("redis");
const fastifyCookie = require("@fastify/cookie");
const fastifySession = require("@fastify/session");
const { XMLParser } = require("fast-xml-parser");
const xml_parser = new XMLParser();
var Parse = require('fast-json-parse')

var redisClient = createClient({ legacyMode: true });
redisClient.connect().catch((err) => {
  console.error(err)
  process.exit(-1);
});
var redisStore = require("connect-redis")(fastifySession);

const session_opts = {
  secret:
    "Owhh you are a keyboard warrior xd some random text is usually used here g",
  cookie: {
    maxAge: Number(config.session.max_age),
    secure: true,
    httpOnly: false,
  },
  store: new redisStore({ client: redisClient }),
};

async function startServer() {
  fastify.setErrorHandler((err, _, res) => {
    console.error(err);
    res.code(403).type("text/plain").compress(`
================================
      CLIENT Bad REQUEST
================================
`);
  });

  await fastify.register(require("@fastify/formbody"));
  await fastify.register(fastifyCookie);
  await fastify.register(fastifySession, session_opts);

  await fastify.register(require("@fastify/static"), {
    root: path.join(__dirname, "public_html"),
    prefix: "/",
  });
  await fastify.register(import("@fastify/compress"), {
    global: true,
    inflateIfDeflated: true,
    treshold: 1042,
    requestEncodings: ["br", "gzip", "deflate"],
    removeContentLengthHeader: false,
  });

  await fastify.register(require("@fastify/view"), {
    engine: {
      ejs: require("ejs"),
    },
    root: path.join(__dirname, "public_html"),
    propertyName: "render",
  });

  app.removeContentTypeParser('application/json')
  app.addContentTypeParser(['application/xml','text/xml'],{parseAs: 'string'}, function (request, payload, done) {
      try {
          let parsedPayload = xml_parser.parse(payload)
          done(null, parsedPayload)
      } catch(err){
          console.log(err)
          done(err,null)
      }
  })
  app.addContentTypeParser(['application/json','text/json'],{ parseAs: 'string' }, function (request, payload, done) {
      try {
          let parsedPayload = Parse(payload)
          done(null, parsedPayload)
      } catch(err){
          done(err,null)
      }
  })
  app.addContentTypeParser('*',{ parseAs: 'string' }, function (request, payload, done) {
      try {
          let jsonParsed = Parse(payload)
          done(null,jsonParsed)
      } catch(err){
          done(err,null)
      }
  })
  app.setNotFoundHandler((req,res) => {
      res.redirect('/')
  })

  app.setErrorHandler((err,req,res)=>{
      res.code(500).send(JSON.stringify({err: "bad client request"}))
  })
  

  await fastify.register(require(path.join(__dirname, "routes", "sandbox.js")));
  await fastify.register(require(path.join(__dirname, "routes", "home.js")));
  await fastify.register(require(path.join(__dirname, "routes", "rest.js")));

  fastify.addHook("onRequest", async (req, reply) => {
    if (typeof req.session.posts === "undefined") {
      req.session.posts = 0;
      req.session.save(() => {
        return;
      });
    }
  });

  fastify.listen(
    { host: config.server.host, port: config.server.port },
    (err, _) => {
      if (err) throw err;
      let table = new AsciiTable();
      table
        .setBorder("*")
        .setHeading("Server", "State")
        .addRow(`${config.server.host}:${config.server.port}`, "Running!");

      console.log(table.toString());
    }
  );
}
startServer();
