{
  "targets": [
    {
      "target_name": "cryptstate_ocb2",
      "sources": [
        "native/binding.cpp",
        "native/CryptStateOCB2.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "native"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ],
      "conditions": [
        ["OS=='win'", {
          "libraries": [
            "libssl.lib",
            "libcrypto.lib",
            "Ws2_32.lib"
          ],
          "library_dirs": [
            "<!(if defined OPENSSL_ROOT_DIR (echo %OPENSSL_ROOT_DIR%/lib/VC/x64/MD) else (echo C:/Program Files/OpenSSL-Win64/lib/VC/x64/MD))"
          ],
          "include_dirs": [
            "<!(if defined OPENSSL_ROOT_DIR (echo %OPENSSL_ROOT_DIR%/include) else (echo C:/Program Files/OpenSSL-Win64/include))"
          ],
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1,
              "AdditionalOptions": [ "/std:c++14" ]
            }
          }
        }],
        ["OS=='linux'", {
          "libraries": [
            "-lssl",
            "-lcrypto"
          ],
          "cflags_cc": [
            "-std=c++14"
          ]
        }],
        ["OS=='mac'", {
          "libraries": [
            "-lssl",
            "-lcrypto"
          ],
          "library_dirs": [
            "<!(if [ -n \"$OPENSSL_ROOT_DIR\" ]; then echo $OPENSSL_ROOT_DIR/lib; elif [ -d /opt/homebrew/opt/openssl@3/lib ]; then echo /opt/homebrew/opt/openssl@3/lib; else echo /usr/local/opt/openssl@3/lib; fi)"
          ],
          "include_dirs": [
            "<!(if [ -n \"$OPENSSL_ROOT_DIR\" ]; then echo $OPENSSL_ROOT_DIR/include; elif [ -d /opt/homebrew/opt/openssl@3/include ]; then echo /opt/homebrew/opt/openssl@3/include; else echo /usr/local/opt/openssl@3/include; fi)"
          ],
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "CLANG_CXX_LANGUAGE_STANDARD": "c++14",
            "MACOSX_DEPLOYMENT_TARGET": "10.9"
          }
        }]
      ]
    }
  ]
}
