# semantic-release Setup

## TL;DR

> **Quick Summary**: Replace changesets with semantic-release for automatic versioning and GitHub releases on merge to main.
> 
> **Deliverables**:
> - `.releaserc.json` config file
> - Updated `.github/workflows/release.yml`
> - `semantic-release` installed
> 
> **Estimated Effort**: Short (3 tasks)
> **Parallel Execution**: NO - sequential

---

## Context

### Current Problem
- changesets setup but not working without GitHub app
- User wants simple auto-versioning on merge to main
- Creates GitHub release with tag automatically

### Solution
Use **semantic-release** instead — no GitHub app needed, works out of the box.

---

## Work Objectives

### Core Objective
On every merge to `main`:
1. Analyze commits to determine version bump (patch/minor/major)
2. Bump version in `package.json`
3. Create GitHub release with git tag

### Must Have
- semantic-release installed
- `.releaserc.json` with GitHub plugin
- Updated workflow that runs on main branch push

### Must NOT Have
- No changesets dependency needed
- No GitHub app required

---

## TODOs

- [ ] 1. Install semantic-release

  **What to do**:
  ```bash
  bun add -D semantic-release @semantic-release/changelog @semantic-release/github
  ```

  **Acceptance Criteria**:
  - [ ] Package added to devDependencies in package.json

- [ ] 2. Create .releaserc.json

  **What to do**:
  Create config file:

  ```json
  {
    "branches": ["main"],
    "plugins": [
      "@semantic-release/commit-analyzer",
      "@semantic-release/release-notes-generator",
      [
        "@semantic-release/github",
        {
          "assets": []
        }
      ]
    ]
  }
  ```

  **Acceptance Criteria**:
  - [ ] File exists at project root
  - [ ] Branches set to "main"

- [ ] 3. Update release.yml

  **What to do**:
  Replace workflow with:

  ```yaml
  name: Release

  on:
    push:
      branches:
        - main

  jobs:
    release:
      runs-on: ubuntu-latest
      permissions:
        contents: write
      steps:
        - uses: actions/checkout@v4
          with:
            fetch-depth: 0
        
        - uses: oven-sh/setup-bun@v2
        
        - run: bun install
        
        - run: npx semantic-release
          env:
            GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  ```

  **Acceptance Criteria**:
  - [ ] Workflow uses semantic-release CLI
  - [ ] Runs on main branch push
  - [ ] Has write permissions for contents

---

## How Version Bumping Works

semantic-release reads commit messages to decide bump type:

| Commit Message | Version Bump |
|----------------|--------------|
| `fix: ...`     | patch (1.0.2 → 1.0.3) |
| `feat: ...`    | minor (1.0.2 → 1.1.0) |
| `feat!: ...`   | major (1.0.2 → 2.0.0) |

**Examples:**
```bash
git commit -m "fix: login button alignment"
# → Creates release 1.0.3

git commit -m "feat: add dark mode"
# → Creates release 1.1.0
```

---

## Success Criteria

- [ ] On merge to main, semantic-release runs
- [ ] Version in package.json is bumped
- [ ] GitHub release created with tag
- [ ] No changesets app needed
