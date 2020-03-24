module.exports = ({options}) => 'Whole module export with input: ' + options.input
module.exports.getText = ({options}) => 'Named export with input: ' + options.input
module.exports.thrower = () => {
  throw Error('test error!')
}
