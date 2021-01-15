const webpack = require('webpack');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
require('dotenv').config();

const BASE_PATH = process.env.BASE_PATH || '/';

module.exports = {
    entry: './src/main.tsx',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'bundle.js',
        publicPath: BASE_PATH
    },
    resolve: {
        extensions: [
            '.ts',
            '.tsx',
            '.js'
        ],
        mainFields: ['main'],
    },
    module: {
        rules: [
            {
                test: /.tsx?$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: {
                    presets: [
                        '@babel/preset-env',
                        '@babel/preset-react',
                        '@babel/preset-typescript'
                    ]
                }
            },
            {
                test: /\.scss$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'sass-loader'
                ]
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.png$/,
                type: 'asset/resource',
                generator: {
                    filename: 'images/[name][ext]'
                }
            }
        ]
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: 'data',
                    to: 'data',
                    filter: (resourcePath) => {
                        return resourcePath.match(/\.(geo)?json$/);
                    },
                    transform: (content) => {
                        return JSON.stringify(JSON.parse(content.toString()));
                    }
                },
            ]
        }),
        new HtmlWebpackPlugin({
            template: './src/index.html',
            filename: './index.html'
        }),
        new HtmlWebpackPlugin({
            template: './src/404.html',
            filename: './404.html',
            BASE_PATH: BASE_PATH
        }),
        new webpack.DefinePlugin({
            'process.env.BASE_PATH': JSON.stringify(BASE_PATH),
            'process.env.MAP_ACCESS_TOKEN': JSON.stringify(process.env.MAP_ACCESS_TOKEN),
        })
    ]
};