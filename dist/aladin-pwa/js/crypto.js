/**
 * Crypto - Encryption/Decryption using Web Crypto API
 * Uses AES-GCM with PBKDF2 key derivation for secure password-based encryption
 */

const Crypto = {
    // Encryption parameters
    SALT_LENGTH: 16,
    IV_LENGTH: 12,
    ITERATIONS: 100000,
    KEY_LENGTH: 256,

    // NEW: Algorithms
    ALGO_V1: "AES-GCM-256-PBKDF2",
    ALGO_V2: "AES-GCM-256-KW", // Key Wrapping

    /**
     * Get the BIP39 wordlist
     */
    getWordlist() {
        return window.WORDLIST || [];
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
     * Import a Master Key from raw bytes (for v1 migration or restoration)
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

        // Export master key to raw format to encrypt it as data
        // Note: Web Crypto wrapKey usually uses AES-KW, but we use AES-GCM for consistency
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
     * Encrypt data using Envelope Encryption (v2) or fallback to v1
     * options: { masterKey, recoveryPhrase, preserveKeySlots }
     */
    async encrypt(data, password, options = {}) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(JSON.stringify(data));
        const iv = this.generateIV();
        
        // Get or generate Master Key
        let masterKey = options.masterKey;
        if (!masterKey) {
            masterKey = await this.generateMasterKey();
        }

        // Encrypt data with Master Key
        const ciphertext = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            masterKey,
            dataBuffer,
        );

        // Prepare key slots
        const keySlots = [];

        // 1. Password Slot (Always create new)
        const passwordSlot = await this.wrapMasterKey(masterKey, password, "password");
        keySlots.push(passwordSlot);

        // 2. Recovery Phrase Slot
        if (options.recoveryPhrase) {
            // New recovery phrase provided - create slot
            const recoverySlot = await this.wrapMasterKey(masterKey, options.recoveryPhrase, "recovery");
            keySlots.push(recoverySlot);
        } else if (options.keySlots) {
            // Preserve existing valid recovery slots
            // (We implicitly trust them if we are re-encrypting with the SAME master key)
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
     * Returns: { data, masterKey, usedSlotType }
     */
    async decrypt(encryptedData, password) {
        // Handle v1 (Legacy)
        if (!encryptedData.version || encryptedData.version === "1.0") {
            return this.decryptV1(encryptedData, password);
        }

        // Handle v2 (Envelope)
        if (encryptedData.version === "2.0") {
            return this.decryptV2(encryptedData, password);
        }

        throw new Error(`Unknown version: ${encryptedData.version}`);
    },

    /**
     * Decrypt V1 format and upgrade result structure
     */
    async decryptV1(encryptedData, password) {
        try {
            const salt = this.base64ToArrayBuffer(encryptedData.salt);
            const iv = this.base64ToArrayBuffer(encryptedData.iv);
            const ciphertext = this.base64ToArrayBuffer(encryptedData.ciphertext);

            // In v1, we derive the key directly from password
            const key = await this.deriveKeyLegacy(password, salt);

            const decryptedBuffer = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                key,
                ciphertext,
            );

            const decoder = new TextDecoder();
            const decryptedText = decoder.decode(decryptedBuffer);
            const data = JSON.parse(decryptedText);

            // For V1→V2 migration: generate a fresh random master key
            // This is more secure than reusing the derived key
            const newMasterKey = await this.generateMasterKey();
            
            return {
                data: data,
                masterKey: newMasterKey,
                usedSlotType: "password", // v1 is always password
                isV1Migration: true // Flag to indicate V2 upgrade needed on save
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

        // Try to unwrap from each slot matching the password/phrase
        for (const slot of keySlots) {
            try {
                masterKey = await this.unwrapMasterKey(slot, password);
                usedSlotType = slot.type;
                break; // Success!
            } catch (e) {
                // Continue to next slot
            }
        }

        if (!masterKey) {
            throw new Error("Decryption failed. Wrong password or recovery phrase.");
        }

        // Decrypt data with Master Key
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
                keySlots: keySlots // Return slots so we can preserve them
            };
        } catch (e) {
            throw new Error("Data decryption failed (corrupt data?)");
        }
    },

    /**
     * Legacy Key Derivation (for V1 support)
     * Note: extractable=true so we can migrate to V2 format
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
            true, // extractable for V2 migration
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

        // Length checks
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;

        // Character variety checks
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

// Freeze to prevent modifications
Object.freeze(Crypto);

// Make globally available
window.Crypto = Crypto;
