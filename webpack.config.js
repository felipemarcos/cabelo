const path = require('path');

module.exports = {
  entry: './src/index.js',
  devServer: {
    contentBase: path.join(__dirname, 'tests/demos'),
    publicPath: '/dist/',
    compress: true,
    open: true
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'cabelo.js',
    library: 'cabelo',
    libraryTarget: 'umd',
    libraryExport: 'default'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      }
    ]
  }
};
