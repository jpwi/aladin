/**
 * Modal - Reusable modal dialog system for vault operations
 */

const Modal = {
    container: null,
    activeModal: null,

    /**
     * Initialize the modal system
     */
    init() {
        // Create modal container
        this.container = document.createElement("div");
        this.container.id = "modal-container";
        this.container.className = "modal-overlay hidden";
        this.container.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title"></h2>
                    <button class="modal-close" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body"></div>
                <div class="modal-footer"></div>
            </div>
        `;
        document.body.appendChild(this.container);

        // Close button handler
        this.container
            .querySelector(".modal-close")
            .addEventListener("click", () => {
                if (this.activeModal?.allowClose !== false) {
                    this.hide();
                }
            });

        // Click outside to close - but not on input focus/selection
        this.container.addEventListener("mousedown", (e) => {
            // Only close if clicking on the overlay itself (not modal content)
            // and not when interacting with inputs
            if (
                e.target === this.container &&
                this.activeModal?.allowClose !== false &&
                !this.activeModal?.preventClickClose
            ) {
                // Delay to allow input selection
                this.pendingClose = true;
            }
        });

        this.container.addEventListener("mouseup", (e) => {
            if (
                this.pendingClose &&
                e.target === this.container &&
                this.activeModal?.allowClose !== false &&
                !this.activeModal?.preventClickClose
            ) {
                this.hide();
            }
            this.pendingClose = false;
        });

        // Cancel close if mouse moves into modal
        this.container.addEventListener("mousemove", (e) => {
            if (e.target !== this.container) {
                this.pendingClose = false;
            }
        });

        // ESC key to close
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && this.activeModal?.allowClose !== false) {
                this.hide();
            }
        });
    },

    /**
     * Show a modal dialog
     */
    show(options) {
        this.activeModal = options;

        const title = this.container.querySelector(".modal-title");
        const body = this.container.querySelector(".modal-body");
        const footer = this.container.querySelector(".modal-footer");
        const closeBtn = this.container.querySelector(".modal-close");

        title.textContent = options.title || "";
        body.innerHTML = options.body || "";
        footer.innerHTML = options.footer || "";

        // Hide close button if not allowed
        closeBtn.style.display =
            options.allowClose === false ? "none" : "block";

        this.container.classList.remove("hidden");

        // Focus first input
        setTimeout(() => {
            const firstInput = body.querySelector("input");
            if (firstInput) firstInput.focus();
        }, 100);

        return this;
    },

    /**
     * Hide the modal
     */
    hide() {
        this.container.classList.add("hidden");
        if (this.activeModal?.onClose) {
            this.activeModal.onClose();
        }
        this.activeModal = null;
    },

    /**
     * Update modal content
     */
    updateBody(html) {
        this.container.querySelector(".modal-body").innerHTML = html;
    },

    /**
     * Show error message in modal
     */
    showError(message) {
        const existing = this.container.querySelector(".modal-error");
        if (existing) existing.remove();

        const error = document.createElement("div");
        error.className = "modal-error";
        error.textContent = message;

        const body = this.container.querySelector(".modal-body");
        body.insertBefore(error, body.firstChild);

        setTimeout(() => error.remove(), 5000);
    },

    /**
     * Show success message in modal
     */
    showSuccess(message) {
        const existing = this.container.querySelector(".modal-success");
        if (existing) existing.remove();

        const success = document.createElement("div");
        success.className = "modal-success";
        success.textContent = message;

        const body = this.container.querySelector(".modal-body");
        body.insertBefore(success, body.firstChild);

        setTimeout(() => success.remove(), 3000);
    },

    // ==========================================
    // Preset Modals
    // ==========================================

    /**
     * Show welcome/startup modal
     */
    showWelcome(callbacks) {
        return this.show({
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

        // Add handlers after showing
        setTimeout(() => {
            document
                .getElementById("btn-open-vault")
                ?.addEventListener("click", () => {
                    callbacks.onOpen?.();
                });
            document
                .getElementById("btn-create-vault")
                ?.addEventListener("click", () => {
                    callbacks.onCreate?.();
                });
        }, 0);
    },

    /**
     * Show password input modal for opening vault
     */
    showPasswordPrompt(options = {}) {
        const {
            title = "Enter Password",
            vaultName = "",
            onSubmit,
            onCancel,
            showOpenFile = true,
        } = options;

        return new Promise((resolve) => {
            this.show({
                title: title,
                allowClose: true,
                body: `
                    <div class="password-modal">
                        ${vaultName ? `<p class="vault-name">Vault: <strong>${Utils.escapeHtml(vaultName)}</strong></p>` : ""}
                        <div class="form-group">
                            <label for="vault-password">Password</label>
                            <div class="password-input-wrapper">
                                <input type="password" id="vault-password" placeholder="Enter your password" autocomplete="current-password" />
                                <button type="button" class="btn-toggle-password" aria-label="Toggle password visibility">👁</button>
                            </div>
                        </div>
                        ${
                            showOpenFile
                                ? `
                        <div class="form-hint">
                            <button type="button" class="btn-link" id="btn-select-file">Select different vault file...</button>
                        </div>
                        `
                                : ""
                        }
                    </div>
                `,
                footer: `
                    <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
                    <button class="btn btn-primary" id="btn-unlock">Unlock</button>
                `,
                onClose: () => {
                    resolve({ cancelled: true });
                },
            });

            // Setup handlers
            setTimeout(() => {
                const passwordInput = document.getElementById("vault-password");
                const unlockBtn = document.getElementById("btn-unlock");
                const cancelBtn = document.getElementById("btn-cancel");
                const toggleBtn = this.container.querySelector(
                    ".btn-toggle-password",
                );
                const selectFileBtn =
                    document.getElementById("btn-select-file");

                // Toggle password visibility
                toggleBtn?.addEventListener("click", () => {
                    const type =
                        passwordInput.type === "password" ? "text" : "password";
                    passwordInput.type = type;
                    toggleBtn.textContent = type === "password" ? "👁" : "🙈";
                });

                // Unlock handler
                const handleUnlock = async () => {
                    const password = passwordInput.value;
                    if (!password) {
                        this.showError("Please enter a password");
                        return;
                    }

                    unlockBtn.disabled = true;
                    unlockBtn.textContent = "Unlocking...";

                    try {
                        if (onSubmit) {
                            const result = await onSubmit(password);
                            if (result.success) {
                                // Clear onClose to prevent cancelled resolution
                                this.activeModal.onClose = null;
                                this.hide();
                                resolve({ success: true, password });
                            } else if (result.wrongPassword) {
                                this.showError(
                                    "Incorrect password. Please try again.",
                                );
                                passwordInput.value = "";
                                passwordInput.focus();
                            }
                        } else {
                            // Clear onClose to prevent cancelled resolution
                            this.activeModal.onClose = null;
                            this.hide();
                            resolve({ success: true, password });
                        }
                    } catch (error) {
                        this.showError(error.message);
                    }

                    unlockBtn.disabled = false;
                    unlockBtn.textContent = "Unlock";
                };

                unlockBtn?.addEventListener("click", handleUnlock);
                passwordInput?.addEventListener("keypress", (e) => {
                    if (e.key === "Enter") handleUnlock();
                });

                cancelBtn?.addEventListener("click", () => {
                    this.hide();
                    resolve({ cancelled: true });
                });

                selectFileBtn?.addEventListener("click", () => {
                    this.hide();
                    resolve({ selectFile: true });
                });
            }, 0);
        });
    },

    /**
     * Show create vault modal
     */
    showCreateVault(options = {}) {
        const { onSubmit } = options;

        return new Promise((resolve) => {
            this.show({
                title: "✨ Create New Vault",
                allowClose: true,
                body: `
                    <div class="create-vault-modal">
                        <p class="modal-description">
                            Create a password-protected vault to store your knowledge base.
                            Choose a strong password you can remember.
                        </p>
                        <p class="modal-hint" style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">
                            💡 <strong>Tip:</strong> After creating your vault, go to Settings → Security to set up a 24-word recovery phrase for backup access.
                        </p>
                        <div class="form-group">
                            <label for="new-password">Password</label>
                            <div class="password-input-wrapper">
                                <input type="password" id="new-password" placeholder="Create a strong password" autocomplete="new-password" />
                                <button type="button" class="btn-toggle-password" aria-label="Toggle password visibility">👁</button>
                            </div>
                            <div class="password-strength" id="password-strength"></div>
                        </div>
                        <div class="form-group">
                            <label for="confirm-password">Confirm Password</label>
                            <input type="password" id="confirm-password" placeholder="Confirm your password" autocomplete="new-password" />
                        </div>
                    </div>
                `,
                footer: `
                    <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
                    <button class="btn btn-primary" id="btn-create">Create Vault</button>
                `,
                onClose: () => {
                    resolve({ cancelled: true });
                },
            });

            // Setup handlers
            setTimeout(() => {
                const passwordInput = document.getElementById("new-password");
                const confirmInput =
                    document.getElementById("confirm-password");
                const strengthIndicator =
                    document.getElementById("password-strength");
                const createBtn = document.getElementById("btn-create");
                const cancelBtn = document.getElementById("btn-cancel");
                const toggleBtn = this.container.querySelector(
                    ".btn-toggle-password",
                );

                // Toggle password visibility
                toggleBtn?.addEventListener("click", () => {
                    const type =
                        passwordInput.type === "password" ? "text" : "password";
                    passwordInput.type = type;
                    confirmInput.type = type;
                    toggleBtn.textContent = type === "password" ? "👁" : "🙈";
                });

                // Password strength indicator
                passwordInput?.addEventListener("input", () => {
                    const password = passwordInput.value;
                    const strength = Crypto.getPasswordStrength(password);
                    const label = Crypto.getPasswordStrengthLabel(strength);
                    const colors = [
                        "#ff4444",
                        "#ff8800",
                        "#ffcc00",
                        "#88cc00",
                        "#44cc44",
                    ];

                    strengthIndicator.innerHTML = `
                        <div class="strength-bar">
                            <div class="strength-fill" style="width: ${(strength + 1) * 20}%; background-color: ${colors[strength]}"></div>
                        </div>
                        <span class="strength-label" style="color: ${colors[strength]}">${label}</span>
                    `;
                });

                // Create handler
                const handleCreate = async () => {
                    const password = passwordInput.value;
                    const confirm = confirmInput.value;

                    if (!password) {
                        this.showError("Please enter a password");
                        return;
                    }

                    if (password.length < 8) {
                        this.showError(
                            "Password must be at least 8 characters",
                        );
                        return;
                    }

                    if (password !== confirm) {
                        this.showError("Passwords do not match");
                        confirmInput.value = "";
                        confirmInput.focus();
                        return;
                    }

                    createBtn.disabled = true;
                    createBtn.textContent = "Creating...";

                    try {
                        if (onSubmit) {
                            const result = await onSubmit(password);
                            if (result.success) {
                                this.hide();
                                resolve({ success: true, password });
                            }
                        } else {
                            this.hide();
                            resolve({ success: true, password });
                        }
                    } catch (error) {
                        this.showError(error.message);
                    }

                    createBtn.disabled = false;
                    createBtn.textContent = "Create Vault";
                };

                createBtn?.addEventListener("click", handleCreate);
                confirmInput?.addEventListener("keypress", (e) => {
                    if (e.key === "Enter") handleCreate();
                });

                cancelBtn?.addEventListener("click", () => {
                    this.hide();
                    resolve({ cancelled: true });
                });
            }, 0);
        });
    },

    /**
     * Show vault settings modal
     */
    showVaultSettings(callbacks = {}) {
        const status = Vault.getStatus();

        this.show({
            title: "⚙️ Vault Settings",
            allowClose: true,
            body: `
                <div class="vault-settings-modal">
                    <div class="settings-section">
                        <h3>Current Vault</h3>
                        <p class="vault-info">
                            ${status.rememberedVault.name ? `<strong>${Utils.escapeHtml(status.rememberedVault.name)}</strong>` : "No vault selected"}
                        </p>
                        ${status.isDirty ? `<p class="warning-text">⚠️ Unsaved changes</p>` : ""}
                    </div>
                    
                    <div class="settings-section">
                        <h3>Security</h3>
                        <div class="settings-actions">
                            <button class="btn btn-secondary" id="btn-change-password">🔑 Change Password</button>
                            <button class="btn btn-secondary" id="btn-recovery">
                                ${callbacks.hasRecovery ? "🛡️ View Recovery Phrase" : "🛡️ Setup Recovery Phrase"}
                            </button>
                        </div>
                    </div>

                    <div class="settings-section">
                        <h3>Actions</h3>
                        <div class="settings-actions">
                            <button class="btn btn-secondary" id="btn-export">📤 Export Vault</button>
                            <button class="btn btn-secondary" id="btn-lock">🔒 Lock Vault</button>
                        </div>
                    </div>

                    <div class="settings-section">
                        <h3>Sync Status</h3>
                        <p class="sync-info">
                            ${
                                status.hasFileSystemAccess
                                    ? "✅ Direct file access enabled - changes save automatically"
                                    : "⚠️ Limited mode - export vault to sync across devices"
                            }
                        </p>
                    </div>
                </div>
            `,
            footer: `
                <button class="btn btn-primary" id="btn-close-settings">Close</button>
            `,
        });

        // Setup handlers
        setTimeout(() => {
            document
                .getElementById("btn-export")
                ?.addEventListener("click", () => {
                    callbacks.onExport?.();
                });
            document
                .getElementById("btn-change-password")
                ?.addEventListener("click", () => {
                    callbacks.onChangePassword?.();
                });
            document
                .getElementById("btn-recovery")
                ?.addEventListener("click", () => {
                    callbacks.onRecovery?.();
                });
            document
                .getElementById("btn-lock")
                ?.addEventListener("click", () => {
                    this.hide();
                    callbacks.onLock?.();
                });
            document
                .getElementById("btn-close-settings")
                ?.addEventListener("click", () => {
                    this.hide();
                });
        }, 0);
    },

    /**
     * Show recovery phrase modal
     */
    showRecoveryPhrase(phrase) {
        return this.show({
            title: "🛡️ Recovery Phrase",
            allowClose: true,
            body: `
                <div class="recovery-modal">
                    <p class="modal-description">
                        This is your backup key. If you lose your password, these 24 words are the ONLY way to unlock your vault.
                    </p>
                    <div class="recovery-phrase-display">
                        ${phrase.split(' ').map((word, i) => 
                            `<div class="recovery-word"><span class="word-num">${i+1}</span> ${word}</div>`
                        ).join('')}
                    </div>
                    <div class="warning-box">
                        ⚠️ Write these words down on paper and store them safely. Do not share them.
                    </div>
                </div>
            `,
            footer: `<button class="btn btn-primary" onclick="Modal.hide()">I have saved it</button>`
        });
    },

    /**
     * Show change password modal
     */
    showChangePassword(onSubmit) {
        return new Promise((resolve) => {
            this.show({
                title: "🔑 Change Password",
                allowClose: true,
                body: `
                    <div class="change-password-modal">
                        <div class="form-group">
                            <label for="current-password">Current Password</label>
                            <input type="password" id="current-password" placeholder="Enter current password" />
                        </div>
                        <div class="form-group">
                            <label for="new-password-change">New Password</label>
                            <input type="password" id="new-password-change" placeholder="Enter new password" />
                            <div class="password-strength" id="password-strength-change"></div>
                        </div>
                        <div class="form-group">
                            <label for="confirm-password-change">Confirm New Password</label>
                            <input type="password" id="confirm-password-change" placeholder="Confirm new password" />
                        </div>
                    </div>
                `,
                footer: `
                    <button class="btn btn-secondary" id="btn-cancel-change">Cancel</button>
                    <button class="btn btn-primary" id="btn-change">Change Password</button>
                `,
                onClose: () => resolve({ cancelled: true }),
            });

            setTimeout(() => {
                const currentInput =
                    document.getElementById("current-password");
                const newInput = document.getElementById("new-password-change");
                const confirmInput = document.getElementById(
                    "confirm-password-change",
                );
                const strengthIndicator = document.getElementById(
                    "password-strength-change",
                );
                const changeBtn = document.getElementById("btn-change");
                const cancelBtn = document.getElementById("btn-cancel-change");

                newInput?.addEventListener("input", () => {
                    const password = newInput.value;
                    const strength = Crypto.getPasswordStrength(password);
                    const label = Crypto.getPasswordStrengthLabel(strength);
                    const colors = [
                        "#ff4444",
                        "#ff8800",
                        "#ffcc00",
                        "#88cc00",
                        "#44cc44",
                    ];

                    strengthIndicator.innerHTML = `
                        <div class="strength-bar">
                            <div class="strength-fill" style="width: ${(strength + 1) * 20}%; background-color: ${colors[strength]}"></div>
                        </div>
                        <span class="strength-label" style="color: ${colors[strength]}">${label}</span>
                    `;
                });

                const handleChange = async () => {
                    const current = currentInput.value;
                    const newPass = newInput.value;
                    const confirm = confirmInput.value;

                    if (!current || !newPass || !confirm) {
                        this.showError("Please fill in all fields");
                        return;
                    }

                    if (newPass.length < 8) {
                        this.showError(
                            "New password must be at least 8 characters",
                        );
                        return;
                    }

                    if (newPass !== confirm) {
                        this.showError("New passwords do not match");
                        return;
                    }

                    changeBtn.disabled = true;
                    changeBtn.textContent = "Changing...";

                    try {
                        const result = await onSubmit(current, newPass);
                        if (result.success) {
                            this.showSuccess("Password changed successfully");
                            setTimeout(() => {
                                this.hide();
                                resolve({ success: true });
                            }, 1500);
                        }
                    } catch (error) {
                        this.showError(error.message);
                    }

                    changeBtn.disabled = false;
                    changeBtn.textContent = "Change Password";
                };

                changeBtn?.addEventListener("click", handleChange);
                cancelBtn?.addEventListener("click", () => {
                    this.hide();
                    resolve({ cancelled: true });
                });
            }, 0);
        });
    },

    /**
     * Show loading modal
     */
    showLoading(message = "Loading...") {
        return this.show({
            title: "",
            allowClose: false,
            body: `
                <div class="loading-modal">
                    <div class="loading-spinner"></div>
                    <p class="loading-text">${message}</p>
                </div>
            `,
            footer: "",
        });
    },
};

// Make globally available
window.Modal = Modal;
