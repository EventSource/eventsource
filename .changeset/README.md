# Changesets

This folder holds [changesets](https://github.com/changesets/changesets): short markdown files that
describe user-facing changes and how they should affect the next version number.

Add one to your pull request with:

```sh
npm run changeset
```

This is the `v4` maintenance branch, so pick `patch` or `minor` - never `major` - then write a
sentence that will make sense to someone reading the changelog. The generated file gets committed
alongside your changes.

Changes that do not affect published behaviour (docs, tests, CI, refactors) do not need a changeset.

When changesets land on `v4`, a "Version Packages" pull request is opened that applies the version
bump and updates the changelog. Merging that pull request publishes to npm under the `v4` dist-tag.
