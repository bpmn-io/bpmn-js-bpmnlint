'use strict';

// configures browsers to run test against
// any of [ 'ChromeHeadless', 'Chrome', 'Firefox' ]
var browsers = (process.env.TEST_BROWSERS || 'ChromeHeadless').split(',');

module.exports = function(karma) {
  karma.set({

    frameworks: [
      'mocha',
      'webpack'
    ],

    files: [ '*Spec.js' ],

    preprocessors: {
      '*Spec.js': [ 'webpack' ]
    },

    reporters: [ 'tldr' ],

    browsers,

    autoWatch: false,
    singleRun: true,

    webpack: {
      mode: 'development'
    }
  });
};
