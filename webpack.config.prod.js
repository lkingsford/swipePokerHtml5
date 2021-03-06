const CopyWebpackPlugin = require('copy-webpack-plugin')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const TerserWebpackPlugin = require('terser-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const webpack = require('webpack'); 

const path = require('path');

module.exports = {
  mode: 'production',
  entry: './itch-client/app.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              compilerOptions: { outDir: "dist_prod" },
            },
          }],
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserWebpackPlugin()],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist_prod'),
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'build/assets', to: 'assets' },
      ]
    }),
    new HTMLWebpackPlugin({
      hash: true,
      minify: false,
      template: 'build/html/index.html'
    }),
    new CleanWebpackPlugin({
      verbose: true,
    }),
  ]
};