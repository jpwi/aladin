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
     * Derive a cryptographic key from a password using PBKDF2
     */
    async deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);

        // Import password as raw key material
        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            passwordBuffer,
            "PBKDF2",
            false,
            ["deriveKey"],
        );

        // Derive the actual encryption key
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
            ["encrypt", "decrypt"],
        );
    },

    /**
     * Encrypt data with a password
     * Returns: { salt, iv, ciphertext } as base64 encoded strings
     */
    async encrypt(data, password) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(JSON.stringify(data));

        const salt = this.generateSalt();
        const iv = this.generateIV();
        const key = await this.deriveKey(password, salt);

        const ciphertext = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            key,
            dataBuffer,
        );

        return {
            salt: this.arrayBufferToBase64(salt),
            iv: this.arrayBufferToBase64(iv),
            ciphertext: this.arrayBufferToBase64(ciphertext),
            version: "1.0",
            algorithm: "AES-GCM-256-PBKDF2",
        };
    },

    /**
     * Decrypt data with a password
     * Returns: decrypted data object
     */
    async decrypt(encryptedData, password) {
        try {
            const salt = this.base64ToArrayBuffer(encryptedData.salt);
            const iv = this.base64ToArrayBuffer(encryptedData.iv);
            const ciphertext = this.base64ToArrayBuffer(
                encryptedData.ciphertext,
            );

            const key = await this.deriveKey(password, salt);

            const decryptedBuffer = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                key,
                ciphertext,
            );

            const decoder = new TextDecoder();
            const decryptedText = decoder.decode(decryptedBuffer);
            return JSON.parse(decryptedText);
        } catch (error) {
            // Decryption failed - likely wrong password
            throw new Error("Decryption failed. Wrong password?");
        }
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
     * Generate a password strength score (0-4)
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
