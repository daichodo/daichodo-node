# Contributing

Thank you — genuinely. A note on which half of this repository is which.

## `packages/validate` — hand-written, pull requests welcome

Zero dependencies, no network. Bug reports and fixes are welcome here.

One constraint: `test/check-digit-vectors.json` is shared byte-for-byte with the
Daichodo API and with the Python implementation. It is not edited by hand. If
you believe a vector is wrong, that is a bug in the algorithm on **all** sides
and worth an issue rather than a local edit — the whole point of the file is
that every implementation agrees on the same bytes.

## `packages/daichodo` — generated, do not edit

Generated from the API's OpenAPI schema and regenerated on every release.
Changes here are overwritten and lost, and CI will reject a pull request that
touches it.

If the client is wrong, the schema is wrong. Open an issue describing the
behaviour and it gets fixed at the source, which fixes every language's SDK at
once.

## Running the tests

```bash
npm ci
npm run --workspaces --if-present build
npm run --workspaces --if-present test
```
