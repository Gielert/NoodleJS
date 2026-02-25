#include <node_api.h>
#include "CryptStateOCB2.h"
#include <cstring>

// Wrapper class to hold CryptStateOCB2 instance
struct CryptStateWrapper {
    CryptStateOCB2* crypt;
};

// Finalizer for CryptStateWrapper
static void FinalizeCryptState(napi_env env, void* finalize_data, void* finalize_hint) {
    CryptStateWrapper* wrapper = reinterpret_cast<CryptStateWrapper*>(finalize_data);
    delete wrapper->crypt;
    delete wrapper;
}

// Constructor: new CryptStateOCB2()
static napi_value New(napi_env env, napi_callback_info info) {
    napi_value thisArg;
    napi_get_cb_info(env, info, nullptr, nullptr, &thisArg, nullptr);

    CryptStateWrapper* wrapper = new CryptStateWrapper();
    wrapper->crypt = new CryptStateOCB2();

    napi_wrap(env, thisArg, wrapper, FinalizeCryptState, nullptr, nullptr);
    return thisArg;
}

// setKey(key: Buffer, clientNonce: Buffer, serverNonce: Buffer): boolean
static napi_value SetKey(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value args[3];
    napi_value thisArg;
    napi_get_cb_info(env, info, &argc, args, &thisArg, nullptr);

    if (argc < 3) {
        napi_throw_error(env, nullptr, "Expected 3 arguments: key, clientNonce, serverNonce");
        return nullptr;
    }

    CryptStateWrapper* wrapper;
    napi_unwrap(env, thisArg, reinterpret_cast<void**>(&wrapper));

    // Get buffer data
    char* keyData;
    char* clientNonceData;
    char* serverNonceData;
    size_t keyLen, clientNonceLen, serverNonceLen;

    napi_get_buffer_info(env, args[0], reinterpret_cast<void**>(&keyData), &keyLen);
    napi_get_buffer_info(env, args[1], reinterpret_cast<void**>(&clientNonceData), &clientNonceLen);
    napi_get_buffer_info(env, args[2], reinterpret_cast<void**>(&serverNonceData), &serverNonceLen);

    std::string key(keyData, keyLen);
    std::string clientNonce(clientNonceData, clientNonceLen);
    std::string serverNonce(serverNonceData, serverNonceLen);

    bool result = wrapper->crypt->setKey(key, clientNonce, serverNonce);

    napi_value returnValue;
    napi_get_boolean(env, result, &returnValue);
    return returnValue;
}

// encrypt(plaintext: Buffer): Buffer
static napi_value Encrypt(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_value thisArg;
    napi_get_cb_info(env, info, &argc, args, &thisArg, nullptr);

    if (argc < 1) {
        napi_throw_error(env, nullptr, "Expected 1 argument: plaintext");
        return nullptr;
    }

    CryptStateWrapper* wrapper;
    napi_unwrap(env, thisArg, reinterpret_cast<void**>(&wrapper));

    char* plaintextData;
    size_t plaintextLen;
    napi_get_buffer_info(env, args[0], reinterpret_cast<void**>(&plaintextData), &plaintextLen);

    // Encrypted packet is plaintext + 4 bytes header
    unsigned int encryptedLen = plaintextLen + 4;
    unsigned char* encrypted = new unsigned char[encryptedLen];

    bool success = wrapper->crypt->encrypt(reinterpret_cast<unsigned char*>(plaintextData), encrypted, plaintextLen);

    if (!success) {
        delete[] encrypted;
        napi_throw_error(env, nullptr, "Encryption failed");
        return nullptr;
    }

    napi_value buffer;
    void* bufferData;
    napi_create_buffer_copy(env, encryptedLen, encrypted, &bufferData, &buffer);
    delete[] encrypted;

    return buffer;
}

// decrypt(ciphertext: Buffer): Buffer | null
static napi_value Decrypt(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_value thisArg;
    napi_get_cb_info(env, info, &argc, args, &thisArg, nullptr);

    if (argc < 1) {
        napi_throw_error(env, nullptr, "Expected 1 argument: ciphertext");
        return nullptr;
    }

    CryptStateWrapper* wrapper;
    napi_unwrap(env, thisArg, reinterpret_cast<void**>(&wrapper));

    char* ciphertextData;
    size_t ciphertextLen;
    napi_get_buffer_info(env, args[0], reinterpret_cast<void**>(&ciphertextData), &ciphertextLen);

    if (ciphertextLen < 4) {
        napi_value nullValue;
        napi_get_null(env, &nullValue);
        return nullValue;
    }

    // Plaintext is ciphertext - 4 bytes header
    unsigned int plaintextLen = ciphertextLen - 4;
    unsigned char* plaintext = new unsigned char[plaintextLen];

    bool success = wrapper->crypt->decrypt(reinterpret_cast<unsigned char*>(ciphertextData), plaintext, ciphertextLen);

    if (!success) {
        delete[] plaintext;
        napi_value nullValue;
        napi_get_null(env, &nullValue);
        return nullValue;
    }

    napi_value buffer;
    void* bufferData;
    napi_create_buffer_copy(env, plaintextLen, plaintext, &bufferData, &buffer);
    delete[] plaintext;

    return buffer;
}

// Initialize the module
static napi_value Init(napi_env env, napi_value exports) {
    napi_value cons;
    napi_property_descriptor properties[] = {
        { "setKey", nullptr, SetKey, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "encrypt", nullptr, Encrypt, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "decrypt", nullptr, Decrypt, nullptr, nullptr, nullptr, napi_default, nullptr },
    };

    napi_define_class(env, "CryptStateOCB2", NAPI_AUTO_LENGTH, New, nullptr, 3, properties, &cons);
    napi_set_named_property(env, exports, "CryptStateOCB2", cons);

    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
