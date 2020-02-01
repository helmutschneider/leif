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
const enableSourceMap = typeof process.env.ENABLE_SOURCE_MAP !== 'undefined';
const tsConfigPath = path.resolve(__dirname, 'tsconfig.json');

const config = {
    entry: {
        javascript: path.resolve(__dirname, 'client', 'index.tsx'),
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
            '@app': path.resolve(__dirname, 'client'),
        },
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                include: [
                    path.resolve(__dirname, 'client'),
                    // path.resolve(__dirname, 'node_modules', '720-ts'),
                ],
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            allowTsInNodeModules: true,
                            configFile: tsConfigPath,
                            compilerOptions: {
                                sourceMap: enableSourceMap,
                            },
                            experimentalWatchApi: true
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'public', 'index.template.html'),
        }),
        new DefinePlugin({
            // webpack replaces the string as-is, so extra quotes are needed
            'process.env.NODE_ENV': quote(process.env.NODE_ENV)
        }),
    ],
    mode: isProduction ? 'production' : 'development',
    devtool: enableSourceMap ? 'inline-source-map' : false,
    optimization: isProduction ? undefined : {
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
    },
};

module.exports = config;
