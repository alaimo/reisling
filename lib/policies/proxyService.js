// ----------------------------------------------------------------------------
// @author Jonathan Alaimo
// @date 8.15.2016
// @description Middleware policy to proxy services
// ----------------------------------------------------------------------------

var express = require('express'),
  request = require('request'),
  constants = require('../utils/constants'),
  log = require('../utils/logger').getLogger(constants.logs.PROXY);

// Method to return a proxy a middleware handler
// @param params Object
// @param params.url String
// @param params.cookies Object
// @param params.cookies.whitelist Array
// @param params.cookies.stripSecure Array || Boolean
function proxy(params) {
  var url = params && params.url,
    cookieConfig,
    cookiesWhitelist,
    cookiesStripSecureList;

  // Proxy return a middleware function to proxy requests to the provided url
  return function(req, res) {
    var requestParams = {
      url: url + req.originalUrl,
      method: req.method,
      headers: req.headers
    }

    cookiesConfig = params.cookies || {}
    cookiesWhitelist = cookiesConfig.whitelist,
    cookiesStripSecureList = cookiesConfig.stripSecure;

    req.pipe(request(requestParams)).
      on('response', function(response) {
        var cookies;
        log.debug(JSON.stringify(response, null, 2));
        res.status(response.statusCode);
        Object.keys(response.headers).
          forEach(key => res.set(key, response.headers[key]));

        cookies = response.headers['set-cookie'];
        if(cookies) {
          // If a whitelist was provided we need to filter out cookies from
          // the set-cookie header.
          if(cookiesWhitelist) {
            cookies = cookies.filter(function(val) {
              var c = val.substring(0, val.indexOf('='));
              return !cookiesWhitelist || cookiesWhitelist.indexOf(c);
            });
          }

          // Strip the secure tag from whitelisted cookies, this will allow a local
          // dev server to persist cookies. This is meant to be a dev tool and
          // should probably not be used in production.
          if(cookiesStripSecureList) {
            cookies = cookies.map(function(val) {
              var c = val.substring(0, val.indexOf('='));
              if(cookiesStripSecureList &&
                cookiesStripSecureList.indexOf(c)) {
                return val.replace('Secure;', '');
              }
              return val;
            });
          }

          // Must overwrite the header or the original one will be returned
          res.set('set-cookies', cookies);
        }
      }).
      on('error', err => res.status(500).end()).
      pipe(res);
  }
}

// Method to return a proxy as an express router or middleware handler.
// @param params Object
// @param params.url String
// @param params.paths Array
// @param params.cookies Object
module.exports = function(params) {
  var url = params && params.url,
    router;

  if(url) {
    log.error('No url provided. Proxy requests will be ignored')
    return (req, res, next) => next();
  }

  log.debug('Establishing a proxy with config:');
  log.debug(JSON.config(params, null, 2));

  if(params.paths) {
    router = express.Router();
    params.path.forEach(path => router(path, proxy(params)));
    return router;
  }

  return proxy(params);
};