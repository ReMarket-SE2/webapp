# Contributing Guide

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification for our commit messages. This leads to more readable messages that are easy to follow when looking through the project history and enables automatic versioning and package publishing.

### Commit Message Format
Each commit message consists of a **header**, a **body** and a **footer**. The header has a special format that includes a **type**, a **scope** and a **subject**:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

The **header** is mandatory and the **scope** of the header is optional.

### Type
Must be one of the following:

* **feat**: A new feature
* **fix**: A bug fix
* **docs**: Documentation only changes
* **style**: Changes that do not affect the meaning of the code (white-space, formatting, etc)
* **refactor**: A code change that neither fixes a bug nor adds a feature
* **perf**: A code change that improves performance
* **test**: Adding missing tests or correcting existing tests
* **build**: Changes that affect the build system or external dependencies
* **ci**: Changes to our CI configuration files and scripts
* **chore**: Other changes that don't modify src or test files

### Scope
The scope should be the name of the module affected (as perceived by the person reading the changelog generated from commit messages).

### Subject
The subject contains a succinct description of the change:

* use the imperative, present tense: "change" not "changed" nor "changes"
* don't capitalize the first letter
* no dot (.) at the end

### Examples

```
feat(auth): add user authentication endpoint

fix(database): resolve connection timeout issue

docs(api): update API documentation with new endpoints

refactor(extractor): improve data extraction performance
```

### Breaking Changes
Breaking changes should be indicated by adding `BREAKING CHANGE:` in the commit footer, along with a description of what has changed and migration notes:

```
feat(api): remove deprecated endpoints

BREAKING CHANGE: The following endpoints have been removed:
- /api/v1/legacy
- /api/v1/deprecated

Migration guide:
Use /api/v2/* endpoints instead.
```
