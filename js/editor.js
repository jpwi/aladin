/**
 * Editor - Block-based editor using Editor.js
 */

const Editor = {
    instance: null,
    container: null,
    dropZone: null,
    saveTimeout: null,

    // Default content with Lorem Ipsum
    defaultContent: {
        time: Date.now(),
        blocks: [
            {
                id: Utils.generateId(),
                type: "header",
                data: {
                    text: "Welcome to Aladin",
                    level: 1,
                },
            },
            {
                id: Utils.generateId(),
                type: "paragraph",
                data: {
                    text: "Aladin is your local, Notion-like knowledge base. It runs entirely in your browser with no server required. Your data is stored locally and is future-proof for AI summarization and deep linking.",
                },
            },
            {
                id: Utils.generateId(),
                type: "header",
                data: {
                    text: "Getting Started",
                    level: 2,
                },
            },
            {
                id: Utils.generateId(),
                type: "paragraph",
                data: {
                    text: "Start typing to add content. Use the + button or press Tab to see available block types. Create headings to organize your content - they will automatically appear in the sidebar navigation.",
                },
            },
            {
                id: Utils.generateId(),
                type: "header",
                data: {
                    text: "Keyboard Shortcuts",
                    level: 3,
                },
            },
            {
                id: Utils.generateId(),
                type: "paragraph",
                data: {
                    text: "Use markdown-style shortcuts followed by Enter: # for H1, ## for H2, ### for H3, and so on. You can also drag and drop files or images directly into the editor.",
                },
            },
            {
                id: Utils.generateId(),
                type: "header",
                data: {
                    text: "Features",
                    level: 2,
                },
            },
            {
                id: Utils.generateId(),
                type: "header",
                data: {
                    text: "Block-Based Editing",
                    level: 3,
                },
            },
            {
                id: Utils.generateId(),
                type: "paragraph",
                data: {
                    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
                },
            },
            {
                id: Utils.generateId(),
                type: "header",
                data: {
                    text: "File Attachments",
                    level: 3,
                },
            },
            {
                id: Utils.generateId(),
                type: "paragraph",
                data: {
                    text: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
                },
            },
            {
                id: Utils.generateId(),
                type: "header",
                data: {
                    text: "Deep Linking",
                    level: 3,
                },
            },
            {
                id: Utils.generateId(),
                type: "paragraph",
                data: {
                    text: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
                },
            },
            {
                id: Utils.generateId(),
                type: "header",
                data: {
                    text: "AI-Ready Structure",
                    level: 2,
                },
            },
            {
                id: Utils.generateId(),
                type: "paragraph",
                data: {
                    text: "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.",
                },
            },
            {
                id: Utils.generateId(),
                type: "header",
                data: {
                    text: "Data Storage",
                    level: 3,
                },
            },
            {
                id: Utils.generateId(),
                type: "paragraph",
                data: {
                    text: "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.",
                },
            },
            {
                id: Utils.generateId(),
                type: "header",
                data: {
                    text: "Help",
                    level: 1,
                },
            },
            {
                id: Utils.generateId(),
                type: "header",
                data: {
                    text: "Shortcuts",
                    level: 2,
                },
            },
            {
                id: Utils.generateId(),
                type: "paragraph",
                data: {
                    text: "<b>Editor Shortcuts</b>",
                },
            },
            {
                id: Utils.generateId(),
                type: "paragraph",
                data: {
                    text: "• <code>/</code> or <code>Tab</code> — Open block menu to insert headings, images, lists, and more<br>• <code>#</code> + Space — Create H1 heading<br>• <code>##</code> + Space — Create H2 heading<br>• <code>###</code> + Space — Create H3 heading<br>• <code>-</code> or <code>*</code> + Space — Create bullet list<br>• <code>1.</code> + Space — Create numbered list<br>• Drag & drop — Add images and files directly into the editor",
                },
            },
            {
                id: Utils.generateId(),
                type: "paragraph",
                data: {
                    text: "<b>AI Search</b>",
                },
            },
            {
                id: Utils.generateId(),
                type: "paragraph",
                data: {
                    text: "• <code>Shift</code> + <code>Space</code> — Open AI search panel and focus search bar<br>• <code>Escape</code> — Close AI search panel<br>• Type your question and press Enter to search your knowledge base with AI",
                },
            },
            {
                id: Utils.generateId(),
                type: "paragraph",
                data: {
                    text: "<b>Navigation</b>",
                },
            },
            {
                id: Utils.generateId(),
                type: "paragraph",
                data: {
                    text: "• Click any heading in the sidebar to jump to that section<br>• Use the search bar in the sidebar to find headings quickly<br>• Links in AI answers point directly to the relevant section",
                },
            },
            {
                id: Utils.generateId(),
                type: "header",
                data: {
                    text: "Setup",
                    level: 2,
                },
            },
            {
                id: Utils.generateId(),
                type: "paragraph",
                data: {
                    text: "<b>Getting Started</b>",
                },
            },
            {
                id: Utils.generateId(),
                type: "paragraph",
                data: {
                    text: "1. Create a new vault or open an existing one<br>2. Add your content using the editor — organize with headings<br>3. Your vault is automatically saved and encrypted locally",
                },
            },
            {
                id: Utils.generateId(),
                type: "paragraph",
                data: {
                    text: "<b>AI Configuration</b>",
                },
            },
            {
                id: Utils.generateId(),
                type: "paragraph",
                data: {
                    text: "To use AI search, open the AI panel (Shift + Space) and click the ⚙️ settings icon:<br><br>1. <b>Provider:</b> Choose OpenAI, Ollama, or a custom OpenAI-compatible API<br>2. <b>Embedding Model:</b> Select a model for indexing your content (e.g., bge-m3, text-embedding-3-small)<br>3. <b>Chat Model:</b> Select a model for answering questions<br>4. <b>API Key/URL:</b> Configure your API endpoint and credentials<br><br>For local AI, install Ollama and pull models like <code>bge-m3</code> for embeddings and <code>llama3</code> or <code>mistral</code> for chat.",
                },
            },
            {
                id: Utils.generateId(),
                type: "paragraph",
                data: {
                    text: "<b>Tips</b>",
                },
            },
            {
                id: Utils.generateId(),
                type: "paragraph",
                data: {
                    text: "• Use clear, descriptive headings — they help AI find relevant content<br>• Keep related information under the same heading<br>• Re-index after making major changes to ensure AI has the latest content<br>• Lock your vault when you're done to keep it secure",
                },
            },
        ],
        version: "2.28.2",
    },

    /**
     * Initialize the editor
     */
    async init() {
        this.container = document.getElementById("editorjs");

        // Load saved content or use default
        let content = await Storage.loadContent();
        if (!content || !content.blocks || content.blocks.length === 0) {
            content = this.defaultContent;
        }

        // Ensure all blocks have IDs
        content.blocks = content.blocks.map((block) => ({
            ...block,
            id: block.id || Utils.generateId(),
        }));

        // Initialize Editor.js
        this.instance = new EditorJS({
            holder: "editorjs",
            data: content,
            placeholder: "Start typing or press Tab for block menu...",
            autofocus: true,

            tools: {
                header: {
                    class: Header,
                    inlineToolbar: true,
                    config: {
                        placeholder: "Enter a heading",
                        levels: [1, 2, 3, 4, 5, 6],
                        defaultLevel: 2,
                    },
                    shortcut: "CMD+SHIFT+H",
                },
                paragraph: {
                    class: Paragraph,
                    inlineToolbar: true,
                },
                list: {
                    class: List,
                    inlineToolbar: true,
                    config: {
                        defaultStyle: "unordered",
                    },
                },
                image: {
                    class: ImageTool,
                    config: {
                        uploader: {
                            uploadByFile: this.uploadImage.bind(this),
                            uploadByUrl: this.uploadImageByUrl.bind(this),
                        },
                    },
                },
            },

            onChange: Utils.debounce(async () => {
                await this.save();
            }, 500),

            onReady: () => {
                console.log("Editor.js is ready");
                this.setupBlockIds();
                this.setupMarkdownShortcuts();
                this.setupSlashCommands();
                this.setupAtCommands();
                this.setupDragDrop();
                this.setupImmediateSave();
                Sidebar.update(content.blocks);
            },
        });
    },

    /**
     * Setup block IDs for anchoring
     */
    setupBlockIds() {
        // Observe DOM changes to add IDs to blocks
        const observer = new MutationObserver(() => {
            this.assignBlockIds();
        });

        observer.observe(this.container, {
            childList: true,
            subtree: true,
        });

        this.assignBlockIds();
    },

    /**
     * Assign IDs to block elements for deep linking
     */
    async assignBlockIds() {
        try {
            const data = await this.instance.save();
            const blockElements = this.container.querySelectorAll(".ce-block");

            blockElements.forEach((element, index) => {
                if (data.blocks[index]) {
                    const blockId = data.blocks[index].id || Utils.generateId();
                    element.id = blockId;
                    data.blocks[index].id = blockId;
                }
            });
        } catch (e) {
            // Editor not ready yet
        }
    },

    /**
     * Setup markdown shortcuts for headings
     */
    setupMarkdownShortcuts() {
        this.container.addEventListener("keydown", async (e) => {
            if (e.key !== "Enter") return;

            const selection = window.getSelection();
            if (!selection.rangeCount) return;

            const range = selection.getRangeAt(0);
            const block =
                range.startContainer.parentElement?.closest(".ce-block");

            if (!block) return;

            const paragraph = block.querySelector(".ce-paragraph");
            if (!paragraph) return;

            const text = paragraph.textContent;
            const match = text.match(/^(#{1,6})\s/);

            if (match) {
                e.preventDefault();

                const level = match[1].length;
                const headingText = text.replace(/^#{1,6}\s/, "");

                // Get current block index
                const blocks = this.container.querySelectorAll(".ce-block");
                let blockIndex = -1;
                blocks.forEach((b, i) => {
                    if (b === block) blockIndex = i;
                });

                if (blockIndex >= 0) {
                    // Delete current block and insert header
                    await this.instance.blocks.delete(blockIndex);
                    await this.instance.blocks.insert(
                        "header",
                        {
                            text: headingText,
                            level: level,
                        },
                        {},
                        blockIndex,
                        true,
                    );
                }
            }
        });
    },

    // Slash command menu state
    slashMenu: null,
    slashQuery: "",
    slashSelectedIndex: 0,

    // Date command menu state to calculate relative dates
    atMenu: null,
    atSelectedIndex: 0,
    atQuery: "",
    atOptions: [
        {
            name: "today",
            getDate: function () { return Editor.formatDateISO(new Date()); }
        },
        {
            name: "yesterday",
            getDate: function () { const d = new Date(); d.setDate(d.getDate() - 1); return Editor.formatDateISO(d); }
        },
        {
            name: "tomorrow",
            getDate: function () { const d = new Date(); d.setDate(d.getDate() + 1); return Editor.formatDateISO(d); }
        },
        {
            name: "next week",
            getDate: function () { const d = new Date(); d.setDate(d.getDate() + 7); return Editor.formatDateISO(d); }
        },
        {
            name: "next month",
            getDate: function () { const d = new Date(); return Editor.formatDateISO(new Date(d.getFullYear(), d.getMonth() + 1, d.getDate())); }
        },
    ],

    // Available slash commands
    slashCommands: [
        {
            name: "Heading 1",
            shortcut: "/h1",
            icon: "H1",
            type: "header",
            data: { level: 1 },
        },
        {
            name: "Heading 2",
            shortcut: "/h2",
            icon: "H2",
            type: "header",
            data: { level: 2 },
        },
        {
            name: "Heading 3",
            shortcut: "/h3",
            icon: "H3",
            type: "header",
            data: { level: 3 },
        },
        {
            name: "Heading 4",
            shortcut: "/h4",
            icon: "H4",
            type: "header",
            data: { level: 4 },
        },
        {
            name: "Bulleted List",
            shortcut: "/ul",
            icon: "•",
            type: "list",
            data: { style: "unordered" },
        },
        {
            name: "Numbered List",
            shortcut: "/ol",
            icon: "1.",
            type: "list",
            data: { style: "ordered" },
        },
        {
            name: "Paragraph",
            shortcut: "/p",
            icon: "¶",
            type: "paragraph",
            data: {},
        },
        {
            name: "Image",
            shortcut: "/img",
            icon: "🖼",
            type: "image",
            data: {},
        },
    ],

    /**
     * Setup slash command menu
     */
    setupSlashCommands() {
        // Create slash menu element
        this.slashMenu = document.createElement("div");
        this.slashMenu.className = "slash-menu hidden";
        this.slashMenu.id = "slash-menu";
        document.body.appendChild(this.slashMenu);

        // Listen for input in editor
        this.container.addEventListener("input", (e) => {
            this.handleSlashInput(e);
        });

        // Handle keyboard navigation in slash menu
        this.container.addEventListener("keydown", (e) => {
            if (this.slashMenu.classList.contains("hidden")) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                this.slashSelectedIndex = Math.min(
                    this.slashSelectedIndex + 1,
                    this.getFilteredCommands().length - 1,
                );
                this.updateSlashMenuSelection();
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                this.slashSelectedIndex = Math.max(
                    this.slashSelectedIndex - 1,
                    0,
                );
                this.updateSlashMenuSelection();
            } else if (e.key === "Enter" || e.key === "Tab") {
                const commands = this.getFilteredCommands();
                if (commands.length > 0) {
                    e.preventDefault();
                    this.executeSlashCommand(commands[this.slashSelectedIndex]);
                }
            } else if (e.key === "Escape") {
                this.hideSlashMenu();
            }
        });

        // Hide menu when clicking outside
        document.addEventListener("click", (e) => {
            if (
                !e.target.closest(".slash-menu") &&
                !e.target.closest(".ce-block")
            ) {
                this.hideSlashMenu();
            }
        });
    },

    /**
     * Handle input for slash commands
     */
    handleSlashInput(e) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const block = range.startContainer.parentElement?.closest(".ce-block");
        if (!block) return;

        const paragraph = block.querySelector(
            ".ce-paragraph, [contenteditable]",
        );
        if (!paragraph) return;

        const text = paragraph.textContent || "";

        // Check if text starts with /
        if (text.startsWith("/")) {
            this.slashQuery = text.substring(1).toLowerCase();
            this.slashSelectedIndex = 0;
            this.showSlashMenu(paragraph);
        } else {
            this.hideSlashMenu();
        }
    },

    /**
     * Get filtered commands based on query
     */
    getFilteredCommands() {
        if (!this.slashQuery) return this.slashCommands;
        return this.slashCommands.filter(
            (cmd) =>
                cmd.name.toLowerCase().includes(this.slashQuery) ||
                cmd.shortcut.toLowerCase().includes("/" + this.slashQuery),
        );
    },

    /**
     * Show slash menu
     */
    showSlashMenu(element) {
        const commands = this.getFilteredCommands();
        if (commands.length === 0) {
            this.hideSlashMenu();
            return;
        }

        // Build menu HTML
        this.slashMenu.innerHTML = commands
            .map(
                (cmd, index) => `
            <div class="slash-menu-item ${index === this.slashSelectedIndex ? "selected" : ""}" 
                 data-index="${index}">
                <span class="slash-menu-icon">${cmd.icon}</span>
                <span class="slash-menu-name">${cmd.name}</span>
                <span class="slash-menu-shortcut">${cmd.shortcut}</span>
            </div>
        `,
            )
            .join("");

        // Add click handlers - use mousedown to fire before blur
        this.slashMenu.querySelectorAll(".slash-menu-item").forEach((item) => {
            item.addEventListener("mousedown", (e) => {
                e.preventDefault(); // Prevent blur
                e.stopPropagation();
                const index = parseInt(item.dataset.index);
                this.executeSlashCommand(commands[index]);
            });
        });

        // Position menu below the element
        const rect = element.getBoundingClientRect();
        this.slashMenu.style.top = `${rect.bottom + 5}px`;
        this.slashMenu.style.left = `${rect.left}px`;
        this.slashMenu.classList.remove("hidden");
    },

    /**
     * Hide slash menu
     */
    hideSlashMenu() {
        this.slashMenu.classList.add("hidden");
        this.slashQuery = "";
    },

    /**
     * Update selection highlight in menu
     */
    updateSlashMenuSelection() {
        const items = this.slashMenu.querySelectorAll(".slash-menu-item");
        items.forEach((item, index) => {
            item.classList.toggle(
                "selected",
                index === this.slashSelectedIndex,
            );
        });
    },

    /**
     * Execute a slash command
     */
    async executeSlashCommand(command) {
        this.hideSlashMenu();

        // Get current block index
        const blocks = this.container.querySelectorAll(".ce-block");
        let currentIndex = -1;

        const selection = window.getSelection();
        if (selection.rangeCount) {
            const range = selection.getRangeAt(0);
            const block =
                range.startContainer.parentElement?.closest(".ce-block");
            blocks.forEach((b, i) => {
                if (b === block) currentIndex = i;
            });
        }

        if (currentIndex < 0) currentIndex = blocks.length - 1;

        try {
            // Delete current block (with the slash text)
            await this.instance.blocks.delete(currentIndex);

            // Insert new block
            if (command.type === "image") {
                // For image, trigger file picker
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        try {
                            const result = await this.uploadImage(file);
                            if (result.success) {
                                await this.instance.blocks.insert(
                                    "image",
                                    {
                                        file: result.file,
                                        caption: "",
                                        withBorder: false,
                                        stretched: false,
                                        withBackground: false,
                                    },
                                    {},
                                    currentIndex,
                                    true,
                                );
                                await this.save();
                            }
                        } catch (error) {
                            console.error("Image upload failed:", error);
                        }
                    }
                };
                input.click();
            } else {
                await this.instance.blocks.insert(
                    command.type,
                    command.data,
                    {},
                    currentIndex,
                    true,
                );

                // Focus the newly inserted block and position cursor
                setTimeout(() => {
                    this.instance.caret.setToBlock(currentIndex, "start");
                }, 50);
            }
        } catch (error) {
            console.error("Error executing slash command:", error);
        }
    },


    // USING @ to input relative date value

    /**
     * Format date as YYYY-MM-DD string (ISO date format)
     * @param {Date} date - The date to format
     * @returns {string} Date in YYYY-MM-DD format
     */
    formatDateISO(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Setup at command menu
     */
    setupAtCommands() {
        // Create at menu element
        this.atMenu = document.createElement("div");
        this.atMenu.className = "at-menu hidden";
        this.atMenu.id = "at-menu";
        document.body.appendChild(this.atMenu);

        // Listen for input in editor
        this.container.addEventListener("input", (e) => {
            this.handleAtInput(e);
        });

        // Handle keyboard navigation in at menu - attach to document with capture phase
        document.addEventListener("keydown", (e) => {
            if (this.atMenu.classList.contains("hidden")) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                e.stopPropagation();
                this.atSelectedIndex = Math.min(
                    this.atSelectedIndex + 1,
                    this.getFilteredAtOptions().length - 1,
                );
                this.updateAtMenuSelection();
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                e.stopPropagation();
                this.atSelectedIndex = Math.max(
                    this.atSelectedIndex - 1,
                    0,
                );
                this.updateAtMenuSelection();
            } else if (e.key === "Enter" || e.key === "Tab") {
                const options = this.getFilteredAtOptions();
                if (options.length > 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    this.executeAtCommand(options[this.atSelectedIndex]);
                }
            } else if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                this.hideAtMenu();
            }
        }, true); // Use capture phase

        // Hide menu when clicking outside
        document.addEventListener("click", (e) => {
            if (
                !e.target.closest(".at-menu") &&
                !e.target.closest(".ce-block")
            ) {
                this.hideAtMenu();
            }
        });
    },

    /**
     * Handle input for at commands
     */
    handleAtInput(e) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const block = range.startContainer.parentElement?.closest(".ce-block");
        if (!block) return;

        const paragraph = block.querySelector(
            ".ce-paragraph, [contenteditable]",
        );
        if (!paragraph) return;

        const text = paragraph.textContent || "";

        // Check if text contains @
        const atIndex = text.lastIndexOf("@");
        if (atIndex !== -1) {
            // Check if @ is at the end or followed by text
            const textAfterAt = text.substring(atIndex + 1);
            this.atQuery = textAfterAt.toLowerCase();
            this.atSelectedIndex = 0;
            this.showAtMenu(paragraph, atIndex);
        } else {
            this.hideAtMenu();
        }
    },

    /**
     * Get filtered options based on query
     */
    getFilteredAtOptions() {
        if (!this.atQuery) return this.atOptions;
        return this.atOptions.filter(
            (opt) => opt.name.toLowerCase().includes(this.atQuery)
        );
    },

    /**
     * Show at menu
     */
    showAtMenu(element, atIndex) {
        const options = this.getFilteredAtOptions();
        if (options.length === 0) {
            this.hideAtMenu();
            return;
        }

        // Build menu HTML
        this.atMenu.innerHTML = options
            .map(
                (opt, index) => `
            <div class="at-menu-item ${index === this.atSelectedIndex ? "selected" : ""}" 
                 data-index="${index}">
                <span class="at-menu-name">${opt.name}</span>
                <span class="at-menu-date">${opt.getDate()}</span>
            </div>
        `,
            )
            .join("");

        // Add click handlers - use mousedown to fire before blur
        this.atMenu.querySelectorAll(".at-menu-item").forEach((item) => {
            item.addEventListener("mousedown", (e) => {
                e.preventDefault(); // Prevent blur
                e.stopPropagation();
                const index = parseInt(item.dataset.index);
                this.executeAtCommand(options[index]);
            });
        });

        // Position menu below the element
        const rect = element.getBoundingClientRect();
        this.atMenu.style.top = `${rect.bottom + 5}px`;
        this.atMenu.style.left = `${rect.left}px`;
        this.atMenu.classList.remove("hidden");
    },

    /**
     * Hide at menu
     */
    hideAtMenu() {
        this.atMenu.classList.add("hidden");
        this.atQuery = "";
    },

    /**
     * Update selection highlight in menu
     */
    updateAtMenuSelection() {
        const items = this.atMenu.querySelectorAll(".at-menu-item");
        items.forEach((item, index) => {
            item.classList.toggle(
                "selected",
                index === this.atSelectedIndex,
            );
        });
    },

    /**
     * Execute an at command
     */
    async executeAtCommand(option) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const block = range.startContainer.parentElement?.closest(".ce-block");
        if (!block) return;

        const paragraph = block.querySelector(
            ".ce-paragraph, [contenteditable]",
        );
        if (!paragraph) return;

        const text = paragraph.textContent || "";
        const atIndex = text.lastIndexOf("@");

        if (atIndex !== -1) {
            // Get the date in YYYY-MM-DD format
            const dateValue = option.getDate();

            // Replace @ and query with the date directly in the DOM
            const newText = text.substring(0, atIndex) + dateValue;
            paragraph.textContent = newText;

            // Move cursor to end of inserted date
            const textNode = paragraph.firstChild;
            if (textNode) {
                const newRange = document.createRange();
                const cursorPos = Math.min(newText.length, textNode.length);
                newRange.setStart(textNode, cursorPos);
                newRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(newRange);
            }
        }

        this.hideAtMenu();
    },

    /**
     * Setup drag and drop for files
     */
    setupDragDrop() {
        // Create drop zone overlay
        this.dropZone = document.createElement("div");
        this.dropZone.className = "drop-zone";
        this.dropZone.innerHTML = `
            <div class="drop-zone-content">
                <div class="drop-zone-icon">📁</div>
                <div class="drop-zone-text">Drop files here</div>
            </div>
        `;
        document.body.appendChild(this.dropZone);

        let dragCounter = 0;
        let isHandlingDrop = false; // Prevent double handling

        document.addEventListener("dragenter", (e) => {
            e.preventDefault();
            dragCounter++;
            if (e.dataTransfer.types.includes("Files")) {
                this.dropZone.classList.add("active");
            }
        });

        document.addEventListener("dragleave", (e) => {
            e.preventDefault();
            dragCounter--;
            if (dragCounter === 0) {
                this.dropZone.classList.remove("active");
            }
        });

        document.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        document.addEventListener("drop", async (e) => {
            e.preventDefault();
            e.stopPropagation(); // Stop Editor.js from handling this too
            dragCounter = 0;
            this.dropZone.classList.remove("active");

            // Prevent double handling
            if (isHandlingDrop) return;
            isHandlingDrop = true;

            const files = e.dataTransfer.files;
            if (files.length === 0) {
                isHandlingDrop = false;
                return;
            }

            try {
                for (const file of files) {
                    await this.handleFileDrop(file);
                }
            } finally {
                isHandlingDrop = false;
            }
        });
    },

    /**
     * Handle dropped file
     */
    async handleFileDrop(file) {
        try {
            const attachment = await FileHandler.processFile(file);

            if (attachment.isImage) {
                // Insert image block
                await this.instance.blocks.insert("image", {
                    file: {
                        url: FileHandler.getDataUrl(attachment),
                        hash: attachment.hash,
                    },
                    caption: "",
                    withBorder: false,
                    stretched: false,
                    withBackground: false,
                });
            } else {
                // Insert file block (as paragraph with file info for now)
                // Editor.js doesn't have a built-in file block, so we create a custom one
                await this.insertFileBlock(attachment);
            }

            await this.save();
        } catch (error) {
            console.error("Failed to process dropped file:", error);
        }
    },

    /**
     * Insert a file block
     */
    async insertFileBlock(attachment) {
        const icon = Utils.getFileIcon(attachment.ext);
        const size = Utils.formatFileSize(attachment.size);

        await this.instance.blocks.insert("paragraph", {
            text: `${icon} <strong>${attachment.originalName}</strong> <span style="color: #8a8a8a">(${size})</span>`,
        });
    },

    /**
     * Upload image handler for Editor.js
     */
    async uploadImage(file) {
        try {
            const attachment = await FileHandler.processFile(file);
            return {
                success: 1,
                file: {
                    url: FileHandler.getDataUrl(attachment),
                    hash: attachment.hash,
                },
            };
        } catch (error) {
            console.error("Failed to upload image:", error);
            return {
                success: 0,
            };
        }
    },

    /**
     * Upload image by URL (fetches and stores locally)
     */
    async uploadImageByUrl(url) {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const file = new File([blob], "image.png", { type: blob.type });
            return await this.uploadImage(file);
        } catch (error) {
            console.error("Failed to upload image by URL:", error);
            return {
                success: 0,
            };
        }
    },

    /**
     * Save editor content
     */
    async save() {
        try {
            const data = await this.instance.save();

            // Ensure all blocks have IDs
            data.blocks = data.blocks.map((block) => ({
                ...block,
                id: block.id || Utils.generateId(),
            }));

            await Storage.saveContent(data);

            // Cleanup orphaned attachments (debounced to avoid running on every save)
            this.scheduleAttachmentCleanup(data.blocks);

            // Update sidebar
            Sidebar.update(data.blocks);

            // Reassign block IDs in DOM
            this.assignBlockIds();

            console.log("Content saved");
        } catch (error) {
            console.error("Failed to save:", error);
        }
    },

    /**
     * Schedule attachment cleanup (debounced to avoid running too frequently)
     */
    cleanupTimeout: null,
    scheduleAttachmentCleanup(blocks) {
        if (this.cleanupTimeout) {
            clearTimeout(this.cleanupTimeout);
        }
        // Run cleanup after 10 seconds of no saves
        this.cleanupTimeout = setTimeout(async () => {
            await FileHandler.cleanupOrphanedAttachments(blocks);
        }, 10000);
    },

    /**
     * Setup immediate save for paste and critical events
     */
    setupImmediateSave() {
        // Save immediately on paste
        this.container.addEventListener("paste", () => {
            // Wait a bit for Editor.js to process paste, then save
            setTimeout(async () => {
                await this.save();
            }, 100);
        });

        // Save before page unload
        window.addEventListener("beforeunload", async (e) => {
            // Try to save synchronously before unload
            try {
                const data = await this.instance.save();
                data.blocks = data.blocks.map((block) => ({
                    ...block,
                    id: block.id || Utils.generateId(),
                }));
                await Storage.saveContent(data);
                await Storage.saveToVault();
            } catch (err) {
                console.warn("Could not save before unload:", err);
            }
        });

        // Also save on visibility change (when user switches tabs)
        document.addEventListener("visibilitychange", async () => {
            if (document.visibilityState === "hidden") {
                await this.save();
            }
        });
    },

    /**
     * Get current content
     */
    async getContent() {
        return await this.instance.save();
    },

    /**
     * Load content into editor
     */
    async loadContent(data) {
        await this.instance.render(data);
        Sidebar.update(data.blocks);
    },

    /**
     * Clear editor
     */
    async clear() {
        await this.instance.clear();
        Sidebar.update([]);
    },
};

// Make globally available
window.Editor = Editor;
