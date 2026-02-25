// Copyright The Mumble Developers. All rights reserved.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file at the root of the
// Mumble source tree or at <https://www.mumble.info/LICENSE>.

#ifndef MUMBLE_CRYPTSTATEOCB2_H_
#define MUMBLE_CRYPTSTATEOCB2_H_

#include <string>
#include <openssl/evp.h>

constexpr int AES_KEY_SIZE_BITS = 128;
constexpr int AES_KEY_SIZE_BYTES = AES_KEY_SIZE_BITS / 8;
constexpr int AES_BLOCK_SIZE = 128 / 8;

class CryptStateOCB2 {
protected:
	unsigned char raw_key[AES_KEY_SIZE_BYTES];
	unsigned char encrypt_iv[AES_BLOCK_SIZE];
	unsigned char decrypt_iv[AES_BLOCK_SIZE];
	unsigned char decrypt_history[256];

	bool bInit;
	
	EVP_CIPHER_CTX *enc_ctx_ocb_enc;
	EVP_CIPHER_CTX *dec_ctx_ocb_enc;
	EVP_CIPHER_CTX *enc_ctx_ocb_dec;
	EVP_CIPHER_CTX *dec_ctx_ocb_dec;

	bool ocb_encrypt(const unsigned char *plain, unsigned char *encrypted, unsigned int len,
	                 const unsigned char *nonce, unsigned char *tag, bool modifyPlainOnXEXStarAttack = true);
	bool ocb_decrypt(const unsigned char *encrypted, unsigned char *plain, unsigned int len,
	                 const unsigned char *nonce, unsigned char *tag);

public:
	CryptStateOCB2();
	~CryptStateOCB2() noexcept;

	bool isValid() const;

	void genKey();
	bool setKey(const std::string &rkey, const std::string &eiv, const std::string &div);
	bool setRawKey(const std::string &rkey);
	bool setEncryptIV(const std::string &iv);
	bool setDecryptIV(const std::string &iv);

	std::string getRawKey();
	std::string getEncryptIV();
	std::string getDecryptIV();

	bool encrypt(const unsigned char *source, unsigned char *dst, unsigned int plain_length);
	bool decrypt(const unsigned char *source, unsigned char *dst, unsigned int crypted_length);
};

#endif
