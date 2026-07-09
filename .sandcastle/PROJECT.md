# Project map (edit me)

Agents are told to read this file before working. Keep it short, factual, and
current — it is the one place the prompts learn your project's shape.

## Layout

Single-package JS project at the repo root.
(For a monorepo, list each package, its stack, and where its docs live, e.g.
`CLAUDE.md`, `CONTEXT.md` files, ADRs.)

## Checks (feedback loops)

Run before finishing, in every package you touched (`npm ci` first if
`node_modules` is missing):

- root: `npm run lint && npm test`

## Known pre-existing failures

None. (List any red on the base branch that agents must NOT chase — name the
exact test or lint rule so they can tell it apart from their own breakage.)
