/**
 * Crypto - Encryption/Decryption using Web Crypto API
 * Uses AES-GCM with PBKDF2 key derivation for secure password-based encryption
 * Testable version (exports as ES module)
 */

// BIP39 Wordlist (first 100 words for testing, full list in production)
const TEST_WORDLIST = [
    "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse",
    "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act",
    "action", "actor", "actress", "actual", "adapt", "add", "addict", "address", "adjust", "admit",
    "adult", "advance", "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent",
    "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol", "alert",
    "alien", "all", "alley", "allow", "almost", "alone", "alpha", "already", "also", "alter",
    "always", "amateur", "amazing", "among", "amount", "amused", "analyst", "anchor", "ancient", "anger",
    "angle", "angry", "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique",
    "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april", "arch", "arctic",
    "area", "arena", "argue", "arm", "armed", "armor", "army", "around", "arrange", "arrest"
];

// Generate full 2048 word list for testing (use pattern)
const WORDLIST = [];
for (let i = 0; i < 2048; i++) {
    WORDLIST.push(TEST_WORDLIST[i % TEST_WORDLIST.length] + (i >= TEST_WORDLIST.length ? Math.floor(i / TEST_WORDLIST.length) : ''));
}

export const Crypto = {
    // Encryption parameters
    SALT_LENGTH: 16,
    IV_LENGTH: 12,
    ITERATIONS: 100000,
    KEY_LENGTH: 256,

    // Algorithms
    ALGO_V1: "AES-GCM-256-PBKDF2",
    ALGO_V2: "AES-GCM-256-KW",

    /**
     * Get the BIP39 wordlist
     */
    getWordlist() {
        return WORDLIST;
    },

    /**
     * Generate a 24-word recovery phrase (BIP39 compatible entropy)
     */
    async generateRecoveryPhrase() {
        const wordlist = this.getWordlist();
        if (!wordlist.length) throw new Error("Wordlist not loaded");

        // 256 bits of entropy
        const entropy = crypto.getRandomValues(new Uint8Array(32));
        
        // Checksum: SHA-256 first 8 bits
        const hashBuffer = await crypto.subtle.digest("SHA-256", entropy);
        const hashArray = new Uint8Array(hashBuffer);
        const checksumByte = hashArray[0];

        // Convert to binary string
        let bits = "";
        for (let i = 0; i < 32; i++) {
            bits += entropy[i].toString(2).padStart(8, "0");
        }
        bits += checksumByte.toString(2).padStart(8, "0").substring(0, 8);

        const phrase = [];
        for (let i = 0; i < 24; i++) {
            const index = parseInt(bits.substring(i * 11, (i + 1) * 11), 2);
            phrase.push(wordlist[index]);
        }

        return phrase.join(" ");
    },

    /**
     * Generate a random salt
     */
    generateSalt() {
        return crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
    },

    /**
     * Generate a random IV (Initialization Vector)
     */
    generateIV() {
        return crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    },

    /**
     * Generate a random Master Key
     */
    async generateMasterKey() {
        return await crypto.subtle.generateKey(
            {
                name: "AES-GCM",
                length: this.KEY_LENGTH,
            },
            true,
            ["encrypt", "decrypt"]
        );
    },

    /**
     * Import a Master Key from raw bytes
     */
    async importMasterKey(keyData) {
        return await crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "AES-GCM", length: this.KEY_LENGTH },
            true,
            ["encrypt", "decrypt"]
        );
    },

    /**
     * Derive a wrapping key from a password/phrase
     */
    async deriveWrappingKey(password, salt) {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);

        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            passwordBuffer,
            "PBKDF2",
            false,
            ["deriveKey"],
        );

        return await crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: this.ITERATIONS,
                hash: "SHA-256",
            },
            keyMaterial,
            { name: "AES-GCM", length: this.KEY_LENGTH },
            false,
            ["encrypt", "decrypt", "wrapKey", "unwrapKey"],
        );
    },

    /**
     * Wrap (encrypt) the master key with a password/phrase
     */
    async wrapMasterKey(masterKey, password, type = "password") {
        const salt = this.generateSalt();
        const iv = this.generateIV();
        const wrappingKey = await this.deriveWrappingKey(password, salt);

        const masterKeyRaw = await crypto.subtle.exportKey("raw", masterKey);
        
        const ciphertext = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            wrappingKey,
            masterKeyRaw
        );

        return {
            type: type,
            salt: this.arrayBufferToBase64(salt),
            iv: this.arrayBufferToBase64(iv),
            ciphertext: this.arrayBufferToBase64(ciphertext)
        };
    },

    /**
     * Unwrap (decrypt) the master key
     */
    async unwrapMasterKey(slot, password) {
        const salt = this.base64ToArrayBuffer(slot.salt);
        const iv = this.base64ToArrayBuffer(slot.iv);
        const ciphertext = this.base64ToArrayBuffer(slot.ciphertext);

        const wrappingKey = await this.deriveWrappingKey(password, salt);

        try {
            const masterKeyRaw = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                wrappingKey,
                ciphertext
            );

            return await this.importMasterKey(masterKeyRaw);
        } catch (e) {
            throw new Error("Failed to unwrap key");
        }
    },

    /**
     * Encrypt data using Envelope Encryption (v2)
     */
    async encrypt(data, password, options = {}) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(JSON.stringify(data));
        const iv = this.generateIV();
        
        let masterKey = options.masterKey;
        if (!masterKey) {
            masterKey = await this.generateMasterKey();
        }

        const ciphertext = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            masterKey,
            dataBuffer,
        );

        const keySlots = [];

        const passwordSlot = await this.wrapMasterKey(masterKey, password, "password");
        keySlots.push(passwordSlot);

        if (options.recoveryPhrase) {
            const recoverySlot = await this.wrapMasterKey(masterKey, options.recoveryPhrase, "recovery");
            keySlots.push(recoverySlot);
        } else if (options.keySlots) {
            const existingRecoveryIds = options.keySlots.filter(s => s.type === "recovery");
            keySlots.push(...existingRecoveryIds);
        }

        return {
            version: "2.0",
            algorithm: this.ALGO_V2,
            iv: this.arrayBufferToBase64(iv),
            ciphertext: this.arrayBufferToBase64(ciphertext),
            keySlots: keySlots
        };
    },

    /**
     * Decrypt data handling both v1 and v2 formats
     */
    async decrypt(encryptedData, password) {
        if (!encryptedData.version || encryptedData.version === "1.0") {
            return this.decryptV1(encryptedData, password);
        }

        if (encryptedData.version === "2.0") {
            return this.decryptV2(encryptedData, password);
        }

        throw new Error(`Unknown version: ${encryptedData.version}`);
    },

    /**
     * Decrypt V1 format
     */
    async decryptV1(encryptedData, password) {
        try {
            const salt = this.base64ToArrayBuffer(encryptedData.salt);
            const iv = this.base64ToArrayBuffer(encryptedData.iv);
            const ciphertext = this.base64ToArrayBuffer(encryptedData.ciphertext);

            const key = await this.deriveKeyLegacy(password, salt);

            const decryptedBuffer = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                key,
                ciphertext,
            );

            const decoder = new TextDecoder();
            const decryptedText = decoder.decode(decryptedBuffer);
            const data = JSON.parse(decryptedText);

            const newMasterKey = await this.generateMasterKey();
            
            return {
                data: data,
                masterKey: newMasterKey,
                usedSlotType: "password",
                isV1Migration: true
            };

        } catch (error) {
            throw new Error("Decryption failed. Wrong password?");
        }
    },

    /**
     * Decrypt V2 format
     */
    async decryptV2(encryptedData, password) {
        const { keySlots, iv: ivB64, ciphertext: cipherB64 } = encryptedData;
        const iv = this.base64ToArrayBuffer(ivB64);
        const ciphertext = this.base64ToArrayBuffer(cipherB64);

        let masterKey = null;
        let usedSlotType = null;

        for (const slot of keySlots) {
            try {
                masterKey = await this.unwrapMasterKey(slot, password);
                usedSlotType = slot.type;
                break;
            } catch (e) {
                // Continue to next slot
            }
        }

        if (!masterKey) {
            throw new Error("Decryption failed. Wrong password or recovery phrase.");
        }

        try {
            const decryptedBuffer = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                masterKey,
                ciphertext,
            );

            const decoder = new TextDecoder();
            const decryptedText = decoder.decode(decryptedBuffer);
            const data = JSON.parse(decryptedText);

            return {
                data: data,
                masterKey: masterKey,
                usedSlotType: usedSlotType,
                keySlots: keySlots
            };
        } catch (e) {
            throw new Error("Data decryption failed (corrupt data?)");
        }
    },

    /**
     * Legacy Key Derivation (for V1 support)
     */
    async deriveKeyLegacy(password, salt) {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);

        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            passwordBuffer,
            "PBKDF2",
            false,
            ["deriveKey"],
        );

        return await crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: this.ITERATIONS,
                hash: "SHA-256",
            },
            keyMaterial,
            { name: "AES-GCM", length: this.KEY_LENGTH },
            true,
            ["encrypt", "decrypt"],
        );
    },

    /**
     * Verify if a password can decrypt the data
     */
    async verifyPassword(encryptedData, password) {
        try {
            await this.decrypt(encryptedData, password);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Convert ArrayBuffer to base64 string
     */
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    },

    /**
     * Convert base64 string to ArrayBuffer
     */
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    },
    
    /**
     * Calculate password strength score (0-4)
     */
    getPasswordStrength(password) {
        let score = 0;
        if (!password) return score;

        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^a-zA-Z\d]/.test(password)) score++;

        return Math.min(score, 4);
    },

    /**
     * Get password strength label
     */
    getPasswordStrengthLabel(score) {
        const labels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
        return labels[score] || labels[0];
    },
};
