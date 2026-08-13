# Contributing to EventSource

Contributions are welcome, no matter how large or small, but:

- Please open an issue before starting work on a feature or large change.
- We generally do not accept PRs that extend the API or surface of the library. The idea behind this module is to provide a (mostly) spec-compliant implementation of the EventSource API, and we want to keep it as simple as possible.
- Changes needs to be compatible with the [EventSource specification](https://html.spec.whatwg.org/multipage/server-sent-events.html#server-sent-events) as far as possible, as well as for all the [supported environments](https://github.com/EventSource/eventsource/blob/current/README.md#supported-engines).

## Getting started

Before contributing, please read our [code of conduct](https://github.com/EventSource/eventsource/blob/current/CODE_OF_CONDUCT.md).

Then make sure you have _Node.js version 18 or newer_.

```sh
git clone git@github.com:EventSource/eventsource.git
cd eventsource
npm install
npm run build
npm test
```

## Running the tests

The suite in `test/client.test.ts` runs against a real HTTP server in every supported environment - there are no mocks and no simulated DOM. Each environment gets its own Vitest config, and `npm test` covers Node only:

- `npm test` - Node.js
- `npm run test:browser` - Chromium, Firefox and WebKit, via Playwright
- `npm run test:bun` - Bun
- `npm run test:deno` - Deno
- `npm run test:happy-dom` - happy-dom
- `npm run test:workerd` - workerd (Cloudflare Workers), via miniflare
- `npm run test:types` - type compatibility with the WhatWG `EventSource`
- `npm run test:all` - all of the above, in sequence

The browser tests need Playwright's browsers installed once, with `npx playwright install chromium firefox webkit`.

The happy-dom and workerd suites are expected to fail today and do not gate CI. happy-dom reports the test server's requests as cross-origin and blocks them. workerd's remaining failures all come from [cloudflare/workerd#6022](https://github.com/cloudflare/workerd/issues/6022): its `EventTarget` dispatches `on<type>` handler properties itself, on top of the `addEventListener` call our `on*` setters make, so those handlers fire twice, assigning `null` only removes one registration, and they fire ahead of listeners registered before them.

The browser suite is the one place where the endpoints are not served by a standalone server. Vitest serves the test page from its own Vite server, so the endpoints are mounted onto that same server (`test/helpers/ssePlugin.ts`) to keep the page and the endpoints same-origin. Serving them separately would make every request cross-origin and silently change what the CORS, cookie and redirect tests actually assert.

# Workflow guidelines

- Anything in the `main` branch is scheduled for the next release and should generally be ready to released, although there are exceptions when there are multiple features that are dependent on each other.
- To work on something new, create a descriptively named branch off of `main` (ie: `feat/some-new-feature`).
- Commit to that branch locally and regularly push your work to the same named branch on the remote.
- Rebase your feature branch regularly against `main`. Make sure its even with `main` while it is awaiting review.
- Pull requests should be as ready as possible for merge. Unless stated otherwise, it should be safe to assume that:
  - The changes/feature are reviewed and tested by you
  - You think it's production ready
  - The code is linted and the test suite is passing

## Commit messages

We use Conventional Commits for our commit messages. This means that each commit should be prefixed with a type and a message. The message should be in the imperative mood. For example:

```
feat: allow specifying something
fix: double reconnect attempt on error
docs: clarify usage of `fetch` option
```

## Changesets

Releases are driven by [changesets](https://github.com/changesets/changesets), not by commit messages. If your pull request changes anything under `src/`, add a changeset describing the change:

```sh
npm run changeset
```

Pick `patch`, `minor` or `major`, then write a sentence aimed at someone reading the changelog. Commit the generated file in `.changeset/` along with the rest of your changes.

Changes that do not affect the published package - docs, tests, CI, internal refactors that leave behaviour untouched - do not need one. If a change touches `src/` but genuinely should not trigger a release, run `npx changeset add --empty`.

## Releasing

Maintainers only. When changesets land on `main`, the release workflow opens a "Version Packages" pull request that applies the version bump and updates the changelog. Merging that pull request publishes to npm, pushes the git tag and creates the GitHub release.

Publishing uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) over OIDC, so there is no npm token to rotate. The trusted publisher is configured on npm against the `release.yml` workflow in this repository - renaming that file will break publishing until the npm setting is updated to match. The npm configuration pins the workflow file but not the branch, which is what lets the same workflow release from maintenance branches.

### Releasing a fix for an older major

Older majors that are still supported are patched from a long-lived `vN` branch - currently just `v4`, for the 4.x line. It sits at the latest release of that major and carries its own changesets configuration, so the release workflow behaves there exactly as it does on `main`:

1. Branch off the maintenance branch, e.g. `git switch -c fix/some-backport v4`.
2. Apply the fix and add a changeset (`npm run changeset`). Use `patch` or `minor` - a backport must never be a `major`, since that would collide with a version that already exists on a newer line.
3. Open the pull request **against the maintenance branch**, not `main`.
4. Merging it opens a "Version Packages" pull request against that same branch. Merging that one publishes.

Two things differ from a release off `main`:

- The npm dist-tag matches the branch, so a 4.x release publishes under `v4` rather than `latest`. Users on that line install it with `npm install eventsource@v4`, and `npm install eventsource` keeps resolving to the current major.
- The GitHub release is demoted from "Latest" after publishing, so the newest major keeps that badge.

Both are handled by the release workflow; there is nothing to pass by hand. If the fix also applies to the current major, land it on `main` separately - nothing is merged forward automatically.

The workflow's branch filter accepts any `vN` branch, so a `v5` branch can be cut the same way once `main` moves on to 6.x. The archived `v1.x` and `v2.x` branches predate the convention, do not match the filter, and are not released from. 3.x is no longer supported - see [SECURITY.md](./SECURITY.md).

# How to file a security issue

If you find a security vulnerability, do **NOT** open an issue. Use the [https://github.com/EventSource/eventsource/security/advisories/new](GitHub Security Advisory) page instead.

## How to report a bug

When filing an issue, make sure to answer these six questions:

- Which versions of the `eventsource` module are you using?
- What operating system are you using?
- Which versions of Node.js/browser/runtime are you running?
- What happened that caused the issue?
- What did you expect to happen?
- What actually happend?
- What was the data sent from the server that caused the issue?
