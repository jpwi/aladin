/**
 * AI Chat - User interface for AI-powered knowledge base queries
 * Floating search bar design inspired by Gemini/Siri
 */

const AIChat = {
    container: null,
    isExpanded: false,
    isPanelOpen: false,
    chatHistory: [],
    lastQuery: null,
    lastAnswer: null,

    /**
     * Initialize the AI Chat UI
     */
    async init() {
        this.createChatUI();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        await this.loadHistory();
        this.setupAutoReindex();
        console.log("AIChat: Initialized");
    },

    /**
     * Setup global keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener("keydown", (e) => {
            // Shift+Space to focus search bar (all platforms)
            if (e.shiftKey && e.code === "Space") {
                e.preventDefault();
                this.focusSearchBar();
            }

            // Escape to close panel
            if (e.key === "Escape" && this.isPanelOpen) {
                this.closePanel();
            }
        });
    },

    /**
     * Focus the search bar and expand it
     */
    focusSearchBar() {
        const searchInput = document.getElementById("ai-search-input");
        if (searchInput) {
            this.expand();
            searchInput.focus();
        }
    },

    /**
     * Load chat history from storage
     */
    async loadHistory() {
        try {
            const saved = await Storage.getSetting("ai-chat-history", null);
            if (saved) {
                this.lastQuery = saved.query;
                this.lastAnswer = saved.answer;
                console.log("AIChat: History loaded");
                // Update button visibility after a short delay (DOM may not be ready)
                setTimeout(() => this.updateHistoryButton(), 100);
            }
        } catch (e) {
            console.warn("AIChat: Could not load history");
        }
    },

    /**
     * Save last query to history
     */
    async saveHistory(query, answer) {
        this.lastQuery = query;
        this.lastAnswer = answer;
        try {
            await Storage.saveSetting("ai-chat-history", { query, answer });
            this.updateHistoryButton();
        } catch (e) {
            console.warn("AIChat: Could not save history");
        }
    },

    /**
     * Setup auto re-indexing when content changes
     */
    setupAutoReindex() {
        // Listen for content save events (not all vault saves)
        const originalSaveContent = Storage.saveContent;
        let reindexTimer = null;

        Storage.saveContent = async function (...args) {
            const result = await originalSaveContent.apply(this, args);

            // Debounce re-index: only trigger after 30 seconds of no content saves
            if (reindexTimer) clearTimeout(reindexTimer);
            reindexTimer = setTimeout(async () => {
                if (AI.isConfigured() && AI.getIndexStats().isIndexed) {
                    console.log(
                        "AIChat: Content changed - marking for re-index...",
                    );
                    AI.needsReindex = true;
                }
            }, 30000);

            return result;
        };
    },

    /**
     * Create the chat UI elements - floating search bar style
     */
    createChatUI() {
        // Create floating search bar container
        this.container = document.createElement("div");
        this.container.id = "ai-search-container";
        this.container.innerHTML = `
            <!-- Floating Search Bar -->
            <div class="ai-search-bar" id="ai-search-bar">
                <div class="ai-search-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                </div>
                <input type="text" 
                    id="ai-search-input" 
                    class="ai-search-input" 
                    placeholder="Ask anything..." 
                    autocomplete="off"
                />
                <div class="ai-search-actions">
                    <button class="ai-action-btn" id="btn-ai-history-bar" title="Show last query" style="display: none;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                    </button>
                    <button class="ai-action-btn" id="btn-ai-settings-mini" title="AI Settings">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                    </button>
                    <button class="ai-action-btn ai-send-btn" id="btn-ai-send-mini" title="Send" disabled>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path>
                        </svg>
                    </button>
                </div>
                <div class="ai-search-glow"></div>
            </div>

            <!-- Results Panel -->
            <div class="ai-results-panel hidden" id="ai-results-panel">
                <div class="ai-results-header">
                    <span class="ai-results-title">AI Response</span>
                    <div class="ai-results-actions">
                        <button class="ai-btn-icon" id="btn-ai-history" title="Show last query">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                        </button>
                        <button class="ai-btn-icon" id="btn-ai-reindex" title="Re-index content">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="23 4 23 10 17 10"></polyline>
                                <polyline points="1 20 1 14 7 14"></polyline>
                                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"></path>
                            </svg>
                        </button>
                        <button class="ai-btn-icon" id="btn-ai-clear" title="Clear">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                            </svg>
                        </button>
                        <button class="ai-btn-icon" id="btn-ai-close-panel" title="Close">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 6L6 18M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="ai-results-status" id="ai-results-status"></div>
                <div class="ai-results-content" id="ai-results-content">
                    <!-- Messages appear here -->
                </div>
            </div>
        `;
        document.body.appendChild(this.container);
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const searchBar = document.getElementById("ai-search-bar");
        const searchInput = document.getElementById("ai-search-input");
        const sendBtn = document.getElementById("btn-ai-send-mini");
        const settingsBtn = document.getElementById("btn-ai-settings-mini");
        const closeBtn = document.getElementById("btn-ai-close-panel");
        const clearBtn = document.getElementById("btn-ai-clear");
        const reindexBtn = document.getElementById("btn-ai-reindex");
        const historyBtn = document.getElementById("btn-ai-history");
        const historyBarBtn = document.getElementById("btn-ai-history-bar");

        // Re-index button
        reindexBtn?.addEventListener("click", () => {
            this.reindexContent();
        });

        // History button (in panel) - show last query
        historyBtn?.addEventListener("click", () => {
            this.showLastQuery();
        });

        // History button (in search bar) - show last query
        historyBarBtn?.addEventListener("click", (e) => {
            e.stopPropagation();
            this.showLastQuery();
        });

        // Focus/blur for expansion
        searchInput?.addEventListener("focus", () => {
            this.expand();
        });

        searchInput?.addEventListener("blur", (e) => {
            // Don't collapse if clicking on action buttons
            if (e.relatedTarget?.closest(".ai-search-bar")) return;
            // Don't collapse if panel is open
            if (this.isPanelOpen) return;
            // Don't collapse if has content
            if (searchInput.value.trim()) return;

            setTimeout(() => this.collapse(), 200);
        });

        // Input changes
        searchInput?.addEventListener("input", (e) => {
            const hasText = e.target.value.trim().length > 0;
            sendBtn.disabled = !hasText;

            if (hasText) {
                searchBar.classList.add("has-input");
            } else {
                searchBar.classList.remove("has-input");
            }
        });

        // Send on Enter
        searchInput?.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey && searchInput.value.trim()) {
                e.preventDefault();
                this.sendMessage();
            }
            if (e.key === "Escape") {
                this.collapse();
                this.closePanel();
                searchInput.blur();
            }
        });

        // Send button
        sendBtn?.addEventListener("click", () => {
            this.sendMessage();
        });

        // Settings button
        settingsBtn?.addEventListener("click", (e) => {
            e.stopPropagation();
            this.showSettings();
        });

        // Close panel
        closeBtn?.addEventListener("click", () => {
            this.closePanel();
        });

        // Clear chat
        clearBtn?.addEventListener("click", () => {
            this.clearChat();
        });

        // Click outside to collapse
        document.addEventListener("click", (e) => {
            if (!e.target.closest("#ai-search-container")) {
                if (
                    !this.isPanelOpen &&
                    !document.getElementById("ai-search-input").value.trim()
                ) {
                    this.collapse();
                }
            }
        });
    },

    /**
     * Expand the search bar
     */
    expand() {
        const searchBar = document.getElementById("ai-search-bar");
        searchBar.classList.add("expanded");
        this.isExpanded = true;

        // Init AI on first expand
        AI.init();

        // Show history button if history exists
        this.updateHistoryButton();
    },

    /**
     * Update history button visibility
     */
    updateHistoryButton() {
        const historyBarBtn = document.getElementById("btn-ai-history-bar");
        if (historyBarBtn) {
            historyBarBtn.style.display = this.lastQuery ? "flex" : "none";
        }
    },

    /**
     * Collapse the search bar
     */
    collapse() {
        const searchBar = document.getElementById("ai-search-bar");
        searchBar.classList.remove("expanded", "has-input");
        this.isExpanded = false;
    },

    /**
     * Open results panel
     */
    openPanel() {
        const panel = document.getElementById("ai-results-panel");
        panel.classList.remove("hidden");
        this.isPanelOpen = true;
        this.updateStatus();
    },

    /**
     * Close results panel
     */
    closePanel() {
        const panel = document.getElementById("ai-results-panel");
        panel.classList.add("hidden");
        this.isPanelOpen = false;
    },

    /**
     * Update the status indicator
     */
    updateStatus() {
        const statusEl = document.getElementById("ai-results-status");
        if (!statusEl) return;

        const stats = AI.getIndexStats();

        if (!AI.isConfigured()) {
            statusEl.innerHTML = `
                <span class="status-warning">⚠️ AI not configured</span>
                <button class="btn-link" id="btn-configure-ai">Configure</button>
            `;
            statusEl.className = "ai-results-status warning";

            document
                .getElementById("btn-configure-ai")
                ?.addEventListener("click", () => {
                    this.showSettings();
                });
        } else if (!stats.isIndexed) {
            statusEl.innerHTML = `
                <span class="status-warning">📚 Content not indexed</span>
                <button class="btn-link" id="btn-index-now">Index now</button>
            `;
            statusEl.className = "ai-results-status warning";

            document
                .getElementById("btn-index-now")
                ?.addEventListener("click", () => {
                    this.indexContent();
                });
        } else {
            statusEl.innerHTML = `<span class="status-ok">✓ ${stats.chunks} sections indexed</span>`;
            statusEl.className = "ai-results-status ready";
        }
    },

    /**
     * Index content
     */
    async indexContent() {
        this.openPanel();
        this.addMessage("system", "📚 Indexing your knowledge base...");

        try {
            const result = await AI.indexContent();
            this.addMessage(
                "system",
                `✅ Indexed ${result.chunks} sections successfully!`,
            );
            this.updateStatus();
        } catch (error) {
            this.addMessage("error", `❌ Indexing failed: ${error.message}`);
        }
    },

    /**
     * Send a message/question
     */
    async sendMessage() {
        const input = document.getElementById("ai-search-input");
        const question = input.value.trim();

        if (!question) return;

        // Clear input
        input.value = "";
        document.getElementById("btn-ai-send-mini").disabled = true;
        document.getElementById("ai-search-bar").classList.remove("has-input");

        // Open panel and show question
        this.openPanel();
        this.addMessage("user", question);

        // Check configuration
        if (!AI.isConfigured()) {
            this.addMessage("error", "Please configure AI settings first.");
            this.showSettings();
            return;
        }

        // Check if indexed
        const stats = AI.getIndexStats();
        if (!stats.isIndexed) {
            this.addMessage(
                "error",
                "Please index your content first. Click 'Index now' above.",
            );
            return;
        }

        // Show loading
        const loadingId = this.addMessage("loading", "");

        try {
            // Check if reindex needed
            if (AI.needsReindex) {
                this.addMessage("system", "🔄 Re-indexing updated content...");
                await AI.indexContent();
                AI.needsReindex = false;
            }

            const result = await AI.ask(question);

            // Remove loading
            this.removeMessage(loadingId);

            // Save to history
            await this.saveHistory(question, result);

            // Add compact answer with sources and explain more button
            this.addCompactAnswer(result.answer, result.sources, question);
        } catch (error) {
            this.removeMessage(loadingId);
            this.addMessage("error", `Error: ${error.message}`);
        }
    },

    /**
     * Re-index content manually
     */
    async reindexContent() {
        this.openPanel();
        this.addMessage("system", "🔄 Re-indexing your knowledge base...");

        try {
            await AI.clearIndex();
            const result = await AI.indexContent();
            this.addMessage(
                "system",
                `✅ Re-indexed ${result.chunks} sections!`,
            );
            this.updateStatus();
        } catch (error) {
            this.addMessage("error", `❌ Re-indexing failed: ${error.message}`);
        }
    },

    /**
     * Show last query from history
     */
    showLastQuery() {
        if (!this.lastQuery || !this.lastAnswer) {
            this.openPanel();
            this.addMessage("system", "No previous query in history.");
            return;
        }

        this.openPanel();
        this.clearChat();
        this.addMessage("user", this.lastQuery);
        this.addCompactAnswer(
            this.lastAnswer.answer,
            this.lastAnswer.sources,
            this.lastQuery,
        );
    },

    /**
     * Add a compact answer with sources and expand button
     */
    addCompactAnswer(fullAnswer, sources, question) {
        const contentEl = document.getElementById("ai-results-content");
        const messageId = Utils.generateId();

        // Create compact summary (first 2-3 sentences) - preserving links
        const compactAnswer = this.createCompactSummary(fullAnswer);
        const hasMore = fullAnswer.length > compactAnswer.length + 20;

        // Check if this is a "not found" response - don't show source chips
        const isNotFound =
            /couldn't find|could not find|no information|not found/i.test(
                fullAnswer,
            );

        // Build source chips at bottom (only if we found relevant info)
        const sourcesHtml =
            sources && sources.length > 0 && !isNotFound
                ? `<div class="ai-result-sources">
                ${sources
                    .map(
                        (s) => `
                    <a href="#${s.anchor}" class="source-chip" onclick="AIChat.scrollToSection('${s.anchor}')" title="Go to: ${Utils.escapeHtml(s.title)}">
                        📍 ${Utils.escapeHtml(s.title)}
                    </a>
                `,
                    )
                    .join("")}
            </div>`
                : "";

        const messageEl = document.createElement("div");
        messageEl.className = "ai-result-message ai-result-assistant";
        messageEl.id = messageId;

        // Format answer with inline links preserved
        messageEl.innerHTML = `
            <div class="ai-compact-answer">
                <div class="ai-answer-text">${this.formatMarkdown(compactAnswer)}</div>
                ${sourcesHtml}
                ${hasMore
                ? `
                    <button class="ai-expand-btn" data-full="${btoa(encodeURIComponent(fullAnswer))}" onclick="AIChat.expandAnswer(this)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 5v14M5 12h14"></path>
                        </svg>
                        Show full answer
                    </button>
                `
                : ""
            }
            </div>
        `;

        contentEl.appendChild(messageEl);
        contentEl.scrollTop = contentEl.scrollHeight;

        return messageId;
    },

    /**
     * Create a compact summary from full answer - preserving inline links
     */
    createCompactSummary(text) {
        // Keep the original text with links intact
        // Just get first 2-3 sentences or ~250 chars
        const sentences = text.split(/(?<=[.!?])\s+/);
        let summary = "";
        let count = 0;

        for (const sentence of sentences) {
            if (count >= 3 || summary.length > 250) break;
            summary += (summary ? " " : "") + sentence;
            count++;
        }

        return summary.trim() || text.substring(0, 300);
    },

    /**
     * Expand answer to show full content
     */
    expandAnswer(btn) {
        const fullAnswer = decodeURIComponent(atob(btn.dataset.full));
        const answerText = btn.parentElement.querySelector(".ai-answer-text");
        answerText.innerHTML = this.formatMarkdown(fullAnswer);
        btn.remove();
    },

    /**
     * Add a message to the results
     */
    addMessage(type, content, sources = null) {
        const contentEl = document.getElementById("ai-results-content");
        const messageId = Utils.generateId();

        const messageEl = document.createElement("div");
        messageEl.className = `ai-result-message ai-result-${type}`;
        messageEl.id = messageId;

        if (type === "loading") {
            messageEl.innerHTML = `
                <div class="ai-loading-animation">
                    <div class="ai-orb"></div>
                    <div class="ai-orb"></div>
                    <div class="ai-orb"></div>
                </div>
            `;
        } else if (type === "user") {
            messageEl.innerHTML = `
                <div class="ai-result-user-query">${Utils.escapeHtml(content)}</div>
            `;
        } else if (type === "assistant") {
            const sourcesHtml =
                sources && sources.length > 0
                    ? `
                <div class="ai-result-sources">
                    <span class="sources-label">Sources:</span>
                    ${sources
                        .map(
                            (s) => `
                        <a href="#${s.anchor}" class="source-chip" onclick="AIChat.scrollToSection('${s.anchor}')">
                            ${Utils.escapeHtml(s.title)}
                        </a>
                    `,
                        )
                        .join("")}
                </div>
            `
                    : "";

            messageEl.innerHTML = `
                <div class="ai-result-answer">${this.formatMarkdown(content)}</div>
                ${sourcesHtml}
            `;
        } else if (type === "error") {
            messageEl.innerHTML = `
                <div class="ai-result-error">${Utils.escapeHtml(content)}</div>
            `;
        } else {
            messageEl.innerHTML = `
                <div class="ai-result-system">${Utils.escapeHtml(content)}</div>
            `;
        }

        contentEl.appendChild(messageEl);
        contentEl.scrollTop = contentEl.scrollHeight;

        return messageId;
    },

    /**
     * Remove a message
     */
    removeMessage(messageId) {
        const message = document.getElementById(messageId);
        if (message) {
            message.remove();
        }
    },

    /**
     * Format markdown-like content
     */
    formatMarkdown(text) {
        // Basic markdown formatting
        return text
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            .replace(/`(.*?)`/g, "<code>$1</code>")
            .replace(/\n/g, "<br>")
            .replace(
                /\[([^\]]+)\]\(#([^)]+)\)/g,
                '<a href="#$2" onclick="AIChat.scrollToSection(\'$2\')">$1</a>',
            );
    },

    /**
     * Scroll to a section in the editor
     */
    scrollToSection(anchor) {
        Utils.scrollToElement(anchor);
        this.closePanel();
        this.collapse();
    },

    /**
     * Show AI settings modal
     */
    showSettings() {
        const providers = AI.providers;
        const currentConfig = AI.config;
        const stats = AI.getIndexStats();
        const isLocal =
            currentConfig.provider === "ollama" ||
            currentConfig.provider === "lmstudio";

        Modal.show({
            title: "🤖 AI Settings",
            allowClose: true,
            preventClickClose: true,
            body: `
                <div class="ai-settings">
                    <div class="form-group">
                        <label for="ai-provider">Provider</label>
                        <select id="ai-provider">
                            <option value="">Select a provider...</option>
                            ${Object.entries(providers)
                    .map(
                        ([key, p]) => `
                                <option value="${key}" ${currentConfig.provider === key ? "selected" : ""}>
                                    ${p.name}
                                </option>
                            `,
                    )
                    .join("")}
                        </select>
                        <small class="provider-hint" id="provider-hint"></small>
                    </div>
                    
                    <div class="form-group" id="api-key-group" style="display: none;">
                        <label for="ai-api-key">API Key</label>
                        <input type="password" id="ai-api-key" placeholder="Enter API key" value="${currentConfig.apiKey || ""}" />
                    </div>

                    <div class="form-group" id="base-url-group" style="display: none;">
                        <label for="ai-base-url">Server URL</label>
                        <input type="text" id="ai-base-url" class="no-close-input" placeholder="http://localhost:1234" value="${currentConfig.baseUrl || ""}" />
                        <small id="base-url-hint"></small>
                    </div>
                    
                    <div class="form-group" id="model-group">
                        <label for="ai-model">Chat Model</label>
                        <input type="text" id="ai-model" class="no-close-input" placeholder="Enter model name" value="${currentConfig.model || ""}" />
                        <small id="model-hint">Enter the exact model name/identifier</small>
                    </div>

                    <div class="form-group" id="embedding-group">
                        <label for="ai-embedding-model">Embedding Model</label>
                        <input type="text" id="ai-embedding-model" class="no-close-input" placeholder="Enter embedding model name" value="${currentConfig.embeddingModel || ""}" />
                        <small id="embedding-hint">Required for searching your notes</small>
                    </div>

                    <div class="ai-index-section">
                        <label>Knowledge Base Index</label>
                        <div class="ai-index-status" id="ai-index-status">
                            ${stats.isIndexed
                    ? `<span class="status-ok">✓ ${stats.chunks} sections indexed</span>`
                    : `<span class="status-warning">Not indexed</span>`
                }
                        </div>
                        <button class="btn btn-outline" id="btn-reindex-now" style="margin-top: 8px;">
                            🔄 Re-index Content
                        </button>
                        <small>Re-index after adding or editing content</small>
                    </div>

                    <div class="form-group ai-dev-mode-section">
                        <label class="checkbox-label">
                            <input type="checkbox" id="ai-dev-mode" ${currentConfig.devMode ? "checked" : ""} />
                            <span>🛠️ Developer Mode</span>
                        </label>
                        <div class="ai-dev-options" id="ai-dev-options" style="display: ${currentConfig.devMode ? "block" : "none"};">
                            <label class="checkbox-label sub-option">
                                <input type="checkbox" id="ai-log-raw" ${currentConfig.logRawResponse ? "checked" : ""} />
                                <span>Log original AI response to console</span>
                            </label>
                        </div>
                    </div>

                    <div class="ai-settings-info" id="ai-settings-info">
                        <p>💡 Select a provider to see setup instructions.</p>
                    </div>
                </div>
            `,
            footer: `
                <button class="btn btn-secondary" id="btn-test-connection">Test Connection</button>
                <button class="btn btn-primary" id="btn-save-ai-settings">Save Settings</button>
            `,
        });

        // Setup dynamic form behavior
        setTimeout(() => {
            const providerSelect = document.getElementById("ai-provider");
            const apiKeyGroup = document.getElementById("api-key-group");
            const baseUrlGroup = document.getElementById("base-url-group");
            const baseUrlInput = document.getElementById("ai-base-url");
            const baseUrlHint = document.getElementById("base-url-hint");
            const modelInput = document.getElementById("ai-model");
            const modelHint = document.getElementById("model-hint");
            const embeddingInput =
                document.getElementById("ai-embedding-model");
            const embeddingHint = document.getElementById("embedding-hint");
            const providerHint = document.getElementById("provider-hint");
            const settingsInfo = document.getElementById("ai-settings-info");
            const reindexBtn = document.getElementById("btn-reindex-now");
            const indexStatus = document.getElementById("ai-index-status");
            const devModeCheckbox = document.getElementById("ai-dev-mode");
            const devOptions = document.getElementById("ai-dev-options");
            const logRawCheckbox = document.getElementById("ai-log-raw");

            // Developer mode toggle
            devModeCheckbox?.addEventListener("change", (e) => {
                devOptions.style.display = e.target.checked ? "block" : "none";
            });

            // Re-index button handler
            reindexBtn?.addEventListener("click", async () => {
                reindexBtn.disabled = true;
                reindexBtn.textContent = "Indexing...";
                indexStatus.innerHTML =
                    '<span class="status-warning">Indexing...</span>';

                try {
                    await AI.clearIndex();
                    const result = await AI.indexContent();
                    indexStatus.innerHTML = `<span class="status-ok">✓ ${result.chunks} sections indexed</span>`;
                    reindexBtn.textContent = "✓ Done!";
                    setTimeout(() => {
                        reindexBtn.textContent = "🔄 Re-index Content";
                        reindexBtn.disabled = false;
                    }, 2000);
                } catch (error) {
                    indexStatus.innerHTML = `<span class="status-error">❌ ${error.message}</span>`;
                    reindexBtn.textContent = "🔄 Re-index Content";
                    reindexBtn.disabled = false;
                }
            });

            const updateFormForProvider = (provider) => {
                if (!provider) {
                    apiKeyGroup.style.display = "none";
                    baseUrlGroup.style.display = "none";
                    providerHint.textContent = "";
                    modelHint.textContent = "Select a provider first";
                    embeddingHint.textContent = "";
                    settingsInfo.innerHTML =
                        "<p>💡 Select a provider to see setup instructions.</p>";
                    return;
                }

                const providerConfig = providers[provider];

                // Show/hide appropriate fields
                apiKeyGroup.style.display = providerConfig.requiresApiKey
                    ? "block"
                    : "none";
                baseUrlGroup.style.display = !providerConfig.requiresApiKey
                    ? "block"
                    : "none";

                // Provider-specific setup
                if (provider === "ollama") {
                    baseUrlInput.placeholder = "http://localhost:11434";
                    baseUrlHint.textContent = "Default: http://localhost:11434";
                    if (!baseUrlInput.value)
                        baseUrlInput.value = "http://localhost:11434";
                    modelInput.placeholder = "e.g., llama3.2, mistral, qwen2";
                    modelHint.textContent =
                        "Run: ollama list  to see installed models";
                    embeddingInput.placeholder = "e.g., nomic-embed-text";
                    embeddingHint.textContent =
                        "Run: ollama pull nomic-embed-text";
                    settingsInfo.innerHTML = `
                        <p><strong>🦙 Ollama Setup:</strong></p>
                        <ol style="margin: 8px 0 0 16px; font-size: 12px;">
                            <li>Start with CORS: <code>OLLAMA_ORIGINS=* ollama serve</code></li>
                            <li>Pull models: <code>ollama pull llama3.2</code></li>
                            <li>Pull embeddings: <code>ollama pull nomic-embed-text</code></li>
                        </ol>
                    `;
                } else if (provider === "lmstudio") {
                    baseUrlInput.placeholder = "http://localhost:1234";
                    baseUrlHint.textContent =
                        "Check Local Server tab in LM Studio for port";
                    if (!baseUrlInput.value)
                        baseUrlInput.value = "http://localhost:1234";
                    modelInput.placeholder = "e.g., qwen3-4b-thinking-2507";
                    modelHint.textContent =
                        "Copy exact name from loaded model in LM Studio";
                    embeddingInput.placeholder = "e.g., nomic-embed-text-v1.5";
                    embeddingHint.textContent =
                        "Load an embedding model in LM Studio";
                    settingsInfo.innerHTML = `
                        <p><strong>🖥️ LM Studio Setup:</strong></p>
                        <ol style="margin: 8px 0 0 16px; font-size: 12px;">
                            <li>Open LM Studio → <strong>Local Server</strong> tab</li>
                            <li>Load a <strong>Chat model</strong> (e.g., Qwen, Mistral)</li>
                            <li>Load an <strong>Embedding model</strong> (e.g., nomic-embed)</li>
                            <li>Click <strong>Start Server</strong></li>
                            <li>Copy the model names exactly as shown</li>
                        </ol>
                    `;
                } else if (provider === "openai") {
                    modelInput.placeholder = "gpt-4o-mini";
                    modelHint.textContent =
                        "Recommended: gpt-4o-mini (fast & cheap)";
                    if (!modelInput.value) modelInput.value = "gpt-4o-mini";
                    embeddingInput.placeholder = "text-embedding-3-small";
                    embeddingHint.textContent =
                        "Recommended: text-embedding-3-small";
                    if (!embeddingInput.value)
                        embeddingInput.value = "text-embedding-3-small";
                    settingsInfo.innerHTML = `
                        <p><strong>🔑 OpenAI Setup:</strong></p>
                        <ol style="margin: 8px 0 0 16px; font-size: 12px;">
                            <li>Get API key from <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com</a></li>
                            <li>Recommended models: gpt-4o-mini + text-embedding-3-small</li>
                        </ol>
                    `;
                } else if (provider === "gemini") {
                    modelInput.placeholder = "gemini-1.5-flash";
                    modelHint.textContent = "Recommended: gemini-1.5-flash";
                    if (!modelInput.value)
                        modelInput.value = "gemini-1.5-flash";
                    embeddingInput.placeholder = "text-embedding-004";
                    embeddingHint.textContent = "Use: text-embedding-004";
                    if (!embeddingInput.value)
                        embeddingInput.value = "text-embedding-004";
                    settingsInfo.innerHTML = `
                        <p><strong>✨ Gemini Setup:</strong></p>
                        <ol style="margin: 8px 0 0 16px; font-size: 12px;">
                            <li>Get API key from <a href="https://aistudio.google.com/apikey" target="_blank">aistudio.google.com</a></li>
                            <li>Recommended: gemini-1.5-flash (fast) or gemini-1.5-pro</li>
                        </ol>
                    `;
                }
            };

            providerSelect.addEventListener("change", (e) => {
                updateFormForProvider(e.target.value);
            });

            // Initialize with current provider
            updateFormForProvider(currentConfig.provider);

            // Test connection button
            document
                .getElementById("btn-test-connection")
                ?.addEventListener("click", async () => {
                    const btn = document.getElementById("btn-test-connection");
                    btn.disabled = true;
                    btn.textContent = "Testing...";

                    // Save temp config
                    const tempConfig = {
                        provider: providerSelect.value,
                        apiKey: document.getElementById("ai-api-key").value,
                        baseUrl: baseUrlInput.value,
                        model: modelInput.value,
                        embeddingModel: embeddingInput.value,
                    };

                    await AI.saveConfig(tempConfig);

                    const result = await AI.testConnection();

                    if (result.success) {
                        Modal.showSuccess("✅ Connection successful!");
                    } else {
                        Modal.showError(
                            "❌ Connection failed: " + result.message,
                        );
                    }

                    btn.disabled = false;
                    btn.textContent = "Test Connection";
                });

            // Save button
            document
                .getElementById("btn-save-ai-settings")
                ?.addEventListener("click", async () => {
                    const config = {
                        provider: providerSelect.value,
                        apiKey: document.getElementById("ai-api-key").value,
                        baseUrl: baseUrlInput.value,
                        model: modelInput.value,
                        embeddingModel: embeddingInput.value,
                        devMode: devModeCheckbox?.checked || false,
                        logRawResponse: logRawCheckbox?.checked || false,
                    };

                    await AI.saveConfig(config);
                    Modal.showSuccess("Settings saved!");

                    setTimeout(() => {
                        Modal.hide();
                        this.updateStatus();
                    }, 1000);
                });
        }, 0);
    },

    /**
     * Clear chat history
     */
    clearChat() {
        const contentEl = document.getElementById("ai-results-content");
        contentEl.innerHTML = "";
        this.chatHistory = [];
    },
};

// Make globally available
window.AIChat = AIChat;
