module.exports = function () {
  this.onRunStart = function () {
    process.env.ARGV = JSON.stringify(process.argv)
  }
}
