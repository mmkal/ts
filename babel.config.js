module.exports = {
  presets: [
    // comment to stop prettier inlining this
    ['@babel/env', {exclude: ['transform-regenerator', 'transform-async-to-generator']}],
    '@babel/typescript',
  ],
}
