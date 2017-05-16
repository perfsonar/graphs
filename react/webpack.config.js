var webpack = require('webpack');
require('es6-promise').polyfill()

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

var PRODUCTION = true;
if ( process.env.dev > 0 || process.env.dev == "true" ) {
    PRODUCTION = false;
    console.log( "Initializing DEV build ..." );
} else {
    console.log( "Initializing PRODUCTION build ..." );
}

module.exports = {
 devServer: {
    hot: true,
    host: 'perfsonar-dev.grnoc.iu.edu',
    port: 8080,
    open: 'src/main.jsx'
  },
    entry: "./src/main.jsx",

    output: {
        filename: './public/bundle.js'
    },

    module: {
        loaders: [
            { test: /\.(js|jsx)$/,
                //loader: 'babel-loader',
                loader: ( PRODUCTION ? 'babel-loader!webpack-strip?strip[]=console.log' : 'babel-loader' ),
                exclude: [/node_modules/],
                //query: {
                    //presets: ["es2015", "react", "stage-0"]
                //}
              //loader: "babel?stage=0" 
            },
            //{ test: /\.(js|jsx)$/,
            //  loader: "babel-loader", query: { presets: ['es2015', 'react']  } },
            //{ test: /\.(js|jsx)$/, loader: 'babel?optional=es7.objectRestSpread' },
            { test: /\.css$/, loader: "style-loader!css-loader" },
            { test: /\.(png|jpg|gif)$/, loader: "url-loader?limit=8192"},
            { test: /\.json$/, loader: "json-loader" },
            { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
              loader: "file-loader?name=[name].[ext]" }
        ]
            /*
            ,
        postLoaders: [
            { test: /\.js$/, loader: "webpack-strip?strip[]=console.log" }
        ]
        */
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
