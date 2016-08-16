// ----------------------------------------------------------------------------
//  @author Jonathan Alaimo
//  @date 8.15.2016
//  @description Basic unit tests for policies
// ----------------------------------------------------------------------------

var sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  expect = require('chai').use(sinonChai).expect,
  nunjucks = require('nunjucks'),
  requireAll = require('require-all'),
  policies = requireAll(__dirname + '/../lib/policies');

describe('policies', function() {

  describe('.globalError', function() {
    // TODO
  });

  describe('.proxyService', function() {
    // TODO
  });

  describe('.routeNotFound', function() {
    // TODO
  });

  describe('.uncaughtErrorDomain', function() {
    // TODO
  });

});