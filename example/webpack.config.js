var path = require('path');

var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    entry: './src/app.js'
  },
  output: {
    filename: 'app.bundled.js',
    path: __dirname + '/public'
  },
  module: {
    rules: [
      {
        test: /\.bpmn$/,
        use: {
          loader: 'raw-loader'
        }
      },
      {
        test: /\.bpmnlintrc$/,
        use: {
          loader: 'bpmnlint-loader'
        }
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      'node_modules/bpmn-js/dist/assets/**/*',
      'node_modules/bpmn-js-bpmnlint/dist/assets/**/*'
    ])
  ]
};