const path = require("node:path");
const ini = require("ini");
const fs = require("node:fs");
const config = ini.parse(
  fs.readFileSync(path.join(__dirname, "../", "server.ini"), "utf8")
);
const home = config.home.url;
const secret = config.google.secret
const hash = require(path.join(__dirname, "../", "api", "hash.js"));
const moment = require("moment");
const axios = require('axios')
const qs = require('qs');

const body = {
  type: "object",
  required: ["code",'g-recaptcha-response'],
  properties: {
    code: { type: "string", minLength: 5 },
    'g-recaptcha-response': { type: "string", minLength: 1 },

  },
};

function readFile(file) {
  return new Promise((resolve) => {
    fs.readFile(path.join(__dirname, "../", "sandbox", file), (err, data) => {
      if (err) resolve(null);
      resolve(data);
    });
  });
}

function writeFile(file, data) {
  return new Promise((resolve) => {
    fs.writeFile(path.join(__dirname, "../", "sandbox", file), data, () => {
      resolve(data);
    });
  });
}

async function routes(fastify, options) {
  fastify.post(
    "/rest/code",
    { schema: body, attachValidation: true },
    async function (req, res) {
      console.log('req', req.body)
      res.header("Access-Control-Allow-Origin", "*");
      let error = req.validationError;
      if (error) {
        return res.redirect(home);
      }

      let response = await axios({
        method:'POST',
        url: 'https://www.google.com/recaptcha/api/siteverify',
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        data: qs.stringify({
          secret: secret,
          response: req.body['g-recaptcha-response'],
          remoteip: req.headers['cf-connecting-ip']
        }),
        timeout: 5000
      })

      if(response.status === 200){
        let object = response.data
  
        if(object.success === false){
          return res.code(403).compress(JSON.stringify({msg: "You were seen as a robot, thus your request is disallowed."}))
        } 
      } else {
        return res.code(403).compress(JSON.stringify({msg: "Could not validate you as human due Google API timed out, try later.."}))
      }
    

      if (req.session.posts > 20) {
        let date = new Date();
        res.type("text/plain").compress(
          `
=============================================

       You have reached your limit !
   Try again on -->
   ${moment(req.session.cookie.expires).format("DD-MM-YYYY hh:mm:ss")}

   Time on server -->
   ${moment(date).format("DD-MM-YYYY hh:mm:ss")}

=============================================
                `
        );
      }

      if (typeof req.body.code === "undefined") {
        return res.type("text/plain").compress(
          `
=============================================

                Invalid Form Data

=============================================
                `
        );
      }
      let { code } = req.body;
      if (code.split("\n") > 3000) {
        return res.type("text/plain").compress(
          `
=============================================

  Your Code cannot be greater than 3K lines

=============================================
                `
        );
      }
      if (code.split("\n") < 2) {
        return res.type("text/plain").compress(
          `
=============================================

     At least 2 lines of code required!

=============================================
                `
        );
      }

      let file = await hash.generate();
      await writeFile(file, code);
      let sandbox = await readFile(file);

      if (sandbox === null) {
        return res.type("text/plain").compress(
          `
=============================================

    Something went wrong try again later...

=============================================
                `
        );
      }

      req.session.posts += 1;
      req.session.save(() => {
        return;
      });
      res.header('Sandbox-URL',`${home}/sandbox/${String(file).replace(".txt", "")}`)
      return res.redirect(
        `${home}/sandbox/${String(file).replace(".txt", "")}`
      );
    }
  );
}

module.exports = routes;
