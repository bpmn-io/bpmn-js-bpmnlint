'use strict';

// configures browsers to run test against
// any of [ 'ChromeHeadless', 'Chrome', 'Firefox', 'IE', 'PhantomJS' ]
var browsers = (process.env.TEST_BROWSERS || 'ChromeHeadless').split(',');

// use puppeteer provided Chrome for testing
process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function(karma) {
  karma.set({

    frameworks: [
      'mocha',
      'sinon-chai',
      'webpack'
    ],

    files: [ '*Spec.js' ],

    preprocessors: {
      '*Spec.js': [ 'webpack' ]
    },

    browsers,

    autoWatch: false,
    singleRun: true,

    webpack: {
      mode: 'development'
    }
  });
};
