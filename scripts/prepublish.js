if (!process.env.GH_TOKEN) {
  throw Error(`A GH_TOKEN environment variable is required.`)
}
