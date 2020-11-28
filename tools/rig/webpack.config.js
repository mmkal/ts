const path = require('path')
const webpack = require('webpack')

/** @type {(dirname: string) => import('webpack').Configuration} */
const get = dirname => ({
  entry: './src/index.ts',
  mode: 'none',
  output: {
    filename: 'index.js',
    path: path.resolve(dirname, 'dist'),
    libraryTarget: 'commonjs2',
  },
  optimization: {
    minimize: false,
  },
  target: 'node',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        // use require.resolve so this config can be used from other packages
        use: [{loader: require.resolve('ts-loader'), options: {transpileOnly: true}}],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new webpack.ContextReplacementPlugin(
      // avoid Critical dependency: the request of a dependency is an expression
      // any-promise dynamic loads some things that aren't used because global.Promise exists
      /any-promise/,
      context =>
        context.dependencies.forEach(d => {
          d.critical = false
        })
    ),
  ],
})

module.exports = Object.assign(get(__dirname), {with: get})
