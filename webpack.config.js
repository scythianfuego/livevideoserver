const { resolve } = require('path');

const webpack = require('webpack');

// plugins
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = env => {
  return {
    context: resolve('src/client'),
    entry: {
      app: './index.js'
    },
    output: {
      filename: '[name].[hash].js',
      path: resolve('dist'),
      // Include comments with information about the modules.
      pathinfo: true
    },

    devtool: 'cheap-module-source-map',

    module: {
      loaders: [
        // { test: /\.tsx?$/, loaders: [ 'awesome-typescript-loader' ], exclude: /node_modules/ }
      ]
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: resolve('src/client', 'index.html')
      })
    ]
  };
};
