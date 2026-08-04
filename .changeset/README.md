# Changesets

This folder holds [changesets](https://github.com/changesets/changesets): short markdown files that
describe user-facing changes and how they should affect the next version number.

Add one to your pull request with:

```sh
npm run changeset
```

Pick `patch`, `minor` or `major`, then write a sentence that will make sense to someone reading the
changelog. The generated file gets committed alongside your changes.

Changes that do not affect published behaviour (docs, tests, CI, refactors) do not need a changeset.

When changesets land on `main`, a "Version Packages" pull request is opened that applies the version
bump and updates the changelog. Merging that pull request publishes to npm.
