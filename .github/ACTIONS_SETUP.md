# GitHub Actions Setup

This project uses GitHub Actions for continuous integration and automated publishing to npm.

## Workflows

### CI Workflow (`.github/workflows/ci.yml`)
- **Trigger**: Runs on push to main/master branch and on pull requests
- **Tests**: Runs on Ubuntu, Windows, and macOS with Node.js 18 and 20
- **Steps**:
  1. Installs OpenSSL (required for native crypto module)
  2. Installs dependencies
  3. Builds native addon
  4. Runs linter
  5. Runs tests

### Publish Workflow (`.github/workflows/publish.yml`)
- **Trigger**: Runs when a new GitHub release is published
- **Steps**:
  1. Runs all tests
  2. Publishes to npm registry

## Setup Instructions

### 1. npm Token
To publish to npm automatically, you need to create an npm access token and add it to GitHub secrets:

1. **Generate npm token**:
   - Log in to [npmjs.com](https://www.npmjs.com/)
   - Go to your account settings → Access Tokens
   - Click "Generate New Token" → "Classic Token"
   - Select "Automation" type (for CI/CD workflows)
   - Copy the generated token

2. **Add token to GitHub**:
   - Go to your GitHub repository
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your npm token
   - Click "Add secret"

### 2. OpenSSL Requirements

The native cryptographic module requires OpenSSL to be installed:

#### Windows
```powershell
choco install openssl
```
Or download from [slproweb.com/products/Win32OpenSSL.html](https://slproweb.com/products/Win32OpenSSL.html)

#### Ubuntu/Debian
```bash
sudo apt-get install libssl-dev
```

#### macOS
```bash
brew install openssl@3
```

### 3. Publishing a Release

To publish a new version to npm:

1. **Update version** in `package.json`:
   ```bash
   npm version patch  # or minor, or major
   ```

2. **Commit and push**:
   ```bash
   git push && git push --tags
   ```

3. **Create GitHub release**:
   - Go to GitHub repository → Releases
   - Click "Draft a new release"
   - Choose the tag you just created
   - Add release notes
   - Click "Publish release"

4. **Automatic publishing**:
   - The publish workflow will automatically trigger
   - It will run tests and publish to npm
   - Check the Actions tab to monitor progress

## Environment Variables

The build system supports the following environment variables for custom OpenSSL locations:

- `OPENSSL_ROOT_DIR`: Custom OpenSSL installation path (all platforms)

Example usage:
```bash
export OPENSSL_ROOT_DIR=/usr/local/openssl
npm install
```

## Troubleshooting

### Build failures on macOS
If the build fails to find OpenSSL on macOS, set the `OPENSSL_ROOT_DIR` environment variable:
```bash
export OPENSSL_ROOT_DIR=$(brew --prefix openssl@3)
npm rebuild
```

### Build failures on Windows
Ensure OpenSSL is installed in the default location (`C:\Program Files\OpenSSL-Win64`) or set the `OPENSSL_ROOT_DIR` environment variable:
```powershell
$env:OPENSSL_ROOT_DIR = "C:\path\to\openssl"
npm rebuild
```
