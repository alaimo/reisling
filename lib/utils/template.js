// ----------------------------------------------------------------------------
// @author Jonathan Alaimo
// @date 8.15.2016
// @description Facade to nunjucks to allow simple extensions to the
//    default nunjucks environment and case specific environments
// ----------------------------------------------------------------------------
var nunjucks = require('nunjucks'),
  env;

module.exports = {
  // Configure the default environment, only allow this to be executed once. If
  // you use the opt.express attribute here, express will be bound to the
  // default environment. If you do not want this call environment directly
  // and execute the express method returned custom environment.
  init: function(paths, opts) {
    if(!env) {
      env = this.environment(paths, opts);
    }
    return env;
  },

  // Configure a new environment with the specified options. All filters and
  // defaults in the prepare method will be applied.
  environment: function(paths, opts) {
    return this.prepare(nunjucks.configure(paths, opts));
  },

  prepare: function(env) {
    // TODO: add custom filters to env as needed
    return env;
  },

  // Execute render against the default environment
  render: function(name, context) {
    env.render(name, context);
  },

  // Execute render string against the default environment
  renderString: function(str, context) {
    env.renderString(name, context);
  }
};