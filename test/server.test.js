// ----------------------------------------------------------------------------
//  @author Jonathan Alaimo
//  @date 8.15.2016
//  @description Basic unit tests for the server
// ----------------------------------------------------------------------------

var request = require('request'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  expect = require('chai').use(sinonChai).expect,
  riesling = require(__dirname + '/../server.js');

describe('server', () => {

  describe('#proxy', () => {
    var proxyServer,
      remoteServer;

    beforeEach(done => {
      riesling.pour({port: 4000}, app => {
        app.get('/test', (req, res) => res.send('OK'));
      }).
      spread((app, server) => {
        remoteServer = server;
        done();
      });
    });

    afterEach(() => {
      if(proxyServer) {
        proxyServer.close();
      }
      if(remoteServer) {
        remoteServer.close();
      }
    });

    it('should proxy a request to the remote server', done => {
      riesling.pour({
        port: 3000,
        proxy: {
          url: 'http://localhost:4000'
        }
      }).
      spread((app, server) => {
        proxyServer = server;
        request('http://localhost:3000/test', (err, response, body) => {
          expect(err).to.not.be.ok;
          expect(response.statusCode).to.equal(200);
          expect(body).to.equal('OK');
          done();
        });
      });
    });

  }); // #proxy

});