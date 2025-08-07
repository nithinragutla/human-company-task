const serverless = require('serverless-http');
const app = require('../server'); // path to your Express app

module.exports.handler = serverless(app);
