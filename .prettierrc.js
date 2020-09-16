// prettier is *mostly* run through eslint. But jest-inline-snapshots also use it, and need to
// be able to resolve the correct config, so single-quotes aren't turned into doubles, etc.
module.exports = require('./tools/node-pkg/.prettierrc')
