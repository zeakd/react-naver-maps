const HTMLWebpackPlugin = require('html-webpack-plugin')
require('dotenv').config()

const __DEV__ = process.env.NODE_ENV !== 'production'

module.exports = {
  mode: __DEV__ ? 'development' : 'production',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
        }
      }
    ]
  },
  plugins: [
    
    new HTMLWebpackPlugin({
      template: 'public/template.html',
      naverMapsClientId: process.env.MAP_CLIENT_ID,
    })
  ],
  devServer: {
    // 로컬 포트번호 설정
    // port: 3000
  }
}