const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = (env) => merge(common(env), {
    mode: 'development',
    devtool: 'source-map',
    watch: true,
    watchOptions: {
        poll: 1000,
    },
    devServer: {
        host: '0.0.0.0',
        port: 4001,
        disableHostCheck: true,
        historyApiFallback: {
            index: '/'
        },
    }
});