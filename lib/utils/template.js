// ----------------------------------------------------------------------------
// @author Jonathan Alaimo
// @date 8.15.2016
// @description Facade to nunjucks to allow simple extensions to the
//    default nunjucks environment and case specific environments
// ----------------------------------------------------------------------------
var nunjucks = require('nunjucks'),
  env;



module.exports = {
  // Follow the approach same approach as nunjucks here and just overwrite
  // the default environment on every call to configure.
  configure: function(paths, opts) {
    env = this.environment(paths, opts);
    return env;
  },

  // Configure a new environment with the specified options. All filters and
  // defaults in the prepare method will be applied.
  environment: function(paths, opts) {
    return this.prepare(nunjucks.configure(paths, opts));
  },

  // Contextual alias for express
  express: function(paths, opts) {
    return this.environment(paths, opts);
  },

  noDefaultEnvironmentError() {
    return new Error('NoDefaultEnvironmentError');
  },

  // Process a new environment for use
  prepare: function(env) {
    // TODO: add custom filters to env as needed
    return env;
  },

  // Execute render against the default environment
  render: function(name, context) {
    if(!env) {
      throw this.noDefaultEnvironmentError();
    }
    env.render(name, context);
  },

  // Execute render string against the default environment
  renderString: function(str, context) {
    if(!env) {
      throw this.noDefaultEnvironmentError();
    }
    env.renderString(name, context);
  }
};