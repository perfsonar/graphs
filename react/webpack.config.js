var webpack = require('webpack');
require('es6-promise').polyfill()
/*
module.exports = {
  devtool: 'eval-source-map',
  entry: './src/entry.jsx',
  output: {
    filename: './public/bundle.js'
  },
  module: {
    loaders: [
      { test: /\.json$/, loader: 'json-loader' },
      { test: /\.jsx$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'react']
        }
      },
      { test: /\.css$/,
        loader: 'css-loader'
      }
    ]
  }
};
*/

var plugins = [
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  })
];

if (process.env.COMPRESS) {
  plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false
      }
    })
  );
}


module.exports = {

    entry: {
        app: ["./src/main.jsx"]
    },

    output: {
        filename: './public/bundle.js'
    },

    module: {
        loaders: [
            { test: /\.(js|jsx)$/,
              loader: "babel?stage=0" },
            //{ test: /\.(js|jsx)$/,
            //  loader: "babel-loader", query: { presets: ['es2015', 'react']  } },
            //{ test: /\.(js|jsx)$/, loader: 'babel?optional=es7.objectRestSpread' },
            { test: /\.css$/, loader: "style-loader!css-loader" },
            { test: /\.(png|jpg|gif)$/, loader: "url-loader?limit=8192"},
            { test: /\.json$/, loader: "json-loader" },
            { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
              loader: "file-loader?name=[name].[ext]" }
        ]
    },

    externals: [
        {
            window: "window"
        }
    ],

    resolve: {
        extensions: ["", ".js", ".jsx", ".json"]
    }
};