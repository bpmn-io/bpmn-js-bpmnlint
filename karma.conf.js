'use strict';

var path = require('path');

var absoluteBasePath = path.resolve(__dirname);

// configures browsers to run test against
// any of [ 'ChromeHeadless', 'Chrome', 'Firefox', 'IE', 'PhantomJS' ]
var browsers = (process.env.TEST_BROWSERS || 'ChromeHeadless').split(',');

// use puppeteer provided Chrome for testing
process.env.CHROME_BIN = require('puppeteer').executablePath();

var suite = 'test/suite.js';

module.exports = function(karma) {
  karma.set({

    frameworks: [
      'mocha',
      'sinon-chai'
    ],

    files: [
      suite
    ],

    preprocessors: {
      [suite]: [ 'webpack' ]
    },

    reporters: [ 'progress' ],

    browsers,

    browserNoActivityTimeout: 30000,

    customLaunchers: {
      ChromeHeadless_Linux: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ],
        debug: true
      }
    },

    autoWatch: true,
    singleRun: false,

    webpack: {
      mode: 'development',
      module: {
        rules: [
          {
            test: /\.bpmnlintrc$/,
            use: 'bpmnlint-loader'
          },
          {
            test: /\.(css|bpmn|svg)$/,
            use: 'raw-loader'
          }
        ]
      },
      resolve: {
        modules: [
          'node_modules',
          absoluteBasePath
        ]
      }
    }
  });
};
