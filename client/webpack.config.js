function quote(value) {
    return `"${value}"`;
}

const path = require('path');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const assets = {
    app: 'app.[hash].js',
};
const isProduction = process.env.NODE_ENV === 'production';
const tsConfigPath = path.resolve(__dirname, 'tsconfig.json');
const env = require('./.env.json');

env.BUILD_DATE = (new Date()).toISOString();

const config = {
    entry: {
        javascript: path.resolve(__dirname, 'src', 'index.tsx'),
    },
    output: {
        path: path.resolve(__dirname, 'public'),
        filename: assets.app,
        pathinfo: false,
    },
    resolve: {
        // Add '.ts' and '.tsx' as a resolvable extension.
        extensions: ['.js', '.ts', '.tsx'],
        alias: {
            '@app': path.resolve(__dirname, 'src'),
        },
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                include: [
                    path.resolve(__dirname, 'src'),
                    path.resolve(__dirname, 'node_modules/720-ts'),
                ],
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            allowTsInNodeModules: true,
                            configFile: tsConfigPath,
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'public', 'index.template.html'),
            env,
        }),
        new DefinePlugin({
            // webpack replaces the string as-is, so extra quotes are needed
            'process.env.NODE_ENV': quote(process.env.NODE_ENV)
        }),
    ],
    mode: isProduction ? 'production' : 'development',
    devtool: false,
    optimization: isProduction ? undefined : {
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
    },
};

module.exports = config;
