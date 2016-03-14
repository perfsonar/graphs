require('es6-promise').polyfill()
const path = require('path');
const merge = require('webpack-merge');
const webpack = require('webpack');

const PATHS = {
  app: path.join(__dirname, 'app'),
  build: path.join(__dirname, 'build')
};



const TARGET = process.env.npm_lifecycle_event;

const common = {

    // Entry accepts a path or an object of entries. We'll be using the
    // latter form given it's convenient with more complex configurations.
    entry: {
        app: PATHS.app
    },
    output: {
        path: PATHS.build,
        filename: 'bundle.js'
    },
    module: {
        loaders: [
            { 
                test: /\.jsx$/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015', 'react']
                }
            },
            {
                // Test expects a RegExp! Note the slashes!
                test: /\.css$/,
                loaders: ['style', 'css'],
                    // Include accepts either a path or an array of paths.
                include: PATHS.app
            }
        ]
    }

};


// Default configuration
if(TARGET === 'start' || !TARGET) {
    module.exports = merge(common, {
        devtool: 'eval-source-map',
        devServer: {
            contentBase: PATHS.build,

            // Enable history API fallback so HTML5 History API based
            // routing works. This is a good default that will come
            // in handy in more complicated setups.
            historyApiFallback: true,
            hot: true,
            inline: true,
            progress: true,

                // Display only errors to reduce the amount of output.
            stats: 'errors-only',

                // Parse host and port from env so this is easy to customize.
                //
                // If you use Vagrant or Cloud9, set
                // host: process.env.HOST || '0.0.0.0';
                //
                // 0.0.0.0 is available to all network devices unlike default
                // localhost
            //host: process.env.HOST,
            host: 'perfsonar-dev.grnoc.iu.edu',
            port: process.env.PORT
        },
        plugins: [
            new webpack.HotModuleReplacementPlugin()
        ]
    });
}

if(TARGET === 'build') {
  module.exports = merge(common, {});
}
