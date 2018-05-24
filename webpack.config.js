
var webpack = require('webpack')
var path = require('path')

module.exports = {
  entry: "./index.js",
  output: {
    path: path.join(__dirname, "dist/"),
    filename: "bundle.js"
  },
  devServer: {
      contentBase: [path.join(__dirname, "dist/"), __dirname],
      port: 9000
  },
  mode: 'development',
  module: {
    rules: [
      process.env.NODE_ENV === 'production' ? { test: /\.js$/, use: 'babel-loader' } : {},
      {
        test: /\.js$/,
        use: [
          'ify-loader',
          'transform-loader?plotly.js/tasks/util/compress_attributes.js',
          ]
      },
    ]
  }
}
