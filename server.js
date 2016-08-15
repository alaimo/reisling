// ----------------------------------------------------------------------------
// @author Jonathan Alaimo
// @date 8.15.2016
// @description Entrypoint for the reisling server
// ----------------------------------------------------------------------------

var http = require('http'),
  Bluebird = require('bluebird'),
  requireAll = require('require-all'),
  express = require('express'),
  policies = requireAll(__dirname + '/lib/policies'),
  utils = requireAll(__dirname + '/lib/utils'),
  log = utils.logger;

// Method to bootstrap an express web service. Adds basic uncaught error
// handing and default middleware. Sets nunjucks as the templating engine.
// Optionally adds a very basic proxy server for development. This is
// if you are developing microservices locally against a deployed environment.
//
// @param params Object
// @param params.views Array || String
// @param params.port Number
// @param params.proxy Object
// @param prepare
function pour(params, prepare) {
  var app = express(),
    server = http.createServer(app),
    port,
    views;

  // Support method signatures with and without params.
  if(typeof params === 'function') {
    prepare = params,
    params = {};
  } else {
    params = params || {};
  }

  // Disable the default express header
  app.disable('x-powered-by');

  // Set log4js as the express logger
  app.use(log.express());

  // Default template engine configuration
  views = params.views || [];
  // Convert views to an array if needed so that we can add the default
  // view paths
  if(typeof views === 'string') {
    views = [views];
  }
  // Always append the default view templates.
  views.push(__dirname + '/views');
  utils.template.init(views, {autoescape: true, express: app});

  // Add default uncaught error handling
  app.use(policies.uncaughtErrorDomain(server));

  // support a proxy service if a proxy domain is provided
  // and we are not in production mode.
  if(params.proxy) {
    app.use(policies.proxyService(params.proxy));
  }

  // Synchronously execute the configuration callback. If necessary support
  // asychronous configuration later on.
  if(prepare) {
    prepare(app);
  } else {
    app.get('/', (req, res) => res.render('index.njk'));
    app.get('/error', (req, res) => {
      throw new Error('blah');
    });
  }

  // Handle 404
  app.use(policies.routeNotFound);

  // Global error handler
  app.use(policies.globalError);

  // Start the server and resolve as a promise with the
  // app and server instance in a tuple
  port = params.port || utils.config.port;
  return new Bluebird((resolve, reject) => {
    server.listen(port, err => {
      if(err) {
        log.error(`Failed to start on ${port}.`);
        log.error(JSON.stringify(err, null, 2));
        reject(err);
      } else {
        log.info(`Listening on ${port}. Press ctrl-C to stop.`);
        resolve([app, server]);
      }
    });
  });
}

// Simply start the server if we are running as the main module
if(require.main === module) {
  pour();
}

// Export utilits, policies, and low level resources for use as needed.
// In general, end-users will just need pour, log, and template.
module.exports = {
  Bluebird: Bluebird,
  constants: utils.constants,
  express: express,
  log: utils.log,
  policies: policies,
  pour: pour,
  template: utils.template
};