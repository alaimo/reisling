module.exports = function(grunt) {
  // load plugins
  [
    'grunt-contrib-jshint',
    'grunt-mocha-test'
  ].
  forEach(task => grunt.loadNpmTasks(task));

  grunt.initConfig({
    jshint: {
      options: {
        esnext: true,
        node: true
      },
      server: {
        src: [
          '*.js',
          'lib/**/*.js'
        ]
      },
      test: {
        options: {
          // needed for chai expect expressions
          expr: true
        },
        src: [
          'test/**/*.js'
        ]
      }
    },
    mochaTest: {
      options: {
        mocha: require('mocha'),
        timeout: 5000
      },
      unit: {
        src: [
          'test/**/*.test.js'
        ]
      }
    }
  });

  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('test', ['jshint', 'mochaTest:unit']);
};