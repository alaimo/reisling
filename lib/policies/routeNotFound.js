// ----------------------------------------------------------------------------
// @author Jonathan Alaimo
// @date 7.27.2016
// @description Simple middleware for unknown requested routes
// ----------------------------------------------------------------------------

var log = require('../utils/logger'),
  constants = require('../utils/constants');

module.exports = function(req, res, next) {
  var accepts = req.accepts([
      constants.accepts.JSON,
      constants.accepts.HTML
    ]),
    status = 404;

  res.status(status);
  switch(accepts) {
  case constants.accepts.JSON:
    res.json({
      status: status,
      message: 'Not Found'
    });
    break;
  case constants.accepts.HTML:
    res.render('notFound.njk');
    break;
  default:
    res.send('Not Found');
  }
};