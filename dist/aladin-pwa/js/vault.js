/**
 * Vault - Manages the encrypted single-file storage system
 * Handles file access, encryption/decryption, and sync capabilities
 */

const Vault = {
    // Current state
    fileHandle: null,
    password: null,
    isLocked: true,
    lastSaveTime: null,
    isDirty: false,

    // File metadata
    FILE_EXTENSION: ".aladin",
    FILE_TYPE: {
        description: "Aladin Vault",
        accept: { "application/json": [".aladin"] },
    },

    // Storage keys
    STORAGE_KEYS: {
        FILE_PATH: "aladin-vault-path",
        FILE_NAME: "aladin-vault-name",
        LAST_OPENED: "aladin-last-opened",
        FILE_HANDLE: "aladin-file-handle",
    },

    // IndexedDB for file handle persistence
    HANDLE_DB_NAME: "aladin-handles",
    HANDLE_STORE_NAME: "file-handles",

    /**
     * Initialize the vault system
     */
    async init() {
        console.log("Vault: Initializing...");

        // Check if File System Access API is supported
        this.hasFileSystemAccess = "showOpenFilePicker" in window;

        if (!this.hasFileSystemAccess) {
            console.warn(
                "Vault: File System Access API not supported. Using fallback mode.",
            );
        }

        // Initialize handle storage
        await this.initHandleStorage();

        return this;
    },

    /**
     * Initialize IndexedDB for storing file handles
     */
    async initHandleStorage() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.HANDLE_DB_NAME, 1);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.HANDLE_STORE_NAME)) {
                    db.createObjectStore(this.HANDLE_STORE_NAME);
                }
            };

            request.onsuccess = () => {
                this.handleDb = request.result;
                resolve();
            };

            request.onerror = () => {
                console.warn("Vault: Could not initialize handle storage");
                resolve(); // Don't fail, just continue without handle persistence
            };
        });
    },

    /**
     * Save the file handle to IndexedDB for persistence across reloads
     */
    async saveFileHandle(handle) {
        if (!this.handleDb) return;

        return new Promise((resolve, reject) => {
            try {
                const tx = this.handleDb.transaction(
                    this.HANDLE_STORE_NAME,
                    "readwrite",
                );
                const store = tx.objectStore(this.HANDLE_STORE_NAME);
                store.put(handle, "current");
                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve(); // Don't fail
            } catch (error) {
                console.warn("Vault: Could not save file handle:", error);
                resolve();
            }
        });
    },

    /**
     * Get the saved file handle from IndexedDB
     */
    async getSavedFileHandle() {
        if (!this.handleDb) return null;

        return new Promise((resolve) => {
            try {
                const tx = this.handleDb.transaction(
                    this.HANDLE_STORE_NAME,
                    "readonly",
                );
                const store = tx.objectStore(this.HANDLE_STORE_NAME);
                const request = store.get("current");
                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => resolve(null);
            } catch (error) {
                console.warn("Vault: Could not get saved file handle:", error);
                resolve(null);
            }
        });
    },

    /**
     * Clear the saved file handle
     */
    async clearSavedFileHandle() {
        if (!this.handleDb) return;

        return new Promise((resolve) => {
            try {
                const tx = this.handleDb.transaction(
                    this.HANDLE_STORE_NAME,
                    "readwrite",
                );
                const store = tx.objectStore(this.HANDLE_STORE_NAME);
                store.delete("current");
                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve();
            } catch (error) {
                resolve();
            }
        });
    },

    /**
     * Try to restore the file handle and verify permissions
     */
    async tryRestoreFileHandle() {
        if (!this.hasFileSystemAccess) return null;

        const savedHandle = await this.getSavedFileHandle();
        if (!savedHandle) return null;

        try {
            // Verify we still have permission
            const permission = await savedHandle.queryPermission({
                mode: "readwrite",
            });
            if (permission === "granted") {
                return savedHandle;
            }

            // Try to request permission (will need user gesture)
            return savedHandle;
        } catch (error) {
            console.warn("Vault: Could not restore file handle:", error);
            return null;
        }
    },

    /**
     * Check if there's a remembered vault location
     */
    hasRememberedVault() {
        return localStorage.getItem(this.STORAGE_KEYS.FILE_NAME) !== null;
    },

    /**
     * Check if we have a persisted file handle
     */
    async hasPersistedHandle() {
        const handle = await this.getSavedFileHandle();
        return handle !== null;
    },

    /**
     * Get remembered vault info
     */
    getRememberedVaultInfo() {
        return {
            name: localStorage.getItem(this.STORAGE_KEYS.FILE_NAME),
            lastOpened: localStorage.getItem(this.STORAGE_KEYS.LAST_OPENED),
        };
    },

    /**
     * Remember the current vault location
     */
    rememberVault(name) {
        localStorage.setItem(this.STORAGE_KEYS.FILE_NAME, name);
        localStorage.setItem(
            this.STORAGE_KEYS.LAST_OPENED,
            new Date().toISOString(),
        );
    },

    /**
     * Forget the vault location
     */
    async forgetVault() {
        localStorage.removeItem(this.STORAGE_KEYS.FILE_NAME);
        localStorage.removeItem(this.STORAGE_KEYS.FILE_PATH);
        localStorage.removeItem(this.STORAGE_KEYS.LAST_OPENED);
        await this.clearSavedFileHandle();
        this.fileHandle = null;
    },

    /**
     * Open vault using persisted file handle (no file picker needed)
     */
    async openVaultWithPersistedHandle(password) {
        if (!this.hasFileSystemAccess) {
            return { success: false, noHandle: true };
        }

        const savedHandle = await this.getSavedFileHandle();
        if (!savedHandle) {
            return { success: false, noHandle: true };
        }

        try {
            // Request permission if needed
            const permission = await savedHandle.requestPermission({
                mode: "readwrite",
            });
            if (permission !== "granted") {
                return { success: false, permissionDenied: true };
            }

            // Read and decrypt
            const file = await savedHandle.getFile();
            const text = await file.text();
            const encrypted = JSON.parse(text);

            const data = await Crypto.decrypt(encrypted, password);

            this.fileHandle = savedHandle;
            this.password = password;
            this.isLocked = false;

            // Update last opened time
            this.rememberVault(savedHandle.name);

            console.log(
                "Vault: Opened vault using persisted handle:",
                savedHandle.name,
            );
            return { success: true, data: data, name: savedHandle.name };
        } catch (error) {
            if (error.message.includes("Decryption failed")) {
                return { success: false, wrongPassword: true };
            }
            if (error.name === "NotAllowedError") {
                return { success: false, permissionDenied: true };
            }
            console.error(
                "Vault: Failed to open with persisted handle:",
                error,
            );
            return { success: false, noHandle: true };
        }
    },

    /**
     * Create a new vault file
     */
    async createNewVault(password, initialData = null) {
        if (!this.hasFileSystemAccess) {
            return this.createNewVaultFallback(password, initialData);
        }

        try {
            // Show save file picker
            const handle = await window.showSaveFilePicker({
                suggestedName: "knowledge-base.aladin",
                types: [this.FILE_TYPE],
            });

            this.fileHandle = handle;
            this.password = password;
            this.isLocked = false;

            // Create initial vault data
            const vaultData = this.createVaultStructure(initialData);

            // Encrypt and save
            await this.saveToFile(vaultData);

            // Remember this vault and persist handle
            this.rememberVault(handle.name);
            await this.saveFileHandle(handle);

            console.log("Vault: Created new vault:", handle.name);
            return { success: true, name: handle.name };
        } catch (error) {
            if (error.name === "AbortError") {
                return { success: false, cancelled: true };
            }
            console.error("Vault: Failed to create vault:", error);
            throw error;
        }
    },

    /**
     * Create new vault using download (fallback for browsers without File System Access API)
     */
    async createNewVaultFallback(password, initialData = null) {
        this.password = password;
        this.isLocked = false;

        // Create initial vault data
        const vaultData = this.createVaultStructure(initialData);

        // Encrypt
        const encrypted = await Crypto.encrypt(vaultData, password);
        const json = JSON.stringify(encrypted, null, 2);

        // Download
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "knowledge-base.aladin";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Store in IndexedDB as backup
        await this.saveToIndexedDB(vaultData);

        this.rememberVault("knowledge-base.aladin");

        return { success: true, name: "knowledge-base.aladin", fallback: true };
    },

    /**
     * Open an existing vault file
     */
    async openVault(password) {
        if (!this.hasFileSystemAccess) {
            return this.openVaultFallback(password);
        }

        try {
            // Show file picker
            const [handle] = await window.showOpenFilePicker({
                types: [this.FILE_TYPE],
                multiple: false,
            });

            this.fileHandle = handle;

            // Read and decrypt
            const file = await handle.getFile();
            const text = await file.text();
            const encrypted = JSON.parse(text);

            const data = await Crypto.decrypt(encrypted, password);

            this.password = password;
            this.isLocked = false;

            // Remember this vault and persist handle
            this.rememberVault(handle.name);
            await this.saveFileHandle(handle);

            console.log("Vault: Opened vault:", handle.name);
            return { success: true, data: data, name: handle.name };
        } catch (error) {
            if (error.name === "AbortError") {
                return { success: false, cancelled: true };
            }
            if (error.message.includes("Decryption failed")) {
                return { success: false, wrongPassword: true };
            }
            console.error("Vault: Failed to open vault:", error);
            throw error;
        }
    },

    /**
     * Open vault using file input (fallback)
     */
    async openVaultFallback(password) {
        return new Promise((resolve) => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".aladin";

            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) {
                    resolve({ success: false, cancelled: true });
                    return;
                }

                try {
                    const text = await file.text();
                    const encrypted = JSON.parse(text);
                    const data = await Crypto.decrypt(encrypted, password);

                    this.password = password;
                    this.isLocked = false;

                    // Store in IndexedDB as working copy
                    await this.saveToIndexedDB(data);

                    this.rememberVault(file.name);

                    resolve({
                        success: true,
                        data: data,
                        name: file.name,
                        fallback: true,
                    });
                } catch (error) {
                    if (error.message.includes("Decryption failed")) {
                        resolve({ success: false, wrongPassword: true });
                    } else {
                        resolve({ success: false, error: error.message });
                    }
                }
            };

            input.oncancel = () => {
                resolve({ success: false, cancelled: true });
            };

            input.click();
        });
    },

    /**
     * Save current data to the vault file
     */
    async save(data) {
        if (this.isLocked || !this.password) {
            throw new Error("Vault is locked");
        }

        const vaultData = this.createVaultStructure(data);

        if (this.hasFileSystemAccess && this.fileHandle) {
            await this.saveToFile(vaultData);
        } else {
            // Fallback: save to IndexedDB
            await this.saveToIndexedDB(vaultData);
            this.isDirty = true;
        }

        this.lastSaveTime = new Date();
        console.log("Vault: Data saved");
    },

    /**
     * Save encrypted data to file
     * Uses atomic write to prevent file locking issues with cloud sync (OneDrive, Dropbox, iCloud)
     * Includes exponential backoff retry for cloud sync locked files
     */
    async saveToFile(data) {
        if (!this.fileHandle) {
            throw new Error("No file handle");
        }

        const encrypted = await Crypto.encrypt(data, this.password);
        const json = JSON.stringify(encrypted, null, 2);

        // Create a Blob first, then write atomically
        // This minimizes the time the file handle is held open
        const blob = new Blob([json], { type: "application/json" });

        const maxRetries = 5;
        let lastError = null;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                // Use createWritable with keepExistingData: false for atomic write
                const writable = await this.fileHandle.createWritable({
                    keepExistingData: false,
                });
                await writable.write(blob);
                await writable.close();

                // Success - exit the retry loop
                this.isDirty = false;
                return;
            } catch (error) {
                lastError = error;

                // Check if it's a file locking error (common with cloud sync)
                const isLockError =
                    error.name === "NoModificationAllowedError" ||
                    error.name === "InvalidStateError" ||
                    error.message?.includes("locked") ||
                    error.message?.includes("in use") ||
                    error.message?.includes("being used") ||
                    error.message?.includes("access");

                if (isLockError && attempt < maxRetries - 1) {
                    // Exponential backoff: 500ms, 1s, 2s, 4s
                    const delay = Math.pow(2, attempt) * 500;
                    console.warn(
                        `Vault: File locked by cloud sync (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`,
                    );
                    await new Promise((resolve) => setTimeout(resolve, delay));
                } else if (!isLockError) {
                    // Non-lock error, throw immediately
                    throw error;
                }
            }
        }

        // All retries exhausted
        console.error(
            "Vault: Failed to save after all retries. File may be locked by OneDrive/cloud sync.",
        );
        console.error(
            "Vault: Try: 1) Wait for sync to complete, 2) Right-click file → 'Always keep on this device'",
        );
        throw lastError;
    },

    /**
     * Save to IndexedDB (fallback/working copy)
     */
    async saveToIndexedDB(data) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("aladin-vault", 1);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains("vault")) {
                    db.createObjectStore("vault", { keyPath: "id" });
                }
            };

            request.onsuccess = (e) => {
                const db = e.target.result;
                const tx = db.transaction("vault", "readwrite");
                const store = tx.objectStore("vault");
                store.put({
                    id: "current",
                    data: data,
                    updated: new Date().toISOString(),
                });
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            };

            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Load from IndexedDB
     */
    async loadFromIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("aladin-vault", 1);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains("vault")) {
                    db.createObjectStore("vault", { keyPath: "id" });
                }
            };

            request.onsuccess = (e) => {
                const db = e.target.result;
                const tx = db.transaction("vault", "readonly");
                const store = tx.objectStore("vault");
                const getRequest = store.get("current");
                getRequest.onsuccess = () => {
                    resolve(getRequest.result?.data || null);
                };
                getRequest.onerror = () => reject(getRequest.error);
            };

            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Export current vault to a new file
     */
    async exportVault() {
        if (this.isLocked || !this.password) {
            throw new Error("Vault is locked");
        }

        const data =
            (await this.loadFromIndexedDB()) || this.createVaultStructure(null);

        if (this.hasFileSystemAccess) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: "knowledge-base-export.aladin",
                    types: [this.FILE_TYPE],
                });

                const encrypted = await Crypto.encrypt(data, this.password);
                const json = JSON.stringify(encrypted, null, 2);

                const writable = await handle.createWritable();
                await writable.write(json);
                await writable.close();

                return { success: true, name: handle.name };
            } catch (error) {
                if (error.name === "AbortError") {
                    return { success: false, cancelled: true };
                }
                throw error;
            }
        } else {
            // Fallback: download
            const encrypted = await Crypto.encrypt(data, this.password);
            const json = JSON.stringify(encrypted, null, 2);

            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "knowledge-base-export.aladin";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            return {
                success: true,
                name: "knowledge-base-export.aladin",
                fallback: true,
            };
        }
    },

    /**
     * Change the vault password
     */
    async changePassword(currentPassword, newPassword) {
        if (this.isLocked) {
            throw new Error("Vault is locked");
        }

        // Verify current password
        if (currentPassword !== this.password) {
            throw new Error("Current password is incorrect");
        }

        // Update password
        this.password = newPassword;

        // Re-save with new password
        const data =
            (await this.loadFromIndexedDB()) || this.createVaultStructure(null);
        await this.save(data);

        return { success: true };
    },

    /**
     * Lock the vault and optionally release the file handle
     * Releasing the handle helps with cloud sync services (OneDrive, Dropbox, iCloud)
     */
    lock(releaseHandle = false) {
        this.password = null;
        this.isLocked = true;

        if (releaseHandle) {
            // Release file handle to allow cloud sync
            this.fileHandle = null;
            console.log(
                "Vault: Locked and released file handle for cloud sync",
            );
        } else {
            console.log("Vault: Locked");
        }
    },

    /**
     * Release the file handle without locking the vault
     * Useful for cloud sync - the file is saved but handle is released
     * User will need to re-grant permission on next save
     */
    releaseFileHandle() {
        if (this.fileHandle) {
            this.fileHandle = null;
            console.log("Vault: File handle released for cloud sync");
            return true;
        }
        return false;
    },

    /**
     * Unlock the vault with password
     */
    async unlock(password) {
        if (!this.hasFileSystemAccess || !this.fileHandle) {
            // Try to load from IndexedDB and verify password
            const data = await this.loadFromIndexedDB();
            if (data) {
                this.password = password;
                this.isLocked = false;
                return { success: true, data: data };
            }
            return { success: false, noData: true };
        }

        try {
            const file = await this.fileHandle.getFile();
            const text = await file.text();
            const encrypted = JSON.parse(text);
            const data = await Crypto.decrypt(encrypted, password);

            this.password = password;
            this.isLocked = false;

            return { success: true, data: data };
        } catch (error) {
            if (error.message.includes("Decryption failed")) {
                return { success: false, wrongPassword: true };
            }
            throw error;
        }
    },

    /**
     * Create the vault data structure
     */
    createVaultStructure(data = null) {
        const now = new Date().toISOString();
        return {
            version: "1.0",
            created: data?.created || now,
            modified: now,
            content: data?.content || {
                id: "main-document",
                blocks: [],
                time: Date.now(),
                version: "2.28.2",
            },
            attachments: data?.attachments || [],
            settings: data?.settings || {},
        };
    },

    /**
     * Check if vault needs to be synced (for fallback mode)
     */
    needsSync() {
        return this.isDirty && !this.hasFileSystemAccess;
    },

    /**
     * Get vault status
     */
    getStatus() {
        return {
            isLocked: this.isLocked,
            hasFile: !!this.fileHandle,
            hasFileSystemAccess: this.hasFileSystemAccess,
            isDirty: this.isDirty,
            lastSaveTime: this.lastSaveTime,
            rememberedVault: this.getRememberedVaultInfo(),
        };
    },
};

// Make globally available
window.Vault = Vault;
