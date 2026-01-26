/**
 * Storage Abstraction Layer
 * Now integrated with Vault for encrypted single-file storage
 * Falls back to IndexedDB for working data during session
 */

const Storage = {
    DB_NAME: "aladin-knowledge-base",
    DB_VERSION: 2,
    STORES: {
        CONTENT: "content",
        ATTACHMENTS: "attachments",
        SETTINGS: "settings",
    },

    db: null,
    useVault: true, // Flag to enable/disable vault integration

    /**
     * Initialize the storage system
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = () => {
                console.error("Failed to open database:", request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log("Storage initialized successfully");
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Content store - for blocks/document data
                if (!db.objectStoreNames.contains(this.STORES.CONTENT)) {
                    db.createObjectStore(this.STORES.CONTENT, {
                        keyPath: "id",
                    });
                }

                // Attachments store - for files and images
                if (!db.objectStoreNames.contains(this.STORES.ATTACHMENTS)) {
                    const attachmentStore = db.createObjectStore(
                        this.STORES.ATTACHMENTS,
                        { keyPath: "hash" },
                    );
                    attachmentStore.createIndex(
                        "originalName",
                        "originalName",
                        { unique: false },
                    );
                    attachmentStore.createIndex("created", "created", {
                        unique: false,
                    });
                }

                // Settings store - for user preferences
                if (!db.objectStoreNames.contains(this.STORES.SETTINGS)) {
                    db.createObjectStore(this.STORES.SETTINGS, {
                        keyPath: "key",
                    });
                }
            };
        });
    },

    /**
     * Load data from vault into IndexedDB (for working session)
     */
    async loadFromVault(vaultData) {
        if (!vaultData) return;

        // Load content (skip vault save since we're loading from vault)
        if (vaultData.content) {
            await this.saveContent(vaultData.content, true);
        }

        // Load attachments (skip vault save since we're loading from vault)
        if (vaultData.attachments && Array.isArray(vaultData.attachments)) {
            for (const attachment of vaultData.attachments) {
                await this.saveAttachment(attachment, true);
            }
        }

        // Load settings (skip vault save since we're loading from vault)
        if (vaultData.settings) {
            for (const [key, value] of Object.entries(vaultData.settings)) {
                await this.saveSetting(key, value, true);
            }
        }

        console.log("Storage: Loaded data from vault");
    },

    /**
     * Save current data to vault
     */
    async saveToVault() {
        if (!this.useVault) {
            console.log("Storage: Vault not enabled, skipping save");
            return;
        }
        if (Vault.isLocked) {
            console.log("Storage: Vault is locked, skipping save");
            return;
        }

        try {
            const data = await this.exportData();
            await Vault.save(data);
            console.log("Storage: Saved to vault");
            this.lastSaveSuccess = true;
            this.lastSaveTime = Date.now();
        } catch (error) {
            console.error("Storage: Failed to save to vault:", error);
            this.lastSaveSuccess = false;
            
            // Show user-friendly error for cloud sync issues
            if (error.message?.includes("locked") || 
                error.name === "NoModificationAllowedError" ||
                error.message?.includes("retries")) {
                console.warn("Storage: Cloud sync (OneDrive/Dropbox/iCloud) may be blocking the file.");
                console.warn("Storage: Tip: Right-click your .aladin file → 'Always keep on this device'");
                
                // Dispatch event so UI can show notification if needed
                window.dispatchEvent(new CustomEvent('vault-save-error', { 
                    detail: { 
                        type: 'cloud-sync-lock',
                        message: 'File may be locked by cloud sync. Changes saved to local cache.'
                    }
                }));
            }
        }
    },

    // Track save status
    lastSaveSuccess: true,
    lastSaveTime: null,

    /**
     * Debounced vault save
     */
    debouncedVaultSave: null,

    /**
     * Schedule a vault save (debounced)
     * Uses a 3-second delay to batch changes and reduce file operations
     * This helps with cloud sync services (OneDrive, Dropbox, iCloud)
     */
    scheduleVaultSave() {
        if (!this.debouncedVaultSave) {
            this.debouncedVaultSave = Utils.debounce(() => {
                this.saveToVault();
            }, 300); // 300ms for near-immediate save feel
        }
        this.debouncedVaultSave();
    },

    /**
     * Get a transaction for the specified store
     */
    getTransaction(storeName, mode = "readonly") {
        if (!this.db) {
            throw new Error("Database not initialized");
        }
        return this.db.transaction(storeName, mode);
    },

    /**
     * Get an object store
     */
    getStore(storeName, mode = "readonly") {
        return this.getTransaction(storeName, mode).objectStore(storeName);
    },

    // ==========================================
    // Content Operations
    // ==========================================

    /**
     * Save document content (blocks)
     */
    async saveContent(content, skipVaultSave = false) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(this.STORES.CONTENT, "readwrite");
            const data = {
                id: "main-document",
                blocks: content.blocks || [],
                time: content.time || Date.now(),
                version: content.version || "2.28.2",
            };

            const request = store.put(data);
            request.onsuccess = () => {
                // Schedule vault save after IndexedDB save
                if (!skipVaultSave && this.useVault) {
                    this.scheduleVaultSave();
                }
                resolve(data);
            };
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Load document content
     */
    async loadContent() {
        return new Promise((resolve, reject) => {
            const store = this.getStore(this.STORES.CONTENT);
            const request = store.get("main-document");

            request.onsuccess = () => {
                resolve(request.result || null);
            };
            request.onerror = () => reject(request.error);
        });
    },

    // ==========================================
    // Attachment Operations
    // ==========================================

    /**
     * Save an attachment
     */
    async saveAttachment(attachment, skipVaultSave = false) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(this.STORES.ATTACHMENTS, "readwrite");
            const request = store.put(attachment);

            request.onsuccess = () => {
                // Schedule vault save after attachment save
                if (!skipVaultSave && this.useVault) {
                    this.scheduleVaultSave();
                }
                resolve(attachment);
            };
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Get an attachment by hash
     */
    async getAttachment(hash) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(this.STORES.ATTACHMENTS);
            const request = store.get(hash);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Get all attachments
     */
    async getAllAttachments() {
        return new Promise((resolve, reject) => {
            const store = this.getStore(this.STORES.ATTACHMENTS);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Delete an attachment
     */
    async deleteAttachment(hash) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(this.STORES.ATTACHMENTS, "readwrite");
            const request = store.delete(hash);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Check if attachment exists
     */
    async hasAttachment(hash) {
        const attachment = await this.getAttachment(hash);
        return attachment !== null;
    },

    // ==========================================
    // Settings Operations
    // ==========================================

    /**
     * Save a setting
     */
    async saveSetting(key, value, skipVaultSave = false) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(this.STORES.SETTINGS, "readwrite");
            const request = store.put({ key, value });

            request.onsuccess = () => {
                // Trigger vault save for settings (like AI config)
                if (!skipVaultSave && this.useVault) {
                    this.scheduleVaultSave();
                }
                resolve({ key, value });
            };
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Get a setting
     */
    async getSetting(key, defaultValue = null) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(this.STORES.SETTINGS);
            const request = store.get(key);

            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.value : defaultValue);
            };
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Get all settings
     */
    async getAllSettings() {
        return new Promise((resolve, reject) => {
            const store = this.getStore(this.STORES.SETTINGS);
            const request = store.getAll();

            request.onsuccess = () => {
                const settings = {};
                for (const item of request.result || []) {
                    settings[item.key] = item.value;
                }
                resolve(settings);
            };
            request.onerror = () => reject(request.error);
        });
    },

    // ==========================================
    // Export / Import
    // ==========================================

    /**
     * Export all data as JSON (for vault)
     */
    async exportData() {
        const content = await this.loadContent();
        const attachments = await this.getAllAttachments();
        const settings = await this.getAllSettings();

        return {
            version: "1.0",
            exportedAt: Utils.getTimestamp(),
            content: content,
            attachments: attachments.map((att) => ({
                hash: att.hash,
                originalName: att.originalName,
                mime: att.mime,
                size: att.size,
                ext: att.ext,
                created: att.created,
                isImage: att.isImage,
                width: att.width,
                height: att.height,
                // Include base64 data for full export
                data: att.data,
            })),
            settings: settings,
        };
    },

    /**
     * Import data from JSON
     */
    async importData(jsonData, skipVaultSave = false) {
        // Validate structure
        if (!jsonData) {
            throw new Error("Invalid import data structure");
        }

        // Import content
        if (jsonData.content) {
            await this.saveContent(jsonData.content, true);
        }

        // Import attachments
        if (jsonData.attachments && Array.isArray(jsonData.attachments)) {
            for (const attachment of jsonData.attachments) {
                await this.saveAttachment(attachment, true);
            }
        }

        // Import settings
        if (jsonData.settings) {
            for (const [key, value] of Object.entries(jsonData.settings)) {
                await this.saveSetting(key, value, true);
            }
        }

        // Trigger vault save if needed
        if (!skipVaultSave && this.useVault) {
            this.scheduleVaultSave();
        }

        return true;
    },

    /**
     * Clear all data
     */
    async clearAll() {
        const stores = Object.values(this.STORES);

        for (const storeName of stores) {
            await new Promise((resolve, reject) => {
                const store = this.getStore(storeName, "readwrite");
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }

        return true;
    },
};

// Export for later integration with different storage backends
window.Storage = Storage;
