const webpack = require('webpack');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
require('dotenv').config();

module.exports = {
    entry: './src/main.tsx',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'bundle.js',
        publicPath: process.env.BASE_PATH || '/'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
        mainFields: ['main'],
    },
    module: {
        rules: [
            {
                test: /.tsx?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                '@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'
                            ]
                        }
                    }
                ]
            },
            {
                test: /\.scss$/,
                loaders: [
                    'style-loader', 'css-loader', 'sass-loader'
                ]
            },
            {
                test: /\.css$/,
                loaders: [
                    'style-loader', 'css-loader'
                ]
            },
            {
                test: /\.png$/,
                loaders: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'images/'
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new CopyPlugin([
            { from: 'data', to: 'data' },
        ]),
        new HtmlWebpackPlugin({
            template: './src/index.html',
            filename: './index.html'
        }),
        new webpack.DefinePlugin({
            'process.env.BASE_PATH': JSON.stringify(process.env.BASE_PATH),
            'process.env.MAP_ACCESS_TOKEN': JSON.stringify(process.env.MAP_ACCESS_TOKEN),
        })
    ]
};