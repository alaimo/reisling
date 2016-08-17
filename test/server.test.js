// ----------------------------------------------------------------------------
//  @author Jonathan Alaimo
//  @date 8.15.2016
//  @description Basic unit tests for the server
// ----------------------------------------------------------------------------

var request = require('request-promise'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  expect = require('chai').use(sinonChai).expect,
  riesling = require(__dirname + '/../server.js');

describe('server', () => {

  describe('#proxy', () => {
    var testRoute = '/test',
      cookieRoute = '/cookie',
      remoteServerUrl = 'http://localhost:4000',
      proxyServerUrl = 'http://localhost:3000',
      remoteServer,
      proxyServer;

    beforeEach(done => {
      riesling.pour({port: 4000}, app => {
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
      }).
      spread((app, server) => {
        remoteServer = server;
        done();
      });
    });

    afterEach(() => {
      if(proxyServer) {
        proxyServer.close();
        proxyServer = null;
      }
      if(remoteServer) {
        remoteServer.close();
        remoteServer = null;
      }
    });

    it('should proxy a request to the remote server', done => {
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

    it('should whitelist cookies', done => {
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

    it('should strip secure tags from listed cookies', done => {
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

    it('should proxy specific paths', done => {
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

  describe('#tmpl', () => {
    var testServer;

    afterEach(() => {
      if(testServer) {
        testServer.close();
      }
    });

    it('should accept a string', done => {
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

    it('should accept an array', done => {
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

    it('should accept on object', done => {
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