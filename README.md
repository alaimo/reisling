# riesling
A lightweight opinionated approach for bootstrapping web applications with
express, nunjucks, bluebird, request, and log4js.

## install
Note: as of v0.2.0, express, nunjucks, bluebird, request, and log4js are all listed
as peerDependencies.

```
npm install --save express nunjucks bluebird request log4js riesling
```

## Use
```
var rielsing = require('riesling');
rielsing.pour(app => {
  // Provision the express app.
  app.get('/', (req, res) => res.send('Hello, world!'));
}).
spread((app, server) => {
  // Do stuff
});

```