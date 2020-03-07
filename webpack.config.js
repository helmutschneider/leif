function quote(value) {
    return `"${value}"`;
}

function pick(source, ...keys) {
    const out = {};
    for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            out[key] = source[key];
        }
    }
    return out
}

const path = require('path');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const assets = {
    app: 'app.[hash].js',
};
const isProduction = process.env.NODE_ENV === 'production';
const tsConfigPath = path.resolve(__dirname, 'tsconfig.json');
const env = {
    ...require('./.env.json'),
    BUILD_DATE: (new Date()).toISOString(),
    ...pick(process.env, 'API_URL'),
};

const config = {
    entry: {
        javascript: path.resolve(__dirname, 'client', 'src', 'index.tsx'),
    },
    output: {
        path: path.resolve(__dirname, 'client', 'public'),
        filename: assets.app,
        pathinfo: false,
    },
    resolve: {
        // Add '.ts' and '.tsx' as a resolvable extension.
        extensions: ['.js', '.ts', '.tsx'],
        alias: {
            '@app': path.resolve(__dirname, 'client', 'src'),
        },
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                include: [
                    path.resolve(__dirname, 'client', 'src'),
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
            template: path.resolve(__dirname, 'client', 'public', 'index.template.html'),
            env,
        }),
        new DefinePlugin({
            // webpack replaces the string as-is, so extra quotes are needed
            'process.env.NODE_ENV': quote(process.env.NODE_ENV)
        }),
    ],
    mode: isProduction ? 'production' : 'development',
    devtool: false,
};

module.exports = config;
