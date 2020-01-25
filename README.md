# js

## Publishing

### Prereqs

`~/.npmrc` needs to be configured for your github account to interact with github's npm package registry, meaning it needs a line like this:

```
//npm.pkg.github.com/:_authToken=TOKEN
```

Where `TOKEN` is created from https://github.com/settings/tokens. See [this guide](https://dev.to/jgierer12/how-to-publish-packages-to-the-github-package-repository-4bai) for more details, or the [docs for Github Packages](https://help.github.com/en/github/managing-packages-with-github-packages/configuring-npm-for-use-with-github-packages).

### Canary

Canary packages can be published with:

```bash
yarn publish-canary
```

This publishes packages with a suffix based on the branch name, commit date, and commit hash.
