const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const TerserPlugin = require('terser-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = (env) => merge(common(env), {
    mode: 'production',
    output: {
        filename: '[name].[contenthash].js',
    },
    performance: {
        hints: false,
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin({
            extractComments: false,
        })]
    },
    plugins: [
        new CleanWebpackPlugin,
        new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: '../report.html'
        })
    ],
});
