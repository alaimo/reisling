// ----------------------------------------------------------------------------
// @author Jonathan Alaimo
// @date 8.15.2016
// @description Middleware policy to proxy services
// ----------------------------------------------------------------------------

var express = require('express'),
  request = require('request'),
  constants = require('../utils/constants'),
  log = require('../utils/logger').getLogger(constants.logs.PROXY),
  invalidHeaders = [
    'host',
    'hostname',
    'port',
    'referrer',
    'pathname',
    'path',
    'href'
  ];

// Method to return a proxy a middleware handler
// @param params Object
// @param params.url String
// @param params.cookies Object
// @param params.cookies.whitelist Array
// @param params.cookies.stripSecure Array
function proxy(params) {
  var url = params.url,
    cookiesWhitelist = params.cookies && params.cookies.whitelist,
    cookiesStripSecureList = params.cookies && params.cookies.stripSecure;

  // Proxy return a middleware function to proxy requests to the provided url
  return function(req, res, next) {
    var requestParams = {
      url: url + req.originalUrl,
      method: req.method,
      headers: {}
    };

    // Add safe headers
    Object.keys(req.headers).
      filter(key => invalidHeaders.indexOf(key) === -1).
      forEach(key => requestParams.headers[key] = req.headers[key]);

    log.debug('Proxy with requestParams: ');
    log.debug(JSON.stringify(requestParams, null, 2));

    req.pipe(request(requestParams)).
      on('response', function(response) {
        log.debug(JSON.stringify(response, null, 2));
        var cookies = response.headers['set-cookie'];
        if(cookies) {
          // If a whitelist was provided we need to filter out cookies from
          // the set-cookie header.
          if(cookiesWhitelist) {
            cookies = cookies.filter(function(val) {
              var c = val.substring(0, val.indexOf('='));
              return cookiesWhitelist.indexOf(c) === 0;
            });
          }
          // Strip the secure tag from explicitly defined cookies
          if(cookiesStripSecureList) {
            cookies = cookies.map(function(val) {
              var c = val.substring(0, val.indexOf('='));
              if(cookiesStripSecureList.indexOf(c) !== -1) {
                return val.replace(/Secure;?/g, '');
              }
              return val;
            });
          }
          // Must overwrite the header or the original one will be returned
          response.headers['set-cookie'] = cookies;
        }
      }).
      on('error', err => {
        log.error('Proxy call failed: ');
        log.error(JSON.stringify(err, null, 2));
        res.status(500).end();
      }).
      pipe(res);
  };
}

// Method to return a proxy as an express router or middleware handler.
// @param params Object
// @param params.url String
// @param params.paths Array
// @param params.cookies Object
module.exports = function(params) {
  var url = params && params.url,
    router;

  if(!url) {
    log.error('No url provided. Proxy requests will be ignored');
    return (req, res, next) => next();
  }

  log.debug('Establishing a proxy with config:');
  log.debug(JSON.stringify(params, null, 2));

  if(params.paths) {
    router = express.Router();
    params.paths.forEach(path => router.use(path, proxy(params)));
    return router;
  }

  return proxy(params);
};