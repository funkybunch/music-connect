const path = require('path');
const { VueLoaderPlugin } = require('vue-loader');

// webpack.config.js
module.exports = {
    mode: process.env.NODE_ENV,
    entry: {
        app: "./src/js/app-classroom.js",
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                use: 'vue-loader'
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    // Creates `style` nodes from JS strings
                    'style-loader',
                    // Translates CSS into CommonJS
                    'css-loader',
                    // Compiles Sass to CSS
                    'sass-loader',
                ],
            },
        ]
    },
    plugins: [
        new VueLoaderPlugin()
    ],
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
        port: 3000
    },
    output: {
        path: path.resolve(__dirname, "dist/js"),
        filename: "[name].min.js",
        publicPath: "/js/"
    }
};
