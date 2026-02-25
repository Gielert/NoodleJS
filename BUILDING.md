# Native OCB2 Module Build Instructions

This project uses a native C++ addon for OCB2-AES128 encryption, which provides better performance and reliability than the JavaScript implementation.

## Prerequisites

### Windows
- Visual Studio 2019 or later with C++ development tools
- Node.js 10.0.0 or later
- Python 3.x (for node-gyp)
- OpenSSL development libraries

### Linux
```bash
sudo apt-get install build-essential libssl-dev
```

### macOS
```bash
xcode-select --install
brew install openssl
```

## Building

The native module will be built automatically when you run:

```bash
yarn install
```

To rebuild manually:

```bash
yarn rebuild
```

## Troubleshooting

If you encounter OpenSSL-related errors on Windows:
1. Install OpenSSL from https://slproweb.com/products/Win32OpenSSL.html
2. Set environment variables:
   ```
   set OPENSSL_ROOT_DIR=C:\Program Files\OpenSSL-Win64
   ```

If you encounter build errors, ensure you have the correct build tools installed.
