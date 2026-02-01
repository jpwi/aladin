/**
 * Unit tests for Crypto module
 * Tests encryption, decryption, recovery phrase generation, and V1/V2 format handling
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { Crypto } from './lib/crypto.js';

const TEST_PASSWORD = 'Password123!';
const WRONG_PASSWORD = 'WrongPassword456!';

describe('Crypto', () => {
    describe('Password Strength', () => {
        it('should return 0 for empty password', () => {
            expect(Crypto.getPasswordStrength('')).toBe(0);
            expect(Crypto.getPasswordStrength(null)).toBe(0);
        });

        it('should score weak passwords low', () => {
            expect(Crypto.getPasswordStrength('short')).toBeLessThan(2);
            expect(Crypto.getPasswordStrength('12345')).toBeLessThan(2);
        });

        it('should score strong passwords high', () => {
            expect(Crypto.getPasswordStrength(TEST_PASSWORD)).toBeGreaterThanOrEqual(3);
        });

        it('should return correct labels', () => {
            expect(Crypto.getPasswordStrengthLabel(0)).toBe('Very Weak');
            expect(Crypto.getPasswordStrengthLabel(2)).toBe('Fair');
            expect(Crypto.getPasswordStrengthLabel(4)).toBe('Very Strong');
        });
    });

    describe('Key Generation', () => {
        it('should generate a random salt of correct length', () => {
            const salt = Crypto.generateSalt();
            expect(salt).toBeInstanceOf(Uint8Array);
            expect(salt.length).toBe(Crypto.SALT_LENGTH);
        });

        it('should generate a random IV of correct length', () => {
            const iv = Crypto.generateIV();
            expect(iv).toBeInstanceOf(Uint8Array);
            expect(iv.length).toBe(Crypto.IV_LENGTH);
        });

        it('should generate unique salts', () => {
            const salt1 = Crypto.generateSalt();
            const salt2 = Crypto.generateSalt();
            expect(salt1).not.toEqual(salt2);
        });

        it('should generate a master key', async () => {
            const key = await Crypto.generateMasterKey();
            expect(key).toBeDefined();
            expect(key.type).toBe('secret');
        });
    });

    describe('Base64 Encoding', () => {
        it('should encode and decode ArrayBuffer correctly', () => {
            const original = new Uint8Array([1, 2, 3, 255, 0, 128]);
            const encoded = Crypto.arrayBufferToBase64(original);
            const decoded = new Uint8Array(Crypto.base64ToArrayBuffer(encoded));
            expect(decoded).toEqual(original);
        });
    });

    describe('Recovery Phrase Generation', () => {
        it('should generate a 24-word recovery phrase', async () => {
            const phrase = await Crypto.generateRecoveryPhrase();
            const words = phrase.split(' ');
            expect(words.length).toBe(24);
        });

        it('should generate unique phrases each time', async () => {
            const phrase1 = await Crypto.generateRecoveryPhrase();
            const phrase2 = await Crypto.generateRecoveryPhrase();
            expect(phrase1).not.toBe(phrase2);
        });

        it('should only use words from the wordlist', async () => {
            const phrase = await Crypto.generateRecoveryPhrase();
            const words = phrase.split(' ');
            const wordlist = Crypto.getWordlist();
            
            for (const word of words) {
                expect(wordlist).toContain(word);
            }
        });
    });

    describe('V2 Encryption/Decryption', () => {
        const testData = { message: 'Hello, World!', nested: { value: 42 } };

        it('should encrypt data with password', async () => {
            const encrypted = await Crypto.encrypt(testData, TEST_PASSWORD);
            
            expect(encrypted.version).toBe('2.0');
            expect(encrypted.algorithm).toBe(Crypto.ALGO_V2);
            expect(encrypted.iv).toBeDefined();
            expect(encrypted.ciphertext).toBeDefined();
            expect(encrypted.keySlots).toBeInstanceOf(Array);
            expect(encrypted.keySlots.length).toBe(1);
            expect(encrypted.keySlots[0].type).toBe('password');
        });

        it('should decrypt data with correct password', async () => {
            const encrypted = await Crypto.encrypt(testData, TEST_PASSWORD);
            const decrypted = await Crypto.decrypt(encrypted, TEST_PASSWORD);
            
            expect(decrypted.data).toEqual(testData);
            expect(decrypted.usedSlotType).toBe('password');
            expect(decrypted.masterKey).toBeDefined();
        });

        it('should fail decryption with wrong password', async () => {
            const encrypted = await Crypto.encrypt(testData, TEST_PASSWORD);
            
            await expect(Crypto.decrypt(encrypted, WRONG_PASSWORD))
                .rejects.toThrow('Wrong password');
        });

        it('should encrypt with recovery phrase slot', async () => {
            const recoveryPhrase = await Crypto.generateRecoveryPhrase();
            const encrypted = await Crypto.encrypt(testData, TEST_PASSWORD, { 
                recoveryPhrase 
            });
            
            expect(encrypted.keySlots.length).toBe(2);
            expect(encrypted.keySlots[0].type).toBe('password');
            expect(encrypted.keySlots[1].type).toBe('recovery');
        });

        it('should decrypt with recovery phrase', async () => {
            const recoveryPhrase = await Crypto.generateRecoveryPhrase();
            const encrypted = await Crypto.encrypt(testData, TEST_PASSWORD, { 
                recoveryPhrase 
            });
            
            // Decrypt using recovery phrase instead of password
            const decrypted = await Crypto.decrypt(encrypted, recoveryPhrase);
            
            expect(decrypted.data).toEqual(testData);
            expect(decrypted.usedSlotType).toBe('recovery');
        });

        it('should preserve existing recovery slots on re-encryption', async () => {
            const recoveryPhrase = await Crypto.generateRecoveryPhrase();
            const masterKey = await Crypto.generateMasterKey();
            
            // First encryption with recovery phrase
            const encrypted1 = await Crypto.encrypt(testData, TEST_PASSWORD, { 
                masterKey,
                recoveryPhrase 
            });
            
            // Re-encrypt with same master key (simulating password change)
            const encrypted2 = await Crypto.encrypt(testData, 'NewPassword123!', { 
                masterKey,
                keySlots: encrypted1.keySlots 
            });
            
            expect(encrypted2.keySlots.length).toBe(2);
            
            // Should still be able to decrypt with recovery phrase
            const decrypted = await Crypto.decrypt(encrypted2, recoveryPhrase);
            expect(decrypted.data).toEqual(testData);
        });
    });

    describe('V1 Format Compatibility', () => {
        it('should decrypt V1 format data', async () => {
            const testData = { content: 'Legacy data' };
            
            // Create V1 format manually
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(testData));
            const salt = Crypto.generateSalt();
            const iv = Crypto.generateIV();
            const key = await Crypto.deriveKeyLegacy(TEST_PASSWORD, salt);
            
            const ciphertext = await crypto.subtle.encrypt(
                { name: "AES-GCM", iv: iv },
                key,
                dataBuffer,
            );
            
            const v1Encrypted = {
                version: '1.0',
                algorithm: 'AES-GCM-256-PBKDF2',
                salt: Crypto.arrayBufferToBase64(salt),
                iv: Crypto.arrayBufferToBase64(iv),
                ciphertext: Crypto.arrayBufferToBase64(ciphertext)
            };
            
            const decrypted = await Crypto.decrypt(v1Encrypted, TEST_PASSWORD);
            
            expect(decrypted.data).toEqual(testData);
            expect(decrypted.isV1Migration).toBe(true);
            expect(decrypted.masterKey).toBeDefined();
        });

        it('should fail V1 decryption with wrong password', async () => {
            const testData = { content: 'Legacy data' };
            
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(testData));
            const salt = Crypto.generateSalt();
            const iv = Crypto.generateIV();
            const key = await Crypto.deriveKeyLegacy(TEST_PASSWORD, salt);
            
            const ciphertext = await crypto.subtle.encrypt(
                { name: "AES-GCM", iv: iv },
                key,
                dataBuffer,
            );
            
            const v1Encrypted = {
                version: '1.0',
                salt: Crypto.arrayBufferToBase64(salt),
                iv: Crypto.arrayBufferToBase64(iv),
                ciphertext: Crypto.arrayBufferToBase64(ciphertext)
            };
            
            await expect(Crypto.decrypt(v1Encrypted, WRONG_PASSWORD))
                .rejects.toThrow('Wrong password');
        });
    });

    describe('Password Verification', () => {
        it('should verify correct password', async () => {
            const encrypted = await Crypto.encrypt({ test: true }, TEST_PASSWORD);
            const result = await Crypto.verifyPassword(encrypted, TEST_PASSWORD);
            expect(result).toBe(true);
        });

        it('should reject wrong password', async () => {
            const encrypted = await Crypto.encrypt({ test: true }, TEST_PASSWORD);
            const result = await Crypto.verifyPassword(encrypted, WRONG_PASSWORD);
            expect(result).toBe(false);
        });
    });

    describe('Master Key Wrapping', () => {
        it('should wrap and unwrap master key', async () => {
            const masterKey = await Crypto.generateMasterKey();
            const slot = await Crypto.wrapMasterKey(masterKey, TEST_PASSWORD, 'password');
            
            expect(slot.type).toBe('password');
            expect(slot.salt).toBeDefined();
            expect(slot.iv).toBeDefined();
            expect(slot.ciphertext).toBeDefined();
            
            const unwrappedKey = await Crypto.unwrapMasterKey(slot, TEST_PASSWORD);
            expect(unwrappedKey).toBeDefined();
            
            // Verify the unwrapped key works by encrypting/decrypting
            const testData = new TextEncoder().encode('test');
            const iv = Crypto.generateIV();
            
            const encrypted = await crypto.subtle.encrypt(
                { name: "AES-GCM", iv: iv },
                masterKey,
                testData
            );
            
            const decrypted = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                unwrappedKey,
                encrypted
            );
            
            // Compare the decrypted data matches original
            const decryptedArray = new Uint8Array(decrypted);
            expect(decryptedArray.length).toBe(testData.length);
            expect(Array.from(decryptedArray)).toEqual(Array.from(testData));
        });

        it('should fail unwrap with wrong password', async () => {
            const masterKey = await Crypto.generateMasterKey();
            const slot = await Crypto.wrapMasterKey(masterKey, TEST_PASSWORD, 'password');
            
            await expect(Crypto.unwrapMasterKey(slot, WRONG_PASSWORD))
                .rejects.toThrow('Failed to unwrap key');
        });
    });
});
