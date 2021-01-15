const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'development',
    devtool: 'source-map',
    watchOptions: {
        poll: 1000,
    },
    devServer: {
        host: '0.0.0.0',
        port: 4000,
        disableHostCheck: true,
        historyApiFallback: {
            index: '/'
        },
    }
});