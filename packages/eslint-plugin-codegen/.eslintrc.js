const base = require('@mmkal/rig/.eslintrc')
module.exports = {
  ...base,
  ignorePatterns: [
    ...base.ignorePatterns,
    '**/__tests__/custom-preset.js',
  ],
}
