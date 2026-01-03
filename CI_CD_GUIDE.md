# CI/CD Pipeline Guide

This document explains the Continuous Integration and Continuous Deployment (CI/CD) pipelines for the atmos sphere application.

---

## Table of Contents
1. [Overview](#overview)
2. [Workflows](#workflows)
3. [CI Pipeline (ci.yml)](#ci-pipeline)
4. [Release Pipeline (release.yml)](#release-pipeline)
5. [Running Locally](#running-locally)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

---

## Overview

atmos sphere uses GitHub Actions for automated testing, building, and releasing across three platforms:
- **Windows** (`.exe` installer)
- **macOS** (`.dmg` disk image)
- **Linux** (`.AppImage` package)

### Workflow Files
- `.github/workflows/ci.yml` - Continuous Integration
- `.github/workflows/release.yml` - Release builds and deployment

---

## Workflows

### Triggers

**CI Pipeline (`ci.yml`):**
- ✅ Push to `main` branch
- ✅ Push to `develop` branch
- ✅ Pull requests to `main` or `develop`

**Release Pipeline (`release.yml`):**
- ✅ Git tags matching `v*.*.*` (e.g., `v1.0.0`, `v1.2.3`)

---

## CI Pipeline

**File:** `.github/workflows/ci.yml`

### Purpose
Validates code quality, runs tests, and ensures builds succeed on every push/PR.

### Steps

#### 1. **Checkout Code**
```yaml
- uses: actions/checkout@v4
```
Clones the repository to the GitHub Actions runner.

#### 2. **Setup Node.js**
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'npm'
```
Installs Node.js v20 and caches npm dependencies for faster builds.

#### 3. **Install Dependencies**
```yaml
- run: npm ci
```
Performs a clean install of dependencies (faster and more reliable than `npm install`).

#### 4. **Check Code Formatting**
```yaml
- run: npm run format:check
```
Validates code formatting with Prettier. Fails if code is not properly formatted.

**Fix command:**
```bash
npm run format
```

#### 5. **Run Linter**
```yaml
- run: npm run lint || echo "ESLint not configured yet - skipping"
  continue-on-error: true
```
Runs ESLint to check code quality. Currently set to non-blocking.

**Fix command:**
```bash
npm run lint
```

#### 6. **Security Audit**
```yaml
- run: npm audit --audit-level=moderate
  continue-on-error: true
```
Scans dependencies for known vulnerabilities. Non-blocking but logs issues.

**Fix command:**
```bash
npm audit fix
```

#### 7. **Run Tests**
```yaml
- run: npm test
  continue-on-error: true
```
Executes Jest test suite. Currently non-blocking to allow development.

**Run locally:**
```bash
npm test
```

#### 8. **Build Application**
```yaml
- run: npm run build
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
Builds Electron app for all platforms using `electron-builder`.

#### 9. **Upload Artifacts**
```yaml
- uses: actions/upload-artifact@v4
  with:
    name: build-artifacts
    path: dist
    retention-days: 7
```
Uploads build outputs for review. Kept for 7 days.

#### 10. **PR Notifications**
- Adds `build: success` or `build: failed` labels
- Posts comments on PRs with build status

### Success Criteria
✅ Code is properly formatted (Prettier)
✅ No linting errors (if ESLint configured)
✅ Tests pass (when enabled)
✅ Build succeeds
✅ No critical security vulnerabilities

---

## Release Pipeline

**File:** `.github/workflows/release.yml`

### Purpose
Builds production-ready installers for all platforms and creates a GitHub release.

### Trigger
Push a git tag with semantic versioning:
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### Jobs

The pipeline runs **3 parallel build jobs** + 1 release job:

---

### Job 1: Build Windows
**Runner:** `windows-latest`

**Steps:**
1. Checkout code
2. Setup Node.js 20
3. Install dependencies (`npm ci`)
4. Run tests (non-blocking)
5. Build Windows installer (`npm run build:win`)
6. Upload `.exe` artifact

**Output:** `atmos-sphere-Setup-*.exe`

---

### Job 2: Build macOS
**Runner:** `macos-latest`

**Steps:**
1. Checkout code
2. Setup Node.js 20
3. Install dependencies (`npm ci`)
4. Run tests (non-blocking)
5. Build macOS DMG (`npm run build:mac`)
6. **Verify DMG integrity** with `hdiutil verify` (auto-detects version)
7. Upload `.dmg` artifact

**Output:** `atmos-sphere-*.dmg`

**DMG Verification:**
The workflow dynamically finds and verifies the DMG file:
```bash
DMG_FILE=$(find dist -name "*.dmg" -type f | head -n 1)
hdiutil verify "$DMG_FILE"
```

---

### Job 3: Build Linux
**Runner:** `ubuntu-latest`

**Steps:**
1. Checkout code
2. Setup Node.js 20
3. Install dependencies (`npm ci`)
4. Run tests (non-blocking)
5. Build Linux AppImage (`npm run build:linux`)
6. Upload `.AppImage` artifact

**Output:** `atmos-sphere-*.AppImage`

---

### Job 4: Create Release
**Depends on:** All 3 build jobs completing successfully

**Steps:**

#### 1. Download All Artifacts
Downloads Windows, macOS, and Linux builds from previous jobs.

#### 2. Generate SHA256 Checksums
```bash
find . -type f \( -name "*.exe" -o -name "*.dmg" -o -name "*.AppImage" \) -exec sha256sum {} \;
```
Creates `checksums.txt` with file integrity hashes.

#### 3. Create Release Notes
Automatically generates release notes with:
- Version number
- Download links
- Platform-specific file names
- SHA256 checksums
- Link to `IMPROVEMENTS.md` for details

#### 4. Publish GitHub Release
- **Tag:** From the pushed tag (e.g., `v1.0.0`)
- **Title:** `atmos sphere v1.0.0`
- **Assets:**
  - `atmos-sphere-Setup-*.exe` (Windows)
  - `atmos-sphere-*.dmg` (macOS)
  - `atmos-sphere-*.AppImage` (Linux)
  - `checksums.txt`
- **Release Notes:** Auto-generated markdown
- **Status:** Public (not draft, not pre-release)

---

## Running Locally

### Prerequisites
- Node.js 20+
- npm
- Git

### Test CI Steps Locally

#### 1. Format Check
```bash
npm run format:check
```

#### 2. Format Code
```bash
npm run format
```

#### 3. Lint Code
```bash
npm run lint
```

#### 4. Security Audit
```bash
npm audit
npm audit fix  # Auto-fix vulnerabilities
```

#### 5. Run Tests
```bash
npm test
npm test -- --watch  # Watch mode
npm test -- --coverage  # With coverage
```

#### 6. Build for All Platforms
```bash
npm run build
```

#### 7. Build for Specific Platform
```bash
npm run build:win     # Windows only
npm run build:mac     # macOS only
npm run build:linux   # Linux only
```

### Build Outputs
All builds are created in the `dist/` folder:
- Windows: `dist/*.exe`
- macOS: `dist/*.dmg`
- Linux: `dist/*.AppImage`

---

## Troubleshooting

### Common Issues

#### ❌ Format Check Fails
**Error:** `Files not formatted correctly`

**Solution:**
```bash
npm run format
git add .
git commit -m "Format code with Prettier"
```

---

#### ❌ Build Fails on macOS
**Error:** Code signing issues

**Solution:** Check `electron-builder` configuration in `package.json`:
```json
"mac": {
  "hardenedRuntime": true,
  "gatekeeperAssess": false
}
```

---

#### ❌ DMG Verification Fails
**Error:** `hdiutil: verify failed`

**Cause:** Corrupted DMG file during build

**Solution:**
1. Check `electron-builder` logs
2. Verify disk space on runner
3. Check for macOS version compatibility

---

#### ❌ Security Audit Fails
**Error:** High/critical vulnerabilities found

**Solution:**
```bash
npm audit fix          # Auto-fix
npm audit fix --force  # Force major version updates (breaking changes)
```

---

#### ❌ Tests Fail in CI but Pass Locally
**Possible causes:**
- Environment variables missing
- Different Node.js versions
- Timezone differences
- Missing dependencies

**Solution:**
- Check Node.js version: `node --version` (should be 20)
- Run `npm ci` instead of `npm install`
- Check GitHub Actions logs for specific errors

---

#### ❌ Release Not Created
**Error:** No release appears after pushing tag

**Checklist:**
- [ ] Tag format is `v*.*.*` (e.g., `v1.0.0`)
- [ ] Tag is pushed to GitHub: `git push origin v1.0.0`
- [ ] All build jobs succeeded (check Actions tab)
- [ ] `GITHUB_TOKEN` permissions are correct

---

### Debugging Workflows

#### View Action Logs
1. Go to GitHub repository
2. Click **Actions** tab
3. Select the workflow run
4. Click on a job to see detailed logs

#### Download Artifacts
Artifacts are saved for review:
- **CI builds:** 7 days retention
- **Release builds:** 30 days retention

To download:
1. Go to the workflow run
2. Scroll to **Artifacts** section
3. Click to download ZIP

---

## Best Practices

### For Developers

#### Before Pushing
```bash
# 1. Format code
npm run format

# 2. Run linter
npm run lint

# 3. Run tests
npm test

# 4. Test build
npm run build
```

#### For Pull Requests
- ✅ Ensure CI passes before requesting review
- ✅ Address any linting warnings
- ✅ Add tests for new features
- ✅ Update documentation if needed

#### For Releases

##### Semantic Versioning
Follow [semver](https://semver.org/):
- **Major** (`v2.0.0`): Breaking changes
- **Minor** (`v1.1.0`): New features (backward compatible)
- **Patch** (`v1.0.1`): Bug fixes

##### Release Checklist
- [ ] All tests passing
- [ ] Version updated in `package.json`
- [ ] `IMPROVEMENTS.md` updated with changes
- [ ] Create git tag: `git tag -a v1.0.0 -m "Release v1.0.0"`
- [ ] Push tag: `git push origin v1.0.0`
- [ ] Wait for builds to complete (~15-20 minutes)
- [ ] Verify release on GitHub Releases page
- [ ] Test downloaded installers on each platform

---

## Performance Optimization

### Caching
The workflows cache npm dependencies:
```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
```

This speeds up subsequent runs by ~2-3 minutes.

### Parallel Builds
Release builds run in parallel for all 3 platforms, reducing total time from ~45 minutes to ~15 minutes.

### Artifact Retention
- CI artifacts: 7 days (balances storage costs)
- Release artifacts: 30 days (for important builds)

---

## Security

### Secrets
No additional secrets required! The workflow uses:
- `GITHUB_TOKEN`: Auto-provided by GitHub Actions
- Permissions are scoped to minimum required

### Permissions
```yaml
permissions:
  contents: write   # Upload release assets
  issues: write     # Create comments
  pull-requests: write  # Add labels
  actions: write    # Manage workflows
```

### Dependency Scanning
`npm audit` runs on every CI build to catch vulnerabilities early.

---

## Future Enhancements

Planned improvements (see `TODO.md` for details):

- [ ] **Code coverage reporting** - Integrate Codecov/Coveralls
- [ ] **Automated changelog** - Generate CHANGELOG.md from commits
- [ ] **Performance benchmarking** - Track app startup time
- [ ] **E2E tests** - Integrate Spectron tests
- [ ] **Docker builds** - Containerized build environment
- [ ] **Auto-update testing** - Verify update mechanism
- [ ] **Notarization** - Apple notarization for macOS
- [ ] **Code signing** - Windows code signing certificate

---

## GitHub Actions Badges

Add to your `README.md`:

```markdown
[![CI/CD Pipeline](https://github.com/YOUR_USERNAME/weatherly/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/weatherly/actions/workflows/ci.yml)
[![Release Build](https://github.com/YOUR_USERNAME/weatherly/actions/workflows/release.yml/badge.svg)](https://github.com/YOUR_USERNAME/weatherly/actions/workflows/release.yml)
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Electron Builder Documentation](https://www.electron.build/)
- [Semantic Versioning](https://semver.org/)
- [Jest Documentation](https://jestjs.io/)
- [ESLint Documentation](https://eslint.org/)
- [Prettier Documentation](https://prettier.io/)

---

## Support

For CI/CD issues:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review GitHub Actions logs
3. Open an issue with:
   - Workflow run URL
   - Error logs
   - Steps to reproduce

---

**Last Updated:** 2025-01-19
**Pipeline Version:** 2.0
**Status:** Production Ready ✅
