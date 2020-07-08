import {Preset} from '.'
import {PackageGlobbable, getLeafPackages} from './util/monorepo'
import * as jsYaml from 'js-yaml'
import * as lodash from 'lodash'

/**
 * Generates a yaml config for the [GitHub Pull Request Labeler Action](https://github.com/actions/labeler).
 * Creates a label per package name, which will be applied to any file modified under the leaf package path.
 * When packages are added or removed from the repo, or renamed, the yaml config will stay in sync with them.
 * Additional labels can be added outside of the generated code block.
 * See https://github.com/mmkal/ts/tree/main/.github/labeler.yml for an example.
 *
 * ##### Example
 * ```yaml
 * # codegen:start {preset: labeler}
 * ```
 *
 * *Note*: eslint and related tools make it quite difficult to github action yaml files. To get it working, you'll need to:
 * - add `'!.github'` to your `.eslintignore` file, or the `ignorePatterns` property in your lint config.
 * - {vscode} add `"yaml"` to the `"eslint.validate"` list in `vscode/settings.json`.
 * - {@typescript/eslint} add `'.yml'` (and/or `'.yaml'`) to the `parserOptions.extraFileExtensions` list in your lint config.
 * - {@typescript/eslint} explicitly include 'hidden' files (with paths starting with `.`) in your tsconfig. See https://github.com/mmkal/ts/tree/main/tsconfig.eslint.json for an example.
 *
 * @param repoRoot [optional] path to the repository root. If not specified, the rule will recursively search parent directories for package.json files
 */
export const labeler: Preset<PackageGlobbable> = ({options, meta}) => {
  const packages = getLeafPackages(options.repoRoot, meta.filename)
  return jsYaml.dump(
    lodash.fromPairs(packages.map(p => [p.packageJson.name, [p.path.replace(/package\.json$/, '**/*')]]))
  )
}
