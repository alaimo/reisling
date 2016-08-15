// ----------------------------------------------------------------------------
// @author Jonathan Alaimo
// @date 8.15.2016
// @description Config defaults.
// ----------------------------------------------------------------------------

var env = process.env;
module.exports = {
  env: env.NODE_ENV || 'development',
  log4js: {
    httpFormat: env.LOG4JS_HTTP_FORMAT ||
      ':method :url :req[content-type] :status :response-time ms'
  },
  port: env.NODE_PORT || 3000
};