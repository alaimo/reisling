// ----------------------------------------------------------------------------
// @author Jonathan Alaimo
// @date 8.15.2016
// @description Middleware to catch and process uncaught asynchronous errors.
//    This uses the core module domain. As of node v6.x the domain module is
//    marked at pending deprecation. We will continue to use this module until
//    it is marked as fully deprecated and the node foundation has presented an
//    alternative approach. An addition note: this is a safety net to cleanly
//    shut down unhealthy workers after uncaught asynchronous errors. We should
//    aim to never require this.
// ----------------------------------------------------------------------------

var domain = require('domain'),
  cluster = require('cluster'),
  log = require('../utils/logger');

module.exports = function(server) {
  return function(req, res, next) {
    var d = domain.create();
    d.on('error', err => {
      log.error('DOMAIN ERROR CAUGHT');
      log.error(err.stack);

      try {
        setTimeout(function() {
          log.error('Failsafe shutdown.');
          process.exit(1);
        }, 5000);

        log.debug('Stopping the worker');
        if(cluster.worker) {
          cluster.worker.disconnect();
        }

        // Prevent new requests
        server.close();

        try {
          next(err);
        } catch(expressError) {
          log.error('Express mechanism failed');
          log.error(expressError.stack);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'text/plain');
          res.end('Server error.');
        }
      } catch(shutdownError) {
        log.error('Unable to send 500 response');
      }
    });

    // Add the request and response to the domain
    d.add(req);
    d.add(res);

    // Execute the rest of the request chain in the domain
    d.run(next);
  };
};