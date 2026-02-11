/**
 * App - Main application entry point with vault integration
 */

const App = {
    isInitialized: false,

    // Demo mode constants for testing
    DEMO_MODE: false,
    DEMO_PASSWORD: "demo-test-password-123",

    /**
     * Initialize the application
     */
    async init() {
        console.log("Initializing Aladin...");

        // Check for demo mode via URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        this.DEMO_MODE = urlParams.get("demo") === "true";

        if (this.DEMO_MODE) {
            console.log("Demo mode enabled - using demo password");
        }

        try {
            // Initialize modal system first
            Modal.init();
            console.log("Modal system ready");

            // Initialize vault system
            await Vault.init();
            console.log("Vault system ready");

            // Initialize IndexedDB storage (for working data)
            await Storage.init();
            console.log("Storage ready");

            // Check if we need to show startup dialog
            await this.handleStartup();
        } catch (error) {
            console.error("Failed to initialize Aladin:", error);
            Modal.show({
                title: "Error",
                allowClose: false,
                body: `<p class="error-text">Failed to initialize application: ${error.message}</p>`,
                footer: `<button class="btn btn-primary" onclick="location.reload()">Reload</button>`,
            });
        }
    },

    /**
     * Handle application startup - check for vault and show appropriate dialog
     */
    async handleStartup() {
        // In demo mode, skip vault selection and initialize with demo data
        if (this.DEMO_MODE) {
            await this.initializeDemoMode();
            return;
        }

        const hasRemembered = Vault.hasRememberedVault();
        const vaultInfo = Vault.getRememberedVaultInfo();
        const hasPersistedHandle = await Vault.hasPersistedHandle();

        if (hasRemembered) {
            // Show password prompt for existing vault
            // If we have a persisted handle, user won't need to select file again
            await this.promptForPassword(vaultInfo.name, hasPersistedHandle);
        } else {
            // Show welcome dialog for new users
            await this.showWelcomeDialog();
        }
    },

    /**
     * Initialize in demo mode for testing
     * Bypasses vault creation/password prompt and uses demo credentials
     */
    async initializeDemoMode() {
        console.log("Initializing demo mode...");

        // Set demo password in Vault for storage operations
        Vault.password = this.DEMO_PASSWORD;
        Vault.isLocked = false;

        // Initialize with null data (will use default content)
        await this.initializeWithData(null);

        console.log("Demo mode initialized successfully");
    },

    /**
     * Show welcome dialog for new users
     */
    async showWelcomeDialog() {
        Modal.show({
            title: "🔐 Welcome to Aladin",
            allowClose: false,
            body: `
                <div class="welcome-modal">
                    <p class="welcome-text">
                        Your secure, local knowledge base with encrypted storage.
                    </p>
                    <div class="welcome-options">
                        <button class="btn btn-primary btn-large" id="btn-open-vault">
                            📂 Open Existing Vault
                        </button>
                        <button class="btn btn-secondary btn-large" id="btn-create-vault">
                            ✨ Create New Vault
                        </button>
                    </div>
                    <p class="welcome-hint">
                        All your data is stored in a single encrypted file that you can sync across devices.
                    </p>
                </div>
            `,
            footer: "",
        });

        // Setup handlers
        return new Promise((resolve) => {
            setTimeout(() => {
                document
                    .getElementById("btn-open-vault")
                    ?.addEventListener("click", async () => {
                        Modal.hide();
                        await this.handleOpenVault();
                        resolve();
                    });
                document
                    .getElementById("btn-create-vault")
                    ?.addEventListener("click", async () => {
                        Modal.hide();
                        await this.handleCreateVault();
                        resolve();
                    });
            }, 0);
        });
    },

    /**
     * Prompt for password to unlock existing vault
     * If we have a persisted file handle, user won't need to select file again
     */
    async promptForPassword(vaultName, hasPersistedHandle = false) {
        const hasFileSystemAccess = Vault.hasFileSystemAccess;
        const canAutoOpen = hasFileSystemAccess && hasPersistedHandle;

        Modal.show({
            title: "🔐 Unlock Vault",
            allowClose: true,
            body: `
                <div class="password-modal">
                    <p class="vault-name">Vault: <strong>${Utils.escapeHtml(vaultName)}</strong></p>
                    ${!canAutoOpen && hasFileSystemAccess
                    ? `
                    <p class="modal-hint" style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
                        For security, you'll need to select your vault file and enter your password.
                    </p>
                    `
                    : canAutoOpen
                        ? `
                    <p class="modal-hint" style="font-size: 13px; color: var(--accent-hover); margin-bottom: 16px;">
                        ✓ Vault file remembered - just enter your password!
                    </p>
                    `
                        : ""
                }
                    <div class="form-group">
                        <label for="vault-password">Password</label>
                        <div class="password-input-wrapper">
                            <input type="password" id="vault-password" placeholder="Enter your password" autocomplete="current-password" />
                            <button type="button" class="btn-toggle-password" aria-label="Toggle password visibility">👁</button>
                        </div>
                    </div>
                    <div class="form-hint">
                        <button type="button" class="btn-link" id="btn-forget-vault">Use a different vault...</button>
                    </div>
                </div>
            `,
            footer: `
                <button class="btn btn-primary" id="btn-unlock">${canAutoOpen ? "Unlock" : "Select & Unlock"}</button>
            `,
            onClose: () => { },
        });

        // Return a promise that resolves when action is taken
        return new Promise((resolve) => {
            setTimeout(() => {
                const passwordInput = document.getElementById("vault-password");
                const unlockBtn = document.getElementById("btn-unlock");
                const toggleBtn = document.querySelector(
                    ".btn-toggle-password",
                );
                const forgetBtn = document.getElementById("btn-forget-vault");

                // Focus password input
                passwordInput?.focus();

                // Toggle password visibility
                toggleBtn?.addEventListener("click", () => {
                    const type =
                        passwordInput.type === "password" ? "text" : "password";
                    passwordInput.type = type;
                    toggleBtn.textContent = type === "password" ? "👁" : "🙈";
                });

                // Forget vault handler
                forgetBtn?.addEventListener("click", async () => {
                    Modal.hide();
                    await Vault.forgetVault();
                    await this.showWelcomeDialog();
                    resolve();
                });

                // Unlock handler
                const handleUnlock = async () => {
                    const password = passwordInput.value;
                    if (!password) {
                        Modal.showError("Please enter a password");
                        return;
                    }

                    unlockBtn.disabled = true;
                    unlockBtn.textContent = "Opening...";

                    try {
                        let openResult;

                        // Try to use persisted handle first
                        if (canAutoOpen) {
                            openResult =
                                await Vault.openVaultWithPersistedHandle(
                                    password,
                                );

                            // If persisted handle failed (permission denied, file moved, etc.)
                            // Fall back to file picker
                            if (
                                !openResult.success &&
                                (openResult.noHandle ||
                                    openResult.permissionDenied)
                            ) {
                                console.log(
                                    "Vault: Persisted handle unavailable, falling back to file picker",
                                );
                                openResult = await Vault.openVault(password);
                            }
                        } else {
                            // Open vault (will prompt for file selection)
                            openResult = await Vault.openVault(password);
                        }

                        if (openResult.cancelled) {
                            // User cancelled file picker
                            unlockBtn.disabled = false;
                            unlockBtn.textContent = canAutoOpen
                                ? "Unlock"
                                : "Select & Unlock";
                            return;
                        }

                        if (openResult.wrongPassword) {
                            Modal.showError(
                                "Incorrect password. Please try again.",
                            );
                            passwordInput.value = "";
                            passwordInput.focus();
                            unlockBtn.disabled = false;
                            unlockBtn.textContent = canAutoOpen
                                ? "Unlock"
                                : "Select & Unlock";
                            return;
                        }

                        if (openResult.success) {
                            Modal.hide();
                            await this.initializeWithData(openResult.data);
                            resolve();
                        }
                    } catch (error) {
                        Modal.showError(
                            "Failed to open vault: " + error.message,
                        );
                        unlockBtn.disabled = false;
                        unlockBtn.textContent = canAutoOpen
                            ? "Unlock"
                            : "Select & Unlock";
                    }
                };

                unlockBtn?.addEventListener("click", handleUnlock);
                passwordInput?.addEventListener("keypress", (e) => {
                    if (e.key === "Enter") handleUnlock();
                });
            }, 0);
        });
    },

    /**
     * Handle creating a new vault
     */
    async handleCreateVault() {
        const result = await Modal.showCreateVault({
            onSubmit: async (password) => {
                const createResult = await Vault.createNewVault(password, null);
                return createResult;
            },
        });

        if (result.cancelled) {
            await this.showWelcomeDialog();
            return;
        }

        if (result.success) {
            // Initialize with empty data
            await this.initializeWithData(null);
        }
    },

    /**
     * Handle opening an existing vault from welcome screen
     */
    async handleOpenVault() {
        Modal.show({
            title: "🔐 Open Vault",
            allowClose: true,
            body: `
                <div class="password-modal">
                    <p class="modal-hint" style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
                        Enter your password, then select your .aladin vault file.
                    </p>
                    <div class="form-group">
                        <label for="open-vault-password">Password</label>
                        <div class="password-input-wrapper">
                            <input type="password" id="open-vault-password" placeholder="Enter your password" autocomplete="current-password" />
                            <button type="button" class="btn-toggle-password" aria-label="Toggle password visibility">👁</button>
                        </div>
                    </div>
                </div>
            `,
            footer: `
                <button class="btn btn-secondary" id="btn-cancel-open">Cancel</button>
                <button class="btn btn-primary" id="btn-select-open">Select Vault File</button>
            `,
            onClose: () => { },
        });

        return new Promise((resolve) => {
            setTimeout(() => {
                const passwordInput = document.getElementById(
                    "open-vault-password",
                );
                const selectBtn = document.getElementById("btn-select-open");
                const cancelBtn = document.getElementById("btn-cancel-open");
                const toggleBtn = document.querySelector(
                    ".btn-toggle-password",
                );

                // Toggle password visibility
                toggleBtn?.addEventListener("click", () => {
                    const type =
                        passwordInput.type === "password" ? "text" : "password";
                    passwordInput.type = type;
                    toggleBtn.textContent = type === "password" ? "👁" : "🙈";
                });

                // Cancel handler
                cancelBtn?.addEventListener("click", async () => {
                    Modal.hide();
                    await this.showWelcomeDialog();
                    resolve();
                });

                // Select and open handler
                const handleSelect = async () => {
                    const password = passwordInput.value;
                    if (!password) {
                        Modal.showError("Please enter a password");
                        return;
                    }

                    selectBtn.disabled = true;
                    selectBtn.textContent = "Opening...";

                    try {
                        const openResult = await Vault.openVault(password);

                        if (openResult.cancelled) {
                            selectBtn.disabled = false;
                            selectBtn.textContent = "Select Vault File";
                            return;
                        }

                        if (openResult.wrongPassword) {
                            Modal.showError(
                                "Incorrect password. Please try again.",
                            );
                            passwordInput.value = "";
                            passwordInput.focus();
                            selectBtn.disabled = false;
                            selectBtn.textContent = "Select Vault File";
                            return;
                        }

                        if (openResult.success) {
                            Modal.hide();
                            await this.initializeWithData(openResult.data);
                            resolve();
                        }
                    } catch (error) {
                        Modal.showError(
                            "Failed to open vault: " + error.message,
                        );
                        selectBtn.disabled = false;
                        selectBtn.textContent = "Select Vault File";
                    }
                };

                selectBtn?.addEventListener("click", handleSelect);
                passwordInput?.addEventListener("keypress", (e) => {
                    if (e.key === "Enter") handleSelect();
                });
            }, 0);
        });
    },

    /**
     * Initialize the application with vault data
     */
    async initializeWithData(vaultData) {
        Modal.showLoading("Loading your knowledge base...");

        try {
            // Load vault data into IndexedDB
            if (vaultData) {
                await Storage.loadFromVault(vaultData);
            }

            // Add vault controls to UI (creates theme-toggle)
            this.addVaultControls();

            // Initialize sidebar
            Sidebar.init();
            console.log("Sidebar ready");

            // Initialize editor
            await Editor.init();
            console.log("Editor ready");

            // Setup global functions
            this.setupGlobalFunctions();

            // Initialize AI system
            await this.initializeAI();

            // Hide modal
            Modal.hide();

            this.isInitialized = true;
            console.log("Aladin initialized successfully");
        } catch (error) {
            console.error("Failed to initialize with data:", error);
            Modal.hide();
            throw error;
        }
    },

    /**
     * Initialize the AI/RAG system
     */
    async initializeAI() {
        try {
            // Initialize AI system (loads config from storage)
            await AI.init();

            // Initialize chat UI
            AIChat.init();
            console.log("AI system ready");
        } catch (error) {
            console.warn("AI initialization warning:", error);
            // AI is optional, don't fail app initialization
        }
    },

    /**
     * Add vault control buttons to the UI
     */
    addVaultControls() {
        // Create footer controls at bottom of sidebar
        const sidebar = document.getElementById("sidebar");
        if (sidebar) {
            const footerDiv = document.createElement("div");
            footerDiv.className = "sidebar-footer";
            footerDiv.innerHTML = `
                <button class="sidebar-action-btn" id="theme-toggle" title="Toggle theme">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                </button>
                <button class="sidebar-action-btn" id="btn-vault-settings" title="Vault Settings">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                </button>
            `;
            sidebar.appendChild(footerDiv);

            // Setup handlers
            document
                .getElementById("btn-vault-settings")
                ?.addEventListener("click", () => {
                    this.showVaultSettings();
                });
        }
    },

    /**
     * Show vault settings modal
     */
    showVaultSettings() {
        Modal.showVaultSettings({
            onExport: async () => {
                const result = await Vault.exportVault();
                if (result.success) {
                    Modal.showSuccess("Vault exported successfully");
                }
            },
            onChangePassword: async () => {
                Modal.hide();
                await Modal.showChangePassword(async (current, newPass) => {
                    return await Vault.changePassword(current, newPass);
                });
            },
            onLock: () => {
                this.lockVault();
            },
        });
    },

    /**
     * Lock the vault and show password prompt
     */
    async lockVault() {
        // Check for persisted handle before locking
        const hasPersistedHandle = await Vault.hasPersistedHandle();

        // Save current data first
        await Storage.saveToVault();

        // Lock the vault
        Vault.lock();

        // Clear IndexedDB
        await Storage.clearAll();

        // Show password prompt with persisted handle flag
        const vaultInfo = Vault.getRememberedVaultInfo();
        await this.promptForPassword(vaultInfo.name, hasPersistedHandle);
    },

    /**
     * Setup global functions for console access and future integration
     */
    setupGlobalFunctions() {
        // Export data to JSON (for later integration)
        window.exportData = async () => {
            const data = await Storage.exportData();
            console.log("Export data:", data);
            return data;
        };

        // Download export as file (uses vault export now)
        window.downloadExport = async () => {
            const result = await Vault.exportVault();
            if (result.success) {
                console.log("Vault exported:", result.name);
            }
        };

        // Import data from JSON
        window.importData = async (jsonData) => {
            if (typeof jsonData === "string") {
                jsonData = JSON.parse(jsonData);
            }
            await Storage.importData(jsonData);
            // Save to vault
            await Storage.saveToVault();
            // Reload the page to reflect changes
            window.location.reload();
        };

        // Clear all data
        window.clearAllData = async () => {
            if (
                confirm(
                    "Are you sure you want to clear all data? This cannot be undone.",
                )
            ) {
                await Storage.clearAll();
                window.location.reload();
            }
        };

        // Get current editor content
        window.getContent = async () => {
            return await Editor.getContent();
        };

        // Get all attachments
        window.getAttachments = async () => {
            return await Storage.getAllAttachments();
        };

        // Lock vault
        window.lockVault = () => {
            this.lockVault();
        };

        // Get vault status
        window.getVaultStatus = () => {
            return Vault.getStatus();
        };

        // Release vault handle for cloud sync
        window.releaseVaultHandle = async () => {
            if (Vault.isLocked) {
                console.log("Vault is already locked");
                return false;
            }
            await Storage.saveToVault();
            Vault.releaseFileHandle();
            console.log("File handle released - cloud sync can now proceed");
            return true;
        };

        console.log("Available functions:");
        console.log("  exportData() - Get all data as JSON");
        console.log("  downloadExport() - Export vault to file");
        console.log("  importData(json) - Import data from JSON");
        console.log("  clearAllData() - Clear all stored data");
        console.log("  getContent() - Get current editor content");
        console.log("  getAttachments() - Get all attachments");
        console.log("  lockVault() - Lock the vault");
        console.log("  getVaultStatus() - Get vault status");
        console.log(
            "  releaseVaultHandle() - Release file handle for cloud sync",
        );
    },
};

// Start the app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    App.init();
});

// Save before unload and release handle for cloud sync
window.addEventListener("beforeunload", async (e) => {
    if (App.isInitialized && !Vault.isLocked) {
        if (Vault.hasFileSystemAccess && Vault.fileHandle) {
            // File System Access API: save directly to file
            await Storage.saveToVault();
            // Release handle so cloud sync can work after tab closes
            Vault.releaseFileHandle();
        } else {
            // Fallback mode: save to IndexedDB (download requires user gesture, can't do on unload)
            await Storage.saveToVault();
        }
    }
});

// Save when tab becomes hidden (helps ensure data is saved before switching apps)
document.addEventListener("visibilitychange", () => {
    if (
        document.visibilityState === "hidden" &&
        App.isInitialized &&
        !Vault.isLocked
    ) {
        // User switched away - save data
        Storage.saveToVault()
            .then(() => {
                console.log("Vault: Saved on visibility change");
            })
            .catch((err) => {
                console.warn(
                    "Vault: Could not save on visibility change:",
                    err,
                );
            });
    }
});

// Make App globally available
window.App = App;
