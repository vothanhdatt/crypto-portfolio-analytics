# Contributing Guidelines

## Branch workflow

- Create a dedicated branch for every new feature.
- Handle each GitHub Issue on its own branch.
- Do not implement changes directly on `main` or `develop`.
- Keep a branch focused on one feature, bug, refactor, documentation change, or Issue.

## Branch naming

Branch names must use lowercase English words without accents. Separate words with hyphens.

| Change type | Pattern | Example |
| --- | --- | --- |
| New feature | `feature/<feature-name>` | `feature/carbon-emission-dashboard` |
| Bug fix | `fix/<bug-name>` | `fix/sensor-data-calculation` |
| Refactor | `refactor/<code-area>` | `refactor/auth-service` |
| Documentation | `docs/<documentation-topic>` | `docs/api-documentation` |

## Commit messages

Commit messages must be written in lowercase English without accents and use an imperative, concise description.

| Change type | Pattern | Example |
| --- | --- | --- |
| New feature | `feat: <feature name>` | `feat: add carbon emission dashboard` |
| Bug fix | `fix: <bug name>` | `fix: incorrect sensor data calculation` |
| Refactor | `refactor: <change description>` | `refactor: simplify auth service` |
| Documentation | `docs: <documentation change>` | `docs: add api documentation` |

## Recommended workflow

```bash
git switch main
git pull
git switch -c feature/example-feature

# Implement and verify the change.

git add <files>
git commit -m "feat: add example feature"
git push -u origin feature/example-feature
```

Open a pull request for review after tests, lint, type checks, and production builds relevant to the change pass.

