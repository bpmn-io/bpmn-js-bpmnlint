'use strict';

var path = require('path');

var singleStart = process.env.SINGLE_START;

var absoluteBasePath = path.resolve(__dirname);

// configures browsers to run test against
// any of [ 'ChromeHeadless', 'Chrome', 'Firefox' ]
var browsers = (process.env.TEST_BROWSERS || 'ChromeHeadless').split(',');

// use puppeteer provided Chrome for testing
process.env.CHROME_BIN = require('puppeteer').executablePath();

var suite = 'test/suite.js';

module.exports = function(karma) {

  var config = {

    frameworks: [
      'mocha',
      'sinon-chai',
      'webpack'
    ],

    files: [
      suite
    ],

    preprocessors: {
      [suite]: [ 'webpack', 'env' ]
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
            type: 'asset/source'
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
  };

  if (singleStart) {
    config.browsers = [].concat(config.browsers, 'Debug');
    config.envPreprocessor = [].concat(config.envPreprocessor || [], 'SINGLE_START');
  }

  karma.set(config);
};
