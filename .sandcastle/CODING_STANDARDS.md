# Coding Standards

Conventions an agent must follow when changing this repo. Read alongside `.sandcastle/PROJECT.md` and the docs it points to. Edit this file for your project — the rules below are a generic starting point.

## Commits

- Atomic: one logical change per commit; if the message needs an "and", split it.
- Conventional Commits: `<type>(<scope>): <description>` (e.g. `fix(api): handle null upstream response`). Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- Imperative mood, lowercase description, subject under 72 chars.
- Never add AI/Claude attribution or co-author trailers.

## Branching

- Branch off the base branch. Never merge the base branch into a feature branch; rebase onto it instead.

## Comments

- No block-comment headers or multi-line banners. Short single-line comments only where logic is non-obvious. Do not restate what the code does.

## Checks (monorepo, no root command)

- See `.sandcastle/PROJECT.md` for the check commands per package.

Run the checks for the package you touched before committing.

## Tests

- Prefer red-green-refactor against existing test seams. Do not invent new seams (e.g. extracting a function solely to test it in isolation) — that produces spaghetti tests.
