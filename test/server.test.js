// ----------------------------------------------------------------------------
//  @author Jonathan Alaimo
//  @date 8.15.2016
//  @description Basic unit tests for the server
// ----------------------------------------------------------------------------

var request = require('request-promise'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  expect = require('chai').use(sinonChai).expect,
  riesling = require(__dirname + '/../server.js'),
  remoteServerUrl = 'http://localhost:4000',
  remoteServer2Url = 'http://localhost:5000',
  proxyServerUrl = 'http://localhost:3000';

// factory method to create dummy test servers
function rServer(port, testRoute, cookieRoute) {
  return riesling.pour({port: port}, app => {
    // basic test api
    app.get(testRoute, (req, res) => res.send('OK'));
    // test api for cookies
    app.get(cookieRoute, (req, res) => {
      res.cookie('x-test-token', 'ok', {
        maxAge: 10000,
        secure: true,
        httpOnly: true
      }).
      cookie('x-invalid-token', 'invalid', {
        httpOnly: true,
        secure: true
      }).
      send('OK');
    });
  });
}

describe('server', function() {

  describe('#proxy', function() {
    var testRoute = '/test',
      cookieRoute = '/cookie',
      remoteServer,
      proxyServer;

    beforeEach(function(done) {
      rServer(
        4000,
        testRoute,
        cookieRoute
      ).
      spread((app, server) => {
        remoteServer = server;
        done();
      });
    });

    afterEach(function() {
      if(proxyServer) {
        proxyServer.close();
        proxyServer = null;
      }
      if(remoteServer) {
        remoteServer.close();
        remoteServer = null;
      }
    });

    it('should proxy a request to the remote server', function(done) {
      riesling.pour({
        proxy:{
          url: remoteServerUrl
        }
      }).
      spread((app, server) => {
        proxyServer = server;
        return request.get(proxyServerUrl + testRoute);
      }).
      then(body => {
        expect(body).to.equal('OK');
        done();
      }).
      catch(err => done(err));
    });

    it('should whitelist cookies', function(done) {
      riesling.pour({
        proxy: {
          url: remoteServerUrl,
          cookies: {
            whitelist: ['x-test-token']
          }
        }
      }).
      spread((app, server) => {
        proxyServer = server;
        return request.get({
          url: proxyServerUrl + cookieRoute,
          resolveWithFullResponse: true
        });
      }).
      then(response => {
        var cookies = response.headers['set-cookie'];
        expect(cookies).to.be.an('array');
        expect(cookies).to.have.length(1);
        expect(cookies[0].indexOf('x-test-token')).to.equal(0);
        done();
      });
    });

    it('should strip secure tags from listed cookies', function(done) {
      riesling.pour({
        proxy: {
          url: remoteServerUrl,
          cookies: {
            stripSecure: ['x-test-token']
          }
        }
      }).
      spread((app, server) => {
        proxyServer = server;
        return request.get({
          url: proxyServerUrl + cookieRoute,
          resolveWithFullResponse: true
        });
      }).
      then(response => {
        var cookies = response.headers['set-cookie'];
        expect(cookies).to.be.an('array');
        expect(cookies.length).to.be.above(0);
        cookies.forEach(val => {
          if(val.indexOf('bz-test-token') === 0) {
            expect(val.indexOf('Secure')).to.equal(-1);
          } else if (val.indexOf('bz-invalid-token') === 0) {
            expect(val.indexOf('Secure')).to.be.above(0);
          }
        });
        done();
      });
    });

    it('should proxy specific paths', function(done) {
      riesling.pour({
        proxy: {
          url: remoteServerUrl,
          paths: [testRoute]
        }
      }).
      spread((app, server) => {
        proxyServer = server;
        return request.get({
          url: proxyServerUrl + testRoute,
          resolveWithFullResponse: true
        });
      }).
      then(response => {
        expect(response.statusCode).to.equal(200);
        return request.get({
          url: proxyServerUrl + cookieRoute,
          resolveWithFullResponse: true,
          simple: false
        });
      }).
      then(response => {
        expect(response.statusCode).to.equal(404);
        done();
      }).
      catch(err => done(err));
    });

  }); // #proxy

  describe('#multiproxy', function() {
    var r1,
      r2,
      p1;

    before(function(done) {
      rServer(
        4000,
        '/test',
        '/cookie'
      ).
      spread((app, server) => {
        r1 = server;
        return rServer(
          5000,
          '/test2',
          '/cookie2'
        );
      }).
      spread((app, server) => {
        r2 = server;
        done();
      });
    });

    after(function() {
      if(r1) {
        r1.close();
        r1 = null;
      }

      if(r2) {
        r2.close();
        r2 = null;
      }

      if(p1) {
        p1.close();
        p1 = null;
      }
    });

    it('should support multiple proxy configs', function(done) {
      riesling.pour({
        proxy: [{
          url: remoteServerUrl,
          paths: ['/test']
        }, {
          url: remoteServer2Url,
          paths: ['/test2']
        }]
      }).
      spread((app, server) => {
        p1 = server;
        return request.get({
          url: proxyServerUrl + '/test',
          resolveWithFullResponse: true
        });
      }).
      then(response => {
        expect(response.statusCode).to.equal(200);
        return request.get({
          url: proxyServerUrl + '/test2',
          resolveWithFullResponse: true
        });
      }).
      then(response => {
        expect(response.statusCode).to.equal(200);
        done();
      }).
      catch(err => done(err));
    });

  }); // multiproxy

  describe('#tmpl', () => {
    var testServer;

    afterEach(() => {
      if(testServer) {
        testServer.close();
      }
    });

    it('should accept a string', function(done) {
      riesling.pour({
        views: __dirname + '/views2'
      }).
      spread((app, server) => {
        testServer = server;
        app.render('ok.njk', {}, function(err, data) {
          expect(err).to.not.be.ok;
          expect(data).to.equal('OK');
          done();
        });
      }).
      catch(err => done(err));
    });

    it('should accept an array', function(done) {
      riesling.pour({
        views: [__dirname + '/views2']
      }).
      spread((app, server) => {
        testServer = server;
        app.render('ok.njk', {}, function(err, data) {
          expect(err).to.not.be.ok;
          expect(data).to.equal('OK');
          done();
        });
      }).
      catch(err => done(err));
    });

    it('should accept on object', function(done) {
      riesling.pour({
        views: {
          paths: [__dirname + '/views2'],
          opts: {
            autoescape: true
          }
        }
      }).
      spread((app, server) => {
        testServer = server;
        app.render('ok.njk', {}, function(err, data) {
          expect(err).to.not.be.ok;
          expect(data).to.equal('OK');
          done();
        });
      }).
      catch(err => done(err));
    });

  }); // #tmpl

});