// ----------------------------------------------------------------------------
// @author Jonathan Alaimo
// @date 8.15.2016
// @description Facade to log4js. Simplifies initialization for most use cases.
// ----------------------------------------------------------------------------

var log4js = require('log4js'),
  constants = require('./constants.js'),
  config = require('./config'),
  log = log4js.getLogger(constants.logs.MAIN);

// Assume all services will be containerized and/or log rotation will be
// handled outside of this service.
log4js.configure({
  appenders: [{
    type: 'console',
    layout: {
      type: 'pattern',
      pattern: "%[[%d{ISO8601_WITH_TZ_OFFSET}] [%p] %c%] - %m"
    }
  }],
  replaceConsole: true
});

module.exports = {
  // Expose the default getLogger method
  getLogger: function(id) {
    return id ? log4js.getLogger(id) : log;
  },

  // Simplify the connectLogger http logger method for express middleware
  express: function() {
    return log4js.connectLogger(
      log4js.getLogger(constants.logs.HTTP),
      config.log4js.httpFormat
    );
  },

  // Trace loggin against the global logger
  trace: function() {
    log.trace.apply(log, arguments);
  },

  // iIfo logging against the global logger
  info: function() {
    log.info.apply(log, arguments);
  },

  // Debug logging against the global logger
  debug: function() {
    log.debug.apply(log, arguments);
  },

  // Error logging against the global logger
  error: function() {
    log.error.apply(log, arguments);
  },

  // Fatal logging against the global logger
  fatal: function() {
    log.fatal.apply(log, arguments);
  },

  // Expose the configure method for advanced customization
  configure: function() {
    return log4js.configure.apply(log4js, arguments);
  }
};
