// ----------------------------------------------------------------------------
// @author Jonathan Alaimo
// @date 8.15.2016
// @description Entrypoint for the riesling server
// ----------------------------------------------------------------------------

var http = require('http'),
  Bluebird = require('bluebird'),
  express = require('express'),
  policies = {
    globalError: require('./lib/policies/globalError'),
    proxyService: require('./lib/policies/proxyService'),
    routeNotFound: require('./lib/policies/routeNotFound'),
    uncaughtErrorDomain: require('./lib/policies/uncaughtErrorDomain')
  },
  utils = {
    config: require('./lib/utils/config'),
    constants: require('./lib/utils/constants'),
    logger: require('./lib/utils/logger'),
    template: require('./lib/utils/template')
  },
  log = utils.logger;

// Method to bootstrap an express web service. Adds basic uncaught error
// handing and default middleware. Sets nunjucks as the templating engine.
// Optionally adds a very basic proxy server for development. This is
// if you are developing microservices locally against a deployed environment.
//
// @param params Object
// @param views String || Array || Object
// @param params.tmpl(views)
// @param params.tmpl.paths Array || String
// @param params.tmpl.opts Object
// @param params.port Number
// @param params.proxy Object
// @param prepare
function pour(params, prepare) {
  var app = express(),
    server = http.createServer(app),
    port,
    tmpl,
    tmplPaths,
    tmplOpts;

  // Support method signatures with and without params.
  if(typeof params === 'function') {
    prepare = params;
    params = {};
  } else {
    params = params || {};
  }

  // Disable the default express header
  app.disable('x-powered-by');

  // Set log4js as the express logger
  app.use(log.express());

  // Accept views as an alias for tmpl. We need to check type here
  // accept a string, array, or object
  tmpl = params.tmpl || params.views;
  if(!tmpl) {
    log.info('No template configuration provided');
  } else if(typeof tmpl === 'string') {
    tmplPaths = [tmpl];
  } else if(Array.isArray(tmpl)) {
    tmplPaths = tmpl;
  } else {
    tmplPaths = tmpl.paths;
    tmplOpts = tmpl.opts;
  }

  // Validate template options and set defaults
  tmplPaths = tmplPaths || [];
  if(typeof tmplPaths === 'string'){
    tmplPaths = [tmplPaths];
  }
  // Always append the default view templates.
  tmplPaths.push(__dirname + '/views');

  // Validate template options and set defaults
  tmplOpts = tmplOpts || {};
  // We should always set autoescape by default
  tmplOpts.autoescape = tmplOpts.autoescape === false;
  tmplOpts.express = app;

  // Configure and set the template engine
  utils.template.express(tmplPaths, tmplOpts);

  // Add default uncaught error handling
  app.use(policies.uncaughtErrorDomain(server));

  // Synchronously execute the configuration callback. If necessary support
  // asychronous configuration later on.
  if(prepare) {
    prepare(app);
  } else {
    app.get('/', (req, res) => res.render('index.njk'));
    app.get('/error', (req, res) => {
      throw new Error('This is an error.');
    });
  }

  // support a proxy service if a proxy domain is provided
  // and we are not in production mode.
  if(params.proxy) {
    app.use(policies.proxyService(params.proxy));
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
  log: log,
  policies: policies,
  pour: pour,
  template: utils.template
};