// ----------------------------------------------------------------------------
// @author Jonathan Alaimo
// @date 8.15.2016
// @description Policy to handle errors at the end of the express middleware
//    chain. In general, errors should be contextually handled before reaching
//    this policy.
// ----------------------------------------------------------------------------

var log = require('../utils/logger');
  constants = require('../utils/constants');

module.exports = function(err, req, res, next) {
  var accepts = req.accepts([
      constants.accepts.JSON,
      constants.accepts.HTML
    ]),
    status;

  log.error('Unhandled error:');
  log.error(err.stack);

  status = err.status || 500;
  res.status(status);

  switch(accepts) {
  case constants.accepts.JSON:
    res.json({
      message: 'Server Error',
      status: status
    });
    break;
  case constants.accepts.HTML:
    res.render('error.njk');
    break;
  default:
    res.end();
  }
};