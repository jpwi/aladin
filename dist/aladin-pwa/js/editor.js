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

        // Restore empty paragraphs from spacer markers
        content.blocks = this.restoreSpacers(content.blocks);

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
                code: {
                    class: CodeBlockTool,
                },
            },

            onChange: Utils.debounce(async () => {
                await this.save();
            }, 150),

            onReady: () => {
                console.log("Editor.js is ready");
                this.setupBlockIds();
                this.setupMarkdownShortcuts();
                this.setupSlashCommands();
                this.setupStarCommands();
                this.setupHashtagCommands();
                this.setupMentionCommands();
                this.setupDragDrop();
                this.setupBlockDragHandles();
                this.setupImmediateSave();
                this.loadTagsFromContent(content.blocks);
                this.loadPeopleFromStorage();
                this.loadMentionsFromContent(content.blocks);
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

            // Check for heading markdown shortcut (# followed by space)
            const headingMatch = text.match(/^(#{1,6})\s/);
            if (headingMatch) {
                e.preventDefault();

                const level = headingMatch[1].length;
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
                return;
            }

            // Check for code block markdown shortcut (``` followed by optional language)
            const codeMatch = text.match(/^```(\w*)$/);
            if (codeMatch) {
                e.preventDefault();

                // Resolve language alias to canonical name
                const languageAlias = codeMatch[1] || '';
                const language = typeof CodeBlockTool !== 'undefined' && CodeBlockTool.resolveLanguage
                    ? CodeBlockTool.resolveLanguage(languageAlias)
                    : (languageAlias || 'javascript');

                // Get current block index
                const blocks = this.container.querySelectorAll(".ce-block");
                let blockIndex = -1;
                blocks.forEach((b, i) => {
                    if (b === block) blockIndex = i;
                });

                if (blockIndex >= 0) {
                    // Delete current block and insert code block
                    await this.instance.blocks.delete(blockIndex);
                    await this.instance.blocks.insert(
                        "code",
                        {
                            code: "",
                            language: language,
                        },
                        {},
                        blockIndex,
                        true,
                    );
                }
                return;
            }
        });
    },

    // Slash command menu state
    slashMenu: null,
    slashQuery: "",
    slashSelectedIndex: 0,

    // Star (*) date command menu state to calculate relative dates
    starMenu: null,
    starSelectedIndex: 0,
    starQuery: "",
    starOptions: [
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

    // Hashtag command menu state
    hashtagMenu: null,
    hashtagSelectedIndex: 0,
    hashtagQuery: "",
    allTags: [], // Will be populated from storage

    // Mention (@) command menu state
    mentionMenu: null,
    mentionSelectedIndex: 0,
    mentionQuery: "",
    allPeople: [], // Will be populated from storage

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
        {
            name: "Code Block",
            shortcut: "/code",
            icon: "</>",
            type: "code",
            data: { code: "", language: "javascript" },
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
     * Setup star (*) command menu for date insertion
     */
    setupStarCommands() {
        // Create star menu element
        this.starMenu = document.createElement("div");
        this.starMenu.className = "star-menu hidden";
        this.starMenu.id = "star-menu";
        document.body.appendChild(this.starMenu);

        // Listen for input in editor
        this.container.addEventListener("input", (e) => {
            this.handleStarInput(e);
        });

        // Handle keyboard navigation in star menu - attach to document with capture phase
        document.addEventListener("keydown", (e) => {
            if (this.starMenu.classList.contains("hidden")) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                e.stopPropagation();
                this.starSelectedIndex = Math.min(
                    this.starSelectedIndex + 1,
                    this.getFilteredStarOptions().length - 1,
                );
                this.updateStarMenuSelection();
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                e.stopPropagation();
                this.starSelectedIndex = Math.max(
                    this.starSelectedIndex - 1,
                    0,
                );
                this.updateStarMenuSelection();
            } else if (e.key === "Enter" || e.key === "Tab") {
                const options = this.getFilteredStarOptions();
                if (options.length > 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    this.executeStarCommand(options[this.starSelectedIndex]);
                }
            } else if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                this.hideStarMenu();
            }
        }, true); // Use capture phase

        // Hide menu when clicking outside
        document.addEventListener("click", (e) => {
            if (
                !e.target.closest(".star-menu") &&
                !e.target.closest(".ce-block")
            ) {
                this.hideStarMenu();
            }
        });
    },

    /**
     * Handle input for star (*) commands
     */
    handleStarInput(e) {
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

        // Check if text contains *
        const starIndex = text.lastIndexOf("*");
        if (starIndex !== -1) {
            // Check if * is at the end or followed by text
            const textAfterStar = text.substring(starIndex + 1);
            this.starQuery = textAfterStar.toLowerCase();
            this.starSelectedIndex = 0;
            this.showStarMenu(paragraph, starIndex);
        } else {
            this.hideStarMenu();
        }
    },

    /**
     * Get filtered options based on query
     */
    getFilteredStarOptions() {
        if (!this.starQuery) return this.starOptions;
        return this.starOptions.filter(
            (opt) => opt.name.toLowerCase().includes(this.starQuery)
        );
    },

    /**
     * Show star menu
     */
    showStarMenu(element, starIndex) {
        const options = this.getFilteredStarOptions();
        if (options.length === 0) {
            this.hideStarMenu();
            return;
        }

        // Build menu HTML
        this.starMenu.innerHTML = options
            .map(
                (opt, index) => `
            <div class="star-menu-item ${index === this.starSelectedIndex ? "selected" : ""}" 
                 data-index="${index}">
                <span class="star-menu-name">${opt.name}</span>
                <span class="star-menu-date">${opt.getDate()}</span>
            </div>
        `,
            )
            .join("");

        // Add click handlers - use mousedown to fire before blur
        this.starMenu.querySelectorAll(".star-menu-item").forEach((item) => {
            item.addEventListener("mousedown", (e) => {
                e.preventDefault(); // Prevent blur
                e.stopPropagation();
                const index = parseInt(item.dataset.index);
                this.executeStarCommand(options[index]);
            });
        });

        // Position menu below the element
        const rect = element.getBoundingClientRect();
        this.starMenu.style.top = `${rect.bottom + 5}px`;
        this.starMenu.style.left = `${rect.left}px`;
        this.starMenu.classList.remove("hidden");
    },

    /**
     * Hide star menu
     */
    hideStarMenu() {
        this.starMenu.classList.add("hidden");
        this.starQuery = "";
    },

    /**
     * Update selection highlight in menu
     */
    updateStarMenuSelection() {
        const items = this.starMenu.querySelectorAll(".star-menu-item");
        items.forEach((item, index) => {
            item.classList.toggle(
                "selected",
                index === this.starSelectedIndex,
            );
        });
    },

    /**
     * Execute a star command (insert date)
     */
    async executeStarCommand(option) {
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
        const starIndex = text.lastIndexOf("*");

        if (starIndex !== -1) {
            // Get the date in YYYY-MM-DD format
            const dateValue = option.getDate();

            // Replace * and query with the date directly in the DOM
            const newText = text.substring(0, starIndex) + dateValue;
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

        this.hideStarMenu();
    },

    // ==========================================
    // Hashtag Commands (#tag)
    // ==========================================

    /**
     * Load existing tags from content blocks and style them in DOM
     */
    loadTagsFromContent(blocks) {
        const tags = new Set();
        const tagRegex = /#([a-zA-Z0-9_-]+)/g;

        blocks.forEach(block => {
            if (block.data?.text) {
                // Strip HTML tags to get plain text
                const plainText = block.data.text.replace(/<[^>]*>/g, '');
                let match;
                while ((match = tagRegex.exec(plainText)) !== null) {
                    tags.add(match[1].toLowerCase());
                }
            }
        });

        this.allTags = Array.from(tags).sort();
        console.log('Loaded tags:', this.allTags);

        // Style hashtags in DOM after editor renders
        setTimeout(() => this.styleHashtagsInDOM(), 100);
    },

    /**
     * Convert plain hashtags in DOM to styled links
     * This ensures hashtags from previous sessions are styled correctly
     */
    styleHashtagsInDOM() {
        const paragraphs = this.container.querySelectorAll('.ce-paragraph');

        paragraphs.forEach(paragraph => {
            // Skip if all hashtags are already properly styled
            // Check if there are plain text hashtags (not inside hashtag-link elements)

            // Check for any plain text hashtags (# followed by alphanumeric, not inside an <a> tag)
            // Skip elements that only have properly styled hashtag-links
            const hasUnstyledHashtags = this.hasUnstyledHashtags(paragraph);

            if (hasUnstyledHashtags) {
                this.processHashtagsInElement(paragraph);
            }
        });
    },

    /**
     * Check if an element contains unstyled hashtags
     */
    hasUnstyledHashtags(element) {
        // Check for <a> tags containing hashtags but without hashtag-link class
        const links = element.querySelectorAll('a');
        for (const link of links) {
            const text = link.textContent.trim();
            if (/^#[a-zA-Z0-9_-]+$/.test(text) && !link.classList.contains('hashtag-link')) {
                return true;
            }
        }

        // Get all text nodes that are NOT inside a hashtag-link or any <a> tag
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Reject if parent is a hashtag-link
                    if (node.parentElement?.classList?.contains('hashtag-link')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    // Reject if parent is any <a> tag
                    if (node.parentElement?.tagName === 'A') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            },
            false
        );

        let node;
        while (node = walker.nextNode()) {
            if (/#[a-zA-Z0-9_-]+/.test(node.textContent)) {
                return true;
            }
        }
        return false;
    },

    /**
     * Process hashtags in an element - handles both plain text and existing links
     */
    processHashtagsInElement(element) {
        // First, clean up any empty links (from previous bugs)
        const emptyLinks = element.querySelectorAll('a:empty');
        emptyLinks.forEach(link => link.remove());

        // Remove links without meaningful text content
        element.querySelectorAll('a').forEach(link => {
            if (!link.textContent.trim()) {
                link.remove();
            }
        });

        // Fix any <a> tags that contain hashtags but don't have the hashtag-link class
        // This happens when Editor.js strips our custom class on save/load
        element.querySelectorAll('a').forEach(link => {
            const text = link.textContent.trim();
            const hashMatch = text.match(/^#([a-zA-Z0-9_-]+)$/);
            if (hashMatch && !link.classList.contains('hashtag-link')) {
                // Add the hashtag-link class and data-tag attribute
                link.classList.add('hashtag-link');
                link.dataset.tag = hashMatch[1];
                link.href = '#';
            }
        });

        // Now process only text nodes that are not inside existing hashtag-links
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Reject if parent is a hashtag-link
                    if (node.parentElement?.classList?.contains('hashtag-link')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    // Reject if parent is any <a> tag (they are handled above)
                    if (node.parentElement?.tagName === 'A') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            },
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            // Check if this text node contains a hashtag
            if (/#[a-zA-Z0-9_-]+/.test(node.textContent)) {
                textNodes.push(node);
            }
        }

        // Process text nodes in reverse to avoid offset issues
        textNodes.reverse().forEach(textNode => {
            const text = textNode.textContent;
            const tagRegex = /#([a-zA-Z0-9_-]+)/g;

            if (tagRegex.test(text)) {
                // Reset regex
                tagRegex.lastIndex = 0;

                const fragment = document.createDocumentFragment();
                let lastIndex = 0;
                let match;

                while ((match = tagRegex.exec(text)) !== null) {
                    // Add text before the hashtag
                    if (match.index > lastIndex) {
                        fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
                    }

                    // Create the hashtag link
                    const link = document.createElement('a');
                    link.href = '#';
                    link.className = 'hashtag-link';
                    link.dataset.tag = match[1];
                    link.textContent = '#' + match[1];
                    fragment.appendChild(link);

                    lastIndex = match.index + match[0].length;
                }

                // Add remaining text after last hashtag
                if (lastIndex < text.length) {
                    fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
                }

                textNode.parentNode.replaceChild(fragment, textNode);
            }
        });
    },

    /**
     * Setup hashtag command menu
     */
    setupHashtagCommands() {
        // Create hashtag menu element
        this.hashtagMenu = document.createElement("div");
        this.hashtagMenu.className = "hashtag-menu hidden";
        this.hashtagMenu.id = "hashtag-menu";
        document.body.appendChild(this.hashtagMenu);

        // Listen for input in editor
        this.container.addEventListener("input", (e) => {
            this.handleHashtagInput(e);
        });

        // Handle keyboard navigation in hashtag menu
        document.addEventListener("keydown", (e) => {
            if (this.hashtagMenu.classList.contains("hidden")) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                e.stopPropagation();
                const options = this.getFilteredHashtags();
                this.hashtagSelectedIndex = Math.min(
                    this.hashtagSelectedIndex + 1,
                    options.length - 1,
                );
                this.updateHashtagMenuSelection();
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                e.stopPropagation();
                this.hashtagSelectedIndex = Math.max(
                    this.hashtagSelectedIndex - 1,
                    0,
                );
                this.updateHashtagMenuSelection();
            } else if (e.key === "Enter" || e.key === "Tab") {
                const options = this.getFilteredHashtags();
                const query = this.hashtagQuery;
                const showCreateOption = query && query.length > 0 && !this.allTags.includes(query);
                const totalOptions = options.length + (showCreateOption ? 1 : 0);

                if (totalOptions > 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    // If selected index is on the "create" option or options is empty
                    if (this.hashtagSelectedIndex >= options.length && showCreateOption) {
                        this.executeHashtagCommand(query);
                    } else if (options.length > 0) {
                        this.executeHashtagCommand(options[this.hashtagSelectedIndex]);
                    } else if (showCreateOption) {
                        this.executeHashtagCommand(query);
                    }
                }
            } else if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                this.hideHashtagMenu();
            } else if (e.key === " ") {
                // Space completes current tag input
                const query = this.hashtagQuery;
                if (query && query.length > 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.executeHashtagCommand(query);
                }
            }
        }, true);

        // Hide menu when clicking outside
        document.addEventListener("click", (e) => {
            if (
                !e.target.closest(".hashtag-menu") &&
                !e.target.closest(".ce-block")
            ) {
                this.hideHashtagMenu();
            }
        });

        // Setup click handler for hashtag links
        document.addEventListener("click", (e) => {
            const hashtagLink = e.target.closest(".hashtag-link");
            if (hashtagLink) {
                e.preventDefault();
                const tag = hashtagLink.dataset.tag;
                if (tag) {
                    this.showTagOccurrences(tag);
                }
            }
        });
    },

    /**
     * Handle input for hashtag commands
     */
    handleHashtagInput(e) {
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

        // Find the last # that could be the start of a tag being typed
        // Look for # followed by optional word characters at the end of text or before cursor
        const cursorOffset = this.getCursorOffsetInElement(paragraph);
        const textBeforeCursor = text.substring(0, cursorOffset);

        // Match # followed by optional tag characters at end
        const hashMatch = textBeforeCursor.match(/#([a-zA-Z0-9_-]*)$/);

        if (hashMatch) {
            this.hashtagQuery = hashMatch[1].toLowerCase();
            this.hashtagSelectedIndex = 0;
            this.showHashtagMenu(paragraph);
        } else {
            this.hideHashtagMenu();
        }
    },

    /**
     * Get cursor offset within element
     */
    getCursorOffsetInElement(element) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return 0;

        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.endContainer, range.endOffset);

        return preCaretRange.toString().length;
    },

    /**
     * Get filtered hashtags based on query
     */
    getFilteredHashtags() {
        if (!this.hashtagQuery) return this.allTags.slice(0, 10);
        return this.allTags.filter(
            (tag) => tag.toLowerCase().includes(this.hashtagQuery)
        ).slice(0, 10);
    },

    /**
     * Show hashtag menu
     */
    showHashtagMenu(element) {
        const filteredTags = this.getFilteredHashtags();
        const query = this.hashtagQuery;

        // If we have a query that's not an existing tag, show option to create it
        const showCreateOption = query && query.length > 0 && !this.allTags.includes(query.toLowerCase());

        // If no filtered tags and no create option and no query, hide menu
        if (filteredTags.length === 0 && !showCreateOption) {
            this.hideHashtagMenu();
            return;
        }

        // Build menu HTML
        let menuHtml = '';

        // Add existing tag suggestions
        filteredTags.forEach((tag, index) => {
            menuHtml += `
                <div class="hashtag-menu-item ${index === this.hashtagSelectedIndex ? "selected" : ""}" 
                     data-index="${index}" data-tag="${tag}">
                    <span class="hashtag-menu-icon">#</span>
                    <span class="hashtag-menu-name">${tag}</span>
                </div>
            `;
        });

        // Add "create new tag" option if query doesn't match existing
        if (showCreateOption) {
            const createIndex = filteredTags.length;
            menuHtml += `
                <div class="hashtag-menu-item hashtag-menu-create ${createIndex === this.hashtagSelectedIndex ? "selected" : ""}" 
                     data-index="${createIndex}" data-tag="${query}">
                    <span class="hashtag-menu-icon">+</span>
                    <span class="hashtag-menu-name">Create #${query}</span>
                </div>
            `;
        }

        if (!menuHtml) {
            this.hideHashtagMenu();
            return;
        }

        this.hashtagMenu.innerHTML = menuHtml;

        // Add click handlers
        this.hashtagMenu.querySelectorAll(".hashtag-menu-item").forEach((item) => {
            item.addEventListener("mousedown", (e) => {
                e.preventDefault();
                e.stopPropagation();
                const tag = item.dataset.tag;
                this.executeHashtagCommand(tag);
            });
        });

        // Position menu below the element
        const rect = element.getBoundingClientRect();
        this.hashtagMenu.style.top = `${rect.bottom + 5}px`;
        this.hashtagMenu.style.left = `${rect.left}px`;
        this.hashtagMenu.classList.remove("hidden");
    },

    /**
     * Hide hashtag menu
     */
    hideHashtagMenu() {
        this.hashtagMenu.classList.add("hidden");
        this.hashtagQuery = "";
    },

    /**
     * Update selection highlight in hashtag menu
     */
    updateHashtagMenuSelection() {
        const items = this.hashtagMenu.querySelectorAll(".hashtag-menu-item");
        items.forEach((item, index) => {
            item.classList.toggle(
                "selected",
                index === this.hashtagSelectedIndex,
            );
        });
    },

    /**
     * Execute a hashtag command - insert tag as clickable link
     */
    async executeHashtagCommand(tagName) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const block = range.startContainer.parentElement?.closest(".ce-block");
        if (!block) return;

        const paragraph = block.querySelector(
            ".ce-paragraph, [contenteditable]",
        );
        if (!paragraph) return;

        // Get current text and find the # position
        const text = paragraph.textContent || "";
        const cursorOffset = this.getCursorOffsetInElement(paragraph);
        const textBeforeCursor = text.substring(0, cursorOffset);

        const hashMatch = textBeforeCursor.match(/#([a-zA-Z0-9_-]*)$/);
        if (!hashMatch) {
            this.hideHashtagMenu();
            return;
        }

        const hashIndex = textBeforeCursor.lastIndexOf('#');
        const beforeHash = text.substring(0, hashIndex);
        const afterCursor = text.substring(cursorOffset);

        // Create the hashtag link HTML
        const tagLink = `<a href="#" class="hashtag-link" data-tag="${tagName}">#${tagName}</a>`;

        // Update paragraph with the link
        paragraph.innerHTML = beforeHash + tagLink + ' ' + afterCursor;

        // Add tag to allTags if new
        if (!this.allTags.includes(tagName.toLowerCase())) {
            this.allTags.push(tagName.toLowerCase());
            this.allTags.sort();
        }

        // Move cursor after the inserted tag
        this.moveCursorToEnd(paragraph);

        this.hideHashtagMenu();

        // Trigger save
        await this.save();
    },

    /**
     * Move cursor to end of element
     */
    moveCursorToEnd(element) {
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(element);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    },

    /**
     * Show modal with all occurrences of a tag
     */
    async showTagOccurrences(tagName) {
        try {
            const data = await this.instance.save();
            const occurrences = [];
            const tagRegex = new RegExp(`#${tagName}\\b`, 'gi');

            data.blocks.forEach((block, index) => {
                if (block.data?.text) {
                    const plainText = block.data.text.replace(/<[^>]*>/g, '');
                    if (tagRegex.test(plainText)) {
                        // Get context around the tag
                        let context = plainText;
                        if (context.length > 100) {
                            const tagIndex = plainText.toLowerCase().indexOf('#' + tagName.toLowerCase());
                            const start = Math.max(0, tagIndex - 40);
                            const end = Math.min(plainText.length, tagIndex + 60);
                            context = (start > 0 ? '...' : '') + plainText.substring(start, end) + (end < plainText.length ? '...' : '');
                        }

                        // Find parent heading for context
                        let parentHeading = 'Document';
                        for (let i = index - 1; i >= 0; i--) {
                            if (data.blocks[i].type === 'header') {
                                parentHeading = data.blocks[i].data?.text || 'Untitled';
                                break;
                            }
                        }

                        occurrences.push({
                            blockId: block.id,
                            blockIndex: index,
                            context: context,
                            parentHeading: parentHeading,
                            type: block.type
                        });
                    }
                    // Reset regex lastIndex
                    tagRegex.lastIndex = 0;
                }
            });

            // Build modal content
            let modalBody = `
                <div class="tag-occurrences">
                    <div class="tag-header">
                        <span class="tag-badge">#${Utils.escapeHtml(tagName)}</span>
                        <span class="tag-count">${occurrences.length} occurrence${occurrences.length !== 1 ? 's' : ''}</span>
                    </div>
            `;

            if (occurrences.length === 0) {
                modalBody += `<p class="tag-empty">No occurrences found for this tag.</p>`;
            } else {
                modalBody += `<div class="tag-occurrence-list">`;
                occurrences.forEach((occ, i) => {
                    modalBody += `
                        <div class="tag-occurrence-item" data-block-id="${occ.blockId}">
                            <div class="tag-occurrence-section">${Utils.escapeHtml(occ.parentHeading)}</div>
                            <div class="tag-occurrence-context">${Utils.escapeHtml(occ.context)}</div>
                        </div>
                    `;
                });
                modalBody += `</div>`;
            }

            modalBody += `</div>`;

            Modal.show({
                title: `Tag: #${tagName}`,
                allowClose: true,
                body: modalBody,
                footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Close</button>`,
            });

            // Add click handlers to jump to occurrence
            setTimeout(() => {
                document.querySelectorAll('.tag-occurrence-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const blockId = item.dataset.blockId;
                        Modal.hide();
                        this.scrollToBlock(blockId);
                    });
                });
            }, 100);

        } catch (error) {
            console.error('Error showing tag occurrences:', error);
        }
    },

    /**
     * Scroll to a specific block by ID
     */
    scrollToBlock(blockId) {
        const blockElement = document.getElementById(blockId);
        if (blockElement) {
            blockElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            blockElement.classList.add('highlight-flash');
            setTimeout(() => {
                blockElement.classList.remove('highlight-flash');
            }, 2000);
        }
    },

    // ==========================================
    // Mention Commands (@person)
    // ==========================================

    /**
     * Load people from storage
     */
    async loadPeopleFromStorage() {
        try {
            const storedPeople = await Storage.getSetting('people', []);
            this.allPeople = Array.isArray(storedPeople) ? storedPeople.sort() : [];
            console.log('Loaded people:', this.allPeople);
        } catch (error) {
            console.error('Failed to load people:', error);
            this.allPeople = [];
        }
    },

    /**
     * Save people to storage
     */
    async savePeopleToStorage() {
        try {
            await Storage.saveSetting('people', this.allPeople);
        } catch (error) {
            console.error('Failed to save people:', error);
        }
    },

    /**
     * Load mentions from content blocks and style them in DOM
     */
    loadMentionsFromContent(blocks) {
        const people = new Set(this.allPeople);
        const mentionRegex = /@([a-zA-Z0-9_-]+(?:\s+[a-zA-Z0-9_-]+)?)/g;

        blocks.forEach(block => {
            if (block.data?.text) {
                // Strip HTML tags to get plain text
                const plainText = block.data.text.replace(/<[^>]*>/g, '');
                let match;
                while ((match = mentionRegex.exec(plainText)) !== null) {
                    people.add(match[1]);
                }
            }
        });

        this.allPeople = Array.from(people).sort();

        // Style mentions in DOM after editor renders
        setTimeout(() => this.styleMentionsInDOM(), 100);
    },

    /**
     * Convert plain mentions in DOM to styled links
     */
    styleMentionsInDOM() {
        const paragraphs = this.container.querySelectorAll('.ce-paragraph');

        paragraphs.forEach(paragraph => {
            const hasUnstyledMentions = this.hasUnstyledMentions(paragraph);
            if (hasUnstyledMentions) {
                this.processMentionsInElement(paragraph);
            }
        });
    },

    /**
     * Check if an element contains unstyled mentions
     */
    hasUnstyledMentions(element) {
        // Check for <a> tags containing mentions but without mention-link class
        const links = element.querySelectorAll('a');
        for (const link of links) {
            const text = link.textContent.trim();
            if (/^@[a-zA-Z0-9_-]+/.test(text) && !link.classList.contains('mention-link')) {
                return true;
            }
        }

        // Get all text nodes that are NOT inside a mention-link or any <a> tag
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    if (node.parentElement?.classList?.contains('mention-link')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    if (node.parentElement?.tagName === 'A') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            },
            false
        );

        let node;
        while (node = walker.nextNode()) {
            if (/@[a-zA-Z0-9_-]+/.test(node.textContent)) {
                return true;
            }
        }
        return false;
    },

    /**
     * Process mentions in an element - handles both plain text and existing links
     */
    processMentionsInElement(element) {
        // Clean up empty links
        element.querySelectorAll('a:empty').forEach(link => link.remove());
        element.querySelectorAll('a').forEach(link => {
            if (!link.textContent.trim()) {
                link.remove();
            }
        });

        // Fix <a> tags containing mentions but missing mention-link class
        element.querySelectorAll('a').forEach(link => {
            const text = link.textContent.trim();
            const mentionMatch = text.match(/^@([a-zA-Z0-9_-]+)$/);
            if (mentionMatch && !link.classList.contains('mention-link')) {
                link.classList.add('mention-link');
                link.dataset.person = mentionMatch[1];
                link.href = '#';
            }
        });

        // Process text nodes
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    if (node.parentElement?.classList?.contains('mention-link')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    if (node.parentElement?.tagName === 'A') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            },
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            if (/@[a-zA-Z0-9_-]+/.test(node.textContent)) {
                textNodes.push(node);
            }
        }

        // Process text nodes in reverse
        textNodes.reverse().forEach(textNode => {
            const text = textNode.textContent;
            const mentionRegex = /@([a-zA-Z0-9_-]+)/g;

            if (mentionRegex.test(text)) {
                mentionRegex.lastIndex = 0;

                const fragment = document.createDocumentFragment();
                let lastIndex = 0;
                let match;

                while ((match = mentionRegex.exec(text)) !== null) {
                    if (match.index > lastIndex) {
                        fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
                    }

                    const link = document.createElement('a');
                    link.href = '#';
                    link.className = 'mention-link';
                    link.dataset.person = match[1];
                    link.textContent = '@' + match[1];
                    fragment.appendChild(link);

                    lastIndex = match.index + match[0].length;
                }

                if (lastIndex < text.length) {
                    fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
                }

                textNode.parentNode.replaceChild(fragment, textNode);
            }
        });
    },

    /**
     * Setup mention (@) command menu
     */
    setupMentionCommands() {
        // Create mention menu element
        this.mentionMenu = document.createElement("div");
        this.mentionMenu.className = "mention-menu hidden";
        this.mentionMenu.id = "mention-menu";
        document.body.appendChild(this.mentionMenu);

        // Listen for input in editor
        this.container.addEventListener("input", (e) => {
            this.handleMentionInput(e);
        });

        // Handle keyboard navigation in mention menu
        document.addEventListener("keydown", (e) => {
            if (this.mentionMenu.classList.contains("hidden")) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                e.stopPropagation();
                const options = this.getFilteredPeople();
                const showCreateOption = this.mentionQuery && this.mentionQuery.length > 0 &&
                    !this.allPeople.some(p => p.toLowerCase() === this.mentionQuery.toLowerCase());
                const totalOptions = options.length + (showCreateOption ? 1 : 0);
                this.mentionSelectedIndex = Math.min(this.mentionSelectedIndex + 1, totalOptions - 1);
                this.updateMentionMenuSelection();
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                e.stopPropagation();
                this.mentionSelectedIndex = Math.max(this.mentionSelectedIndex - 1, 0);
                this.updateMentionMenuSelection();
            } else if (e.key === "Enter" || e.key === "Tab") {
                const options = this.getFilteredPeople();
                const query = this.mentionQuery;
                const showCreateOption = query && query.length > 0 &&
                    !this.allPeople.some(p => p.toLowerCase() === query.toLowerCase());
                const totalOptions = options.length + (showCreateOption ? 1 : 0);

                if (totalOptions > 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    if (this.mentionSelectedIndex >= options.length && showCreateOption) {
                        this.executeMentionCommand(query);
                    } else if (options.length > 0) {
                        this.executeMentionCommand(options[this.mentionSelectedIndex]);
                    } else if (showCreateOption) {
                        this.executeMentionCommand(query);
                    }
                }
            } else if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                this.hideMentionMenu();
            } else if (e.key === " ") {
                const query = this.mentionQuery;
                if (query && query.length > 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.executeMentionCommand(query);
                }
            }
        }, true);

        // Hide menu when clicking outside
        document.addEventListener("click", (e) => {
            if (!e.target.closest(".mention-menu") && !e.target.closest(".ce-block")) {
                this.hideMentionMenu();
            }
        });

        // Setup click handler for mention links
        document.addEventListener("click", (e) => {
            const mentionLink = e.target.closest(".mention-link");
            if (mentionLink) {
                e.preventDefault();
                const person = mentionLink.dataset.person;
                if (person) {
                    this.showMentionOccurrences(person);
                }
            }
        });
    },

    /**
     * Handle input for mention commands
     */
    handleMentionInput(e) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const block = range.startContainer.parentElement?.closest(".ce-block");
        if (!block) return;

        const paragraph = block.querySelector(".ce-paragraph, [contenteditable]");
        if (!paragraph) return;

        const text = paragraph.textContent || "";
        const cursorOffset = this.getCursorOffsetInElement(paragraph);
        const textBeforeCursor = text.substring(0, cursorOffset);

        // Match @ followed by optional name characters at end
        const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_-]*)$/);

        if (mentionMatch) {
            this.mentionQuery = mentionMatch[1].toLowerCase();
            this.mentionSelectedIndex = 0;
            this.showMentionMenu(paragraph);
        } else {
            this.hideMentionMenu();
        }
    },

    /**
     * Get filtered people based on query
     */
    getFilteredPeople() {
        if (!this.mentionQuery) return this.allPeople.slice(0, 10);
        return this.allPeople.filter(
            (person) => person.toLowerCase().includes(this.mentionQuery)
        ).slice(0, 10);
    },

    /**
     * Show mention menu
     */
    showMentionMenu(element) {
        const filteredPeople = this.getFilteredPeople();
        const query = this.mentionQuery;

        const showCreateOption = query && query.length > 0 &&
            !this.allPeople.some(p => p.toLowerCase() === query.toLowerCase());

        if (filteredPeople.length === 0 && !showCreateOption) {
            this.hideMentionMenu();
            return;
        }

        let menuHtml = '';

        filteredPeople.forEach((person, index) => {
            menuHtml += `
                <div class="mention-menu-item ${index === this.mentionSelectedIndex ? "selected" : ""}" 
                     data-index="${index}" data-person="${Utils.escapeHtml(person)}">
                    <span class="mention-menu-icon">@</span>
                    <span class="mention-menu-name">${Utils.escapeHtml(person)}</span>
                </div>
            `;
        });

        if (showCreateOption) {
            const createIndex = filteredPeople.length;
            menuHtml += `
                <div class="mention-menu-item mention-menu-create ${createIndex === this.mentionSelectedIndex ? "selected" : ""}" 
                     data-index="${createIndex}" data-person="${Utils.escapeHtml(query)}">
                    <span class="mention-menu-icon">+</span>
                    <span class="mention-menu-name">Add @${Utils.escapeHtml(query)}</span>
                </div>
            `;
        }

        if (!menuHtml) {
            this.hideMentionMenu();
            return;
        }

        this.mentionMenu.innerHTML = menuHtml;

        this.mentionMenu.querySelectorAll(".mention-menu-item").forEach((item) => {
            item.addEventListener("mousedown", (e) => {
                e.preventDefault();
                e.stopPropagation();
                const person = item.dataset.person;
                this.executeMentionCommand(person);
            });
        });

        const rect = element.getBoundingClientRect();
        this.mentionMenu.style.top = `${rect.bottom + 5}px`;
        this.mentionMenu.style.left = `${rect.left}px`;
        this.mentionMenu.classList.remove("hidden");
    },

    /**
     * Hide mention menu
     */
    hideMentionMenu() {
        this.mentionMenu.classList.add("hidden");
        this.mentionQuery = "";
    },

    /**
     * Update selection highlight in mention menu
     */
    updateMentionMenuSelection() {
        const items = this.mentionMenu.querySelectorAll(".mention-menu-item");
        items.forEach((item, index) => {
            item.classList.toggle("selected", index === this.mentionSelectedIndex);
        });
    },

    /**
     * Execute a mention command - insert person as clickable link
     */
    async executeMentionCommand(personName) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const block = range.startContainer.parentElement?.closest(".ce-block");
        if (!block) return;

        const paragraph = block.querySelector(".ce-paragraph, [contenteditable]");
        if (!paragraph) return;

        const text = paragraph.textContent || "";
        const cursorOffset = this.getCursorOffsetInElement(paragraph);
        const textBeforeCursor = text.substring(0, cursorOffset);

        const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_-]*)$/);
        if (!mentionMatch) {
            this.hideMentionMenu();
            return;
        }

        const atIndex = textBeforeCursor.lastIndexOf('@');
        const beforeAt = text.substring(0, atIndex);
        const afterCursor = text.substring(cursorOffset);

        const mentionLink = `<a href="#" class="mention-link" data-person="${personName}">@${personName}</a>`;

        paragraph.innerHTML = beforeAt + mentionLink + ' ' + afterCursor;

        // Add person to allPeople if new
        if (!this.allPeople.some(p => p.toLowerCase() === personName.toLowerCase())) {
            this.allPeople.push(personName);
            this.allPeople.sort();
            await this.savePeopleToStorage();
        }

        this.moveCursorToEnd(paragraph);
        this.hideMentionMenu();
        await this.save();
    },

    /**
     * Show modal with all occurrences of a person mention
     */
    async showMentionOccurrences(personName) {
        try {
            const data = await this.instance.save();
            const occurrences = [];
            const mentionRegex = new RegExp(`@${personName}\\b`, 'gi');

            data.blocks.forEach((block, index) => {
                if (block.data?.text) {
                    const plainText = block.data.text.replace(/<[^>]*>/g, '');
                    if (mentionRegex.test(plainText)) {
                        let context = plainText;
                        if (context.length > 100) {
                            const mentionIndex = plainText.toLowerCase().indexOf('@' + personName.toLowerCase());
                            const start = Math.max(0, mentionIndex - 40);
                            const end = Math.min(plainText.length, mentionIndex + 60);
                            context = (start > 0 ? '...' : '') + plainText.substring(start, end) + (end < plainText.length ? '...' : '');
                        }

                        let parentHeading = 'Document';
                        for (let i = index - 1; i >= 0; i--) {
                            if (data.blocks[i].type === 'header') {
                                parentHeading = data.blocks[i].data?.text || 'Untitled';
                                break;
                            }
                        }

                        occurrences.push({
                            blockId: block.id,
                            blockIndex: index,
                            context: context,
                            parentHeading: parentHeading,
                            type: block.type
                        });
                    }
                    mentionRegex.lastIndex = 0;
                }
            });

            let modalBody = `
                <div class="mention-occurrences">
                    <div class="mention-header">
                        <span class="mention-badge">@${Utils.escapeHtml(personName)}</span>
                        <span class="mention-count">${occurrences.length} occurrence${occurrences.length !== 1 ? 's' : ''}</span>
                    </div>
            `;

            if (occurrences.length === 0) {
                modalBody += `<p class="mention-empty">No occurrences found for this person.</p>`;
            } else {
                modalBody += `<div class="mention-occurrence-list">`;
                occurrences.forEach((occ, i) => {
                    modalBody += `
                        <div class="mention-occurrence-item" data-block-id="${occ.blockId}">
                            <div class="mention-occurrence-section">${Utils.escapeHtml(occ.parentHeading)}</div>
                            <div class="mention-occurrence-context">${Utils.escapeHtml(occ.context)}</div>
                        </div>
                    `;
                });
                modalBody += `</div>`;
            }

            modalBody += `</div>`;

            Modal.show({
                title: `Person: @${personName}`,
                allowClose: true,
                body: modalBody,
                footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Close</button>`,
            });

            setTimeout(() => {
                document.querySelectorAll('.mention-occurrence-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const blockId = item.dataset.blockId;
                        Modal.hide();
                        this.scrollToBlock(blockId);
                    });
                });
            }, 100);

        } catch (error) {
            console.error('Error showing mention occurrences:', error);
        }
    },

    // Block drag state
    draggedBlock: null,
    draggedBlockIndex: null,
    dropIndicator: null,

    /**
     * Setup drag handles for block reordering
     * Enhances the existing Editor.js toolbar settings button with drag functionality
     */
    setupBlockDragHandles() {
        // Create drop indicator element
        this.dropIndicator = document.createElement("div");
        this.dropIndicator.className = "block-drop-indicator hidden";
        document.body.appendChild(this.dropIndicator);

        // Observe DOM changes to enhance Editor.js toolbars with drag functionality
        const observer = new MutationObserver(() => {
            this.enhanceToolbarWithDrag();
        });

        observer.observe(this.container, {
            childList: true,
            subtree: true,
        });

        // Also observe the document body for the toolbar (Editor.js may append it there)
        const bodyObserver = new MutationObserver(() => {
            this.enhanceToolbarWithDrag();
        });
        bodyObserver.observe(document.body, {
            childList: true,
            subtree: false,
        });

        // Initial setup
        this.enhanceToolbarWithDrag();
        this.setupBlockDropZones();
    },

    /**
     * Enhance Editor.js toolbar settings button with drag functionality
     */
    enhanceToolbarWithDrag() {
        // Find the Editor.js settings button (the 6-dot button)
        const settingsBtn = document.querySelector('.ce-toolbar__settings-btn');
        if (!settingsBtn || settingsBtn.dataset.dragEnhanced) return;

        settingsBtn.dataset.dragEnhanced = 'true';
        settingsBtn.draggable = true;
        settingsBtn.title = 'Drag to reorder • Click for settings';
        settingsBtn.style.cursor = 'grab';

        // Drag start on settings button
        settingsBtn.addEventListener('dragstart', (e) => {
            // Find current focused block
            const focusedBlock = document.querySelector('.ce-block--focused');
            if (!focusedBlock) {
                e.preventDefault();
                return;
            }

            this.draggedBlock = focusedBlock;
            this.draggedBlockIndex = this.getBlockIndex(focusedBlock);
            focusedBlock.classList.add('dragging');

            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', 'block');

            this.container.classList.add('block-dragging');

            // Prevent text selection during drag
            document.body.style.userSelect = 'none';
        });

        // Drag end
        settingsBtn.addEventListener('dragend', (e) => {
            if (this.draggedBlock) {
                this.draggedBlock.classList.remove('dragging');
            }
            this.container.classList.remove('block-dragging');
            this.dropIndicator.classList.add('hidden');
            this.draggedBlock = null;
            this.draggedBlockIndex = null;

            // Re-enable text selection
            document.body.style.userSelect = '';

            // Remove all drag-over classes
            this.container.querySelectorAll('.ce-block').forEach(b => {
                b.classList.remove('drag-over-top', 'drag-over-bottom');
            });
        });
    },

    /**
     * Setup drop zones on all blocks
     */
    setupBlockDropZones() {
        // Use event delegation on the container for drop zones
        this.container.addEventListener('dragover', (e) => {
            if (!this.draggedBlock) return;

            const block = e.target.closest('.ce-block');
            if (!block || this.draggedBlock === block) return;

            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            // Clear all previous indicators
            this.container.querySelectorAll('.ce-block').forEach(b => {
                if (b !== block) {
                    b.classList.remove('drag-over-top', 'drag-over-bottom');
                }
            });

            // Determine if dropping above or below this block
            const rect = block.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            const isAbove = e.clientY < midpoint;

            // Clear previous indicators on this block
            block.classList.remove('drag-over-top', 'drag-over-bottom');

            // Add appropriate indicator
            if (isAbove) {
                block.classList.add('drag-over-top');
            } else {
                block.classList.add('drag-over-bottom');
            }
        });

        this.container.addEventListener('dragleave', (e) => {
            const block = e.target.closest('.ce-block');
            if (block && !block.contains(e.relatedTarget)) {
                block.classList.remove('drag-over-top', 'drag-over-bottom');
            }
        });

        this.container.addEventListener('drop', async (e) => {
            if (!this.draggedBlock) return;

            const block = e.target.closest('.ce-block');
            if (!block || this.draggedBlock === block) return;

            e.preventDefault();

            const fromIndex = this.draggedBlockIndex;
            const toBlockIndex = this.getBlockIndex(block);

            // Determine if dropping above or below
            const rect = block.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            const isAbove = e.clientY < midpoint;

            let toIndex = isAbove ? toBlockIndex : toBlockIndex + 1;

            // Adjust if moving down (since the block will be removed first)
            if (fromIndex < toIndex) {
                toIndex--;
            }

            // Clear indicators
            block.classList.remove('drag-over-top', 'drag-over-bottom');

            // Move the block using Editor.js API
            if (fromIndex !== toIndex && fromIndex >= 0) {
                try {
                    await this.instance.blocks.move(toIndex, fromIndex);
                    await this.save();
                    console.log(`Block moved from ${fromIndex} to ${toIndex}`);
                } catch (error) {
                    console.error('Failed to move block:', error);
                }
            }
        });
    },

    /**
     * Get the index of a block element
     */
    getBlockIndex(blockElement) {
        const blocks = this.container.querySelectorAll('.ce-block');
        let index = -1;
        blocks.forEach((b, i) => {
            if (b === blockElement) index = i;
        });
        return index;
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
     * Captures empty blocks from DOM before Editor.js strips them
     */
    async save() {
        try {
            // First, capture empty blocks from DOM before Editor.js filters them
            const emptyBlockIds = this.captureEmptyBlockIds();

            const data = await this.instance.save();

            // Ensure all blocks have IDs
            data.blocks = data.blocks.map((block) => ({
                ...block,
                id: block.id || Utils.generateId(),
            }));

            // Re-insert empty paragraphs that Editor.js stripped
            data.blocks = this.reinsertEmptyBlocks(data.blocks, emptyBlockIds);

            // Convert empty paragraphs to spacer markers before storage
            // This preserves intentional empty lines for styling
            data.blocks = this.preserveSpacers(data.blocks);

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

    /**
     * Preserve empty paragraphs by marking them as spacers
     * Editor.js strips empty blocks, so we mark them with a special invisible character
     */
    preserveSpacers(blocks) {
        return blocks.map((block) => {
            if (block.type === "paragraph") {
                const text = block.data?.text || "";
                // Check if paragraph is empty or only whitespace/br tags
                const stripped = text
                    .replace(/<br\s*\/?>/gi, "")
                    .replace(/&nbsp;/gi, "")
                    .trim();
                if (stripped === "" || stripped === "\u200B") {
                    // Mark as spacer for storage
                    return {
                        ...block,
                        type: "spacer",
                        data: { preserved: true },
                    };
                }
            }
            return block;
        });
    },

    /**
     * Restore spacer markers back to empty paragraphs for editing
     */
    restoreSpacers(blocks) {
        return blocks.map((block) => {
            if (block.type === "spacer" && block.data?.preserved) {
                // Restore as empty paragraph with zero-width space to prevent Editor.js from removing
                return {
                    ...block,
                    type: "paragraph",
                    data: { text: "<br>" },
                };
            }
            return block;
        });
    },

    /**
     * Capture IDs and positions of empty blocks from DOM before Editor.js strips them
     */
    captureEmptyBlockIds() {
        const emptyBlocks = [];
        const blockElements = this.container.querySelectorAll(".ce-block");

        blockElements.forEach((blockEl, index) => {
            const contentEl = blockEl.querySelector(
                '.ce-paragraph, [contenteditable="true"]',
            );
            if (contentEl) {
                const text = contentEl.textContent?.trim() || "";
                const innerHTML = contentEl.innerHTML?.trim() || "";

                // Check if the block is effectively empty
                const isEmptyText = text === "" || text === "\u200B";
                const isEmptyHtml =
                    innerHTML === "" ||
                    innerHTML === "<br>" ||
                    innerHTML === "&nbsp;";

                if (isEmptyText || isEmptyHtml) {
                    const blockId =
                        blockEl.getAttribute("data-id") || blockEl.id;
                    emptyBlocks.push({
                        id: blockId,
                        index: index,
                        type: "paragraph",
                    });
                }
            }
        });

        return emptyBlocks;
    },

    /**
     * Reinsert empty blocks that Editor.js stripped during save
     */
    reinsertEmptyBlocks(blocks, emptyBlockIds) {
        if (!emptyBlockIds || emptyBlockIds.length === 0) {
            return blocks;
        }

        // Build a set of existing block IDs
        const existingIds = new Set(blocks.map((b) => b.id));

        // Create a new array with empty blocks reinserted
        const result = [...blocks];

        // Sort by index to insert in correct order
        const sortedEmpty = [...emptyBlockIds].sort(
            (a, b) => a.index - b.index,
        );

        for (const empty of sortedEmpty) {
            // Only reinsert if this block was stripped (not in existing blocks)
            if (!existingIds.has(empty.id)) {
                // Create empty paragraph block
                const emptyBlock = {
                    id: empty.id || Utils.generateId(),
                    type: "paragraph",
                    data: { text: "<br>" },
                };

                // Insert at the original position (capped to array length)
                const insertIndex = Math.min(empty.index, result.length);
                result.splice(insertIndex, 0, emptyBlock);
            }
        }

        return result;
    },
};

// Make globally available
window.Editor = Editor;
