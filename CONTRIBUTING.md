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
