
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
//const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry: {
    main: {
      import: './src/client/main.ts'
    },
    admin: {
      import: './src/client/admin.ts'
    },
  },
  optimization: {
    minimize: true,
    minimizer: [
      `...`,
      new MiniCssExtractPlugin(),
    ],
    splitChunks: {
      chunks: 'all',
    },
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(css)$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: "file-loader"
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist/client'
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: ['dist/client']
    }),
    /*new HtmlWebpackPlugin({
      template: 'src/client/index.htm',
      publicPath: 'dist/client'
    }),*/
    new HtmlWebpackPlugin({
      filename: 'index.html',
      publicPath: 'dist/client',
      template: 'src/client/index.htm',
      chunks: ['main']
    }),
    new HtmlWebpackPlugin({ // Also generate a test.html
      filename: 'admin.html',
      publicPath: 'dist/client',
      template: 'src/client/admin.htm',
      chunks: ['admin']
    }),
    /*new CopyWebpackPlugin(
      [
        // copies go here
      ]
    )*/
  ],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist/client')
  }
}
