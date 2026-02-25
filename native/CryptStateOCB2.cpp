// Copyright The Mumble Developers. All rights reserved.
// Adapted for Node.js bindings

#include "CryptStateOCB2.h"
#include <cstring>
#include <openssl/rand.h>

#ifdef _WIN32
#include <winsock2.h>
#else
#include <arpa/inet.h>
#endif

// Platform-specific byte swapping
#ifdef __LP64__
#define BLOCKSIZE 2
#define SHIFTBITS 63
typedef uint64_t subblock;
#ifdef _WIN32
#define SWAPPED(x) _byteswap_uint64(x)
#else
#define SWAPPED(x) __builtin_bswap64(x)
#endif
#else
#define BLOCKSIZE 4
#define SHIFTBITS 31
typedef uint32_t subblock;
#define SWAPPED(x) htonl(x)
#endif

typedef subblock keyblock[BLOCKSIZE];

static void inline XOR(subblock *dst, const subblock *a, const subblock *b) {
	for (int i = 0; i < BLOCKSIZE; i++) {
		dst[i] = a[i] ^ b[i];
	}
}

static void inline S2(subblock *block) {
	subblock carry = SWAPPED(block[0]) >> SHIFTBITS;
	for (int i = 0; i < BLOCKSIZE - 1; i++)
		block[i] = SWAPPED((SWAPPED(block[i]) << 1) | (SWAPPED(block[i + 1]) >> SHIFTBITS));
	block[BLOCKSIZE - 1] = SWAPPED((SWAPPED(block[BLOCKSIZE - 1]) << 1) ^ (carry * 0x87));
}

static void inline S3(subblock *block) {
	subblock carry = SWAPPED(block[0]) >> SHIFTBITS;
	for (int i = 0; i < BLOCKSIZE - 1; i++)
		block[i] ^= SWAPPED((SWAPPED(block[i]) << 1) | (SWAPPED(block[i + 1]) >> SHIFTBITS));
	block[BLOCKSIZE - 1] ^= SWAPPED((SWAPPED(block[BLOCKSIZE - 1]) << 1) ^ (carry * 0x87));
}

static void inline ZERO(keyblock &block) {
	for (int i = 0; i < BLOCKSIZE; i++)
		block[i] = 0;
}

#define AESencrypt_ctx(src, dst, key, enc_ctx) \
	{ \
		int outlen = 0; \
		EVP_EncryptInit_ex(enc_ctx, EVP_aes_128_ecb(), NULL, key, NULL); \
		EVP_CIPHER_CTX_set_padding(enc_ctx, 0); \
		EVP_EncryptUpdate(enc_ctx, reinterpret_cast<unsigned char *>(dst), &outlen, \
						  reinterpret_cast<const unsigned char *>(src), AES_BLOCK_SIZE); \
		EVP_EncryptFinal_ex(enc_ctx, reinterpret_cast<unsigned char *>((dst) + outlen), &outlen); \
	}

#define AESdecrypt_ctx(src, dst, key, dec_ctx) \
	{ \
		int outlen = 0; \
		EVP_DecryptInit_ex(dec_ctx, EVP_aes_128_ecb(), NULL, key, NULL); \
		EVP_CIPHER_CTX_set_padding(dec_ctx, 0); \
		EVP_DecryptUpdate(dec_ctx, reinterpret_cast<unsigned char *>(dst), &outlen, \
						  reinterpret_cast<const unsigned char *>(src), AES_BLOCK_SIZE); \
		EVP_DecryptFinal_ex(dec_ctx, reinterpret_cast<unsigned char *>((dst) + outlen), &outlen); \
	}

CryptStateOCB2::CryptStateOCB2()
	: enc_ctx_ocb_enc(EVP_CIPHER_CTX_new()), dec_ctx_ocb_enc(EVP_CIPHER_CTX_new()),
	  enc_ctx_ocb_dec(EVP_CIPHER_CTX_new()), dec_ctx_ocb_dec(EVP_CIPHER_CTX_new()) {
	bInit = false;
	for (int i = 0; i < 0x100; i++)
		decrypt_history[i] = 0;
	memset(raw_key, 0, AES_KEY_SIZE_BYTES);
	memset(encrypt_iv, 0, AES_BLOCK_SIZE);
	memset(decrypt_iv, 0, AES_BLOCK_SIZE);
}

CryptStateOCB2::~CryptStateOCB2() noexcept {
	EVP_CIPHER_CTX_free(enc_ctx_ocb_enc);
	EVP_CIPHER_CTX_free(dec_ctx_ocb_enc);
	EVP_CIPHER_CTX_free(enc_ctx_ocb_dec);
	EVP_CIPHER_CTX_free(dec_ctx_ocb_dec);
}

bool CryptStateOCB2::isValid() const {
	return bInit;
}

void CryptStateOCB2::genKey() {
	RAND_bytes(raw_key, AES_KEY_SIZE_BYTES);
	RAND_bytes(encrypt_iv, AES_BLOCK_SIZE);
	RAND_bytes(decrypt_iv, AES_BLOCK_SIZE);
	bInit = true;
}

bool CryptStateOCB2::setKey(const std::string &rkey, const std::string &eiv, const std::string &div) {
	if (rkey.length() == AES_KEY_SIZE_BYTES && eiv.length() == AES_BLOCK_SIZE && div.length() == AES_BLOCK_SIZE) {
		memcpy(raw_key, rkey.data(), AES_KEY_SIZE_BYTES);
		memcpy(encrypt_iv, eiv.data(), AES_BLOCK_SIZE);
		memcpy(decrypt_iv, div.data(), AES_BLOCK_SIZE);
		bInit = true;
		return true;
	}
	return false;
}

bool CryptStateOCB2::setRawKey(const std::string &rkey) {
	if (rkey.length() == AES_KEY_SIZE_BYTES) {
		memcpy(raw_key, rkey.data(), AES_KEY_SIZE_BYTES);
		return true;
	}
	return false;
}

bool CryptStateOCB2::setEncryptIV(const std::string &iv) {
	if (iv.length() == AES_BLOCK_SIZE) {
		memcpy(encrypt_iv, iv.data(), AES_BLOCK_SIZE);
		return true;
	}
	return false;
}

bool CryptStateOCB2::setDecryptIV(const std::string &iv) {
	if (iv.length() == AES_BLOCK_SIZE) {
		memcpy(decrypt_iv, iv.data(), AES_BLOCK_SIZE);
		return true;
	}
	return false;
}

std::string CryptStateOCB2::getRawKey() {
	return std::string(reinterpret_cast<const char *>(raw_key), AES_KEY_SIZE_BYTES);
}

std::string CryptStateOCB2::getEncryptIV() {
	return std::string(reinterpret_cast<const char *>(encrypt_iv), AES_BLOCK_SIZE);
}

std::string CryptStateOCB2::getDecryptIV() {
	return std::string(reinterpret_cast<const char *>(decrypt_iv), AES_BLOCK_SIZE);
}

bool CryptStateOCB2::encrypt(const unsigned char *source, unsigned char *dst, unsigned int plain_length) {
	unsigned char tag[AES_BLOCK_SIZE];

	// First, increase our IV.
	for (int i = 0; i < AES_BLOCK_SIZE; i++)
		if (++encrypt_iv[i])
			break;

	if (!ocb_encrypt(source, dst + 4, plain_length, encrypt_iv, tag)) {
		return false;
	}

	dst[0] = encrypt_iv[0];
	dst[1] = tag[0];
	dst[2] = tag[1];
	dst[3] = tag[2];
	return true;
}

bool CryptStateOCB2::decrypt(const unsigned char *source, unsigned char *dst, unsigned int crypted_length) {
	if (crypted_length < 4)
		return false;

	unsigned int plain_length = crypted_length - 4;

	unsigned char saveiv[AES_BLOCK_SIZE];
	unsigned char ivbyte = source[0];
	bool restore = false;
	unsigned char tag[AES_BLOCK_SIZE];

	memcpy(saveiv, decrypt_iv, AES_BLOCK_SIZE);

	if (((decrypt_iv[0] + 1) & 0xFF) == ivbyte) {
		// In order as expected.
		if (ivbyte > decrypt_iv[0]) {
			decrypt_iv[0] = ivbyte;
		} else if (ivbyte < decrypt_iv[0]) {
			decrypt_iv[0] = ivbyte;
			for (int i = 1; i < AES_BLOCK_SIZE; i++)
				if (++decrypt_iv[i])
					break;
		} else {
			return false;
		}
	} else {
		// This is either out of order or a repeat.
		int diff = ivbyte - decrypt_iv[0];
		if (diff > 128)
			diff = diff - 256;
		else if (diff < -128)
			diff = diff + 256;

		if ((ivbyte < decrypt_iv[0]) && (diff > -30) && (diff < 0)) {
			// Late packet, but no wraparound.
			decrypt_iv[0] = ivbyte;
			restore = true;
		} else if ((ivbyte > decrypt_iv[0]) && (diff > -30) && (diff < 0)) {
			// Last was 0x02, here comes 0xff from last round
			decrypt_iv[0] = ivbyte;
			for (int i = 1; i < AES_BLOCK_SIZE; i++)
				if (decrypt_iv[i]--)
					break;
			restore = true;
		} else if ((ivbyte > decrypt_iv[0]) && (diff > 0)) {
			// Lost a few packets, but beyond that we're good.
			decrypt_iv[0] = ivbyte;
		} else if ((ivbyte < decrypt_iv[0]) && (diff > 0)) {
			// Lost a few packets, and wrapped around
			decrypt_iv[0] = ivbyte;
			for (int i = 1; i < AES_BLOCK_SIZE; i++)
				if (++decrypt_iv[i])
					break;
		} else {
			return false;
		}

		if (decrypt_history[decrypt_iv[0]] == decrypt_iv[1]) {
			memcpy(decrypt_iv, saveiv, AES_BLOCK_SIZE);
			return false;
		}
	}

	bool ocb_success = ocb_decrypt(source + 4, dst, plain_length, decrypt_iv, tag);

	if (!ocb_success || memcmp(tag, source + 1, 3) != 0) {
		memcpy(decrypt_iv, saveiv, AES_BLOCK_SIZE);
		return false;
	}
	decrypt_history[decrypt_iv[0]] = decrypt_iv[1];

	if (restore)
		memcpy(decrypt_iv, saveiv, AES_BLOCK_SIZE);

	return true;
}

#define AESencrypt(src, dst, key) AESencrypt_ctx(src, dst, key, enc_ctx_ocb_enc)
#define AESdecrypt(src, dst, key) AESdecrypt_ctx(src, dst, key, dec_ctx_ocb_enc)

bool CryptStateOCB2::ocb_encrypt(const unsigned char *plain, unsigned char *encrypted, unsigned int len,
								 const unsigned char *nonce, unsigned char *tag, bool modifyPlainOnXEXStarAttack) {
	keyblock checksum, delta, tmp, pad;
	bool success = true;

	// Initialize
	AESencrypt(nonce, delta, raw_key);
	ZERO(checksum);

	while (len > AES_BLOCK_SIZE) {
		// Counter-cryptanalysis described in section 9 of https://eprint.iacr.org/2019/311
		bool flipABit = false;
		if (len - AES_BLOCK_SIZE <= AES_BLOCK_SIZE) {
			unsigned char sum = 0;
			for (int i = 0; i < AES_BLOCK_SIZE - 1; ++i) {
				sum |= plain[i];
			}
			if (sum == 0) {
				if (modifyPlainOnXEXStarAttack) {
					flipABit = true;
				} else {
					success = false;
				}
			}
		}

		S2(delta);
		XOR(tmp, delta, reinterpret_cast<const subblock *>(plain));
		if (flipABit) {
			*reinterpret_cast<unsigned char *>(tmp) ^= 1;
		}
		AESencrypt(tmp, tmp, raw_key);
		XOR(reinterpret_cast<subblock *>(encrypted), delta, tmp);
		XOR(checksum, checksum, reinterpret_cast<const subblock *>(plain));
		if (flipABit) {
			*reinterpret_cast<unsigned char *>(checksum) ^= 1;
		}

		len -= AES_BLOCK_SIZE;
		plain += AES_BLOCK_SIZE;
		encrypted += AES_BLOCK_SIZE;
	}

	S2(delta);
	ZERO(tmp);
	tmp[BLOCKSIZE - 1] = SWAPPED(len * 8);
	XOR(tmp, tmp, delta);
	AESencrypt(tmp, pad, raw_key);
	memcpy(tmp, plain, len);
	memcpy(reinterpret_cast<unsigned char *>(tmp) + len, reinterpret_cast<const unsigned char *>(pad) + len,
		   AES_BLOCK_SIZE - len);
	XOR(checksum, checksum, tmp);
	XOR(tmp, pad, tmp);
	memcpy(encrypted, tmp, len);

	S3(delta);
	XOR(tmp, delta, checksum);
	AESencrypt(tmp, tag, raw_key);

	return success;
}

#undef AESencrypt
#undef AESdecrypt

#define AESencrypt(src, dst, key) AESencrypt_ctx(src, dst, key, enc_ctx_ocb_dec)
#define AESdecrypt(src, dst, key) AESdecrypt_ctx(src, dst, key, dec_ctx_ocb_dec)

bool CryptStateOCB2::ocb_decrypt(const unsigned char *encrypted, unsigned char *plain, unsigned int len,
								 const unsigned char *nonce, unsigned char *tag) {
	keyblock checksum, delta, tmp, pad;
	bool success = true;

	// Initialize
	AESencrypt(nonce, delta, raw_key);
	ZERO(checksum);

	while (len > AES_BLOCK_SIZE) {
		S2(delta);
		XOR(tmp, delta, reinterpret_cast<const subblock *>(encrypted));
		AESdecrypt(tmp, tmp, raw_key);
		XOR(reinterpret_cast<subblock *>(plain), delta, tmp);
		XOR(checksum, checksum, reinterpret_cast<const subblock *>(plain));
		len -= AES_BLOCK_SIZE;
		plain += AES_BLOCK_SIZE;
		encrypted += AES_BLOCK_SIZE;
	}

	S2(delta);
	ZERO(tmp);
	tmp[BLOCKSIZE - 1] = SWAPPED(len * 8);
	XOR(tmp, tmp, delta);
	AESencrypt(tmp, pad, raw_key);
	memset(tmp, 0, AES_BLOCK_SIZE);
	memcpy(tmp, encrypted, len);
	XOR(tmp, tmp, pad);
	XOR(checksum, checksum, tmp);
	memcpy(plain, tmp, len);

	// Counter-cryptanalysis
	if (memcmp(tmp, delta, AES_BLOCK_SIZE - 1) == 0) {
		success = false;
	}

	S3(delta);
	XOR(tmp, delta, checksum);
	AESencrypt(tmp, tag, raw_key);

	return success;
}
