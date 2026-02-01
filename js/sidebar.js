/**
 * Sidebar - Navigation tree and search functionality
 */

const Sidebar = {
    searchInput: null,
    searchResults: null,
    headingTree: null,
    resizeHandle: null,
    sidebar: null,
    themeToggle: null,
    dailyNoteBtn: null,
    peopleBtn: null,

    // Heading index for search
    headingIndex: [],

    // Currently active heading
    activeHeadingId: null,

    /**
     * Initialize sidebar
     */
    init() {
        this.searchInput = document.getElementById("search-input");
        this.searchResults = document.getElementById("search-results");
        this.headingTree = document.getElementById("heading-tree");
        this.resizeHandle = document.getElementById("resize-handle");
        this.sidebar = document.getElementById("sidebar");
        this.themeToggle = document.getElementById("theme-toggle");
        this.dailyNoteBtn = document.getElementById("daily-note-btn");
        this.peopleBtn = document.getElementById("people-btn");

        this.setupSearch();
        this.setupResize();
        this.loadSidebarWidth();
        this.setupHashNavigation();
        this.setupTheme();
        this.setupDailyNote();
        this.setupPeopleManager();
    },

    /**
     * Setup people manager functionality
     */
    setupPeopleManager() {
        if (!this.peopleBtn) return;

        this.peopleBtn.addEventListener("click", () => {
            this.showPeopleManager();
        });
    },

    /**
     * Show people manager modal
     */
    async showPeopleManager() {
        const people = Editor.allPeople || [];

        let modalBody = `
            <div class="people-manager">
                <div class="people-manager-header">
                    <input type="text" id="new-person-input" placeholder="Enter person name..." />
                    <button id="add-person-btn">Add</button>
                </div>
                <div class="people-list" id="people-list">
                    ${people.length === 0 ? '<p class="people-list-empty">No people added yet. Add someone using the input above or type @ in the editor.</p>' : ''}
                    ${people.map(person => `
                        <div class="person-item" data-person="${Utils.escapeHtml(person)}">
                            <span class="person-name">
                                <span class="person-icon">@</span>
                                ${Utils.escapeHtml(person)}
                            </span>
                            <span class="person-actions">
                                <button class="delete-btn" data-person="${Utils.escapeHtml(person)}">Delete</button>
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        Modal.show({
            title: "Manage People",
            allowClose: true,
            body: modalBody,
            footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Close</button>`,
        });

        // Setup event handlers after modal is shown
        setTimeout(() => {
            const input = document.getElementById('new-person-input');
            const addBtn = document.getElementById('add-person-btn');
            const peopleList = document.getElementById('people-list');

            if (addBtn && input) {
                addBtn.addEventListener('click', async () => {
                    const name = input.value.trim();
                    if (name && !Editor.allPeople.some(p => p.toLowerCase() === name.toLowerCase())) {
                        Editor.allPeople.push(name);
                        Editor.allPeople.sort();
                        await Editor.savePeopleToStorage();
                        Modal.hide();
                        this.showPeopleManager();
                    }
                });

                input.addEventListener('keydown', async (e) => {
                    if (e.key === 'Enter') {
                        const name = input.value.trim();
                        if (name && !Editor.allPeople.some(p => p.toLowerCase() === name.toLowerCase())) {
                            Editor.allPeople.push(name);
                            Editor.allPeople.sort();
                            await Editor.savePeopleToStorage();
                            Modal.hide();
                            this.showPeopleManager();
                        }
                    }
                });

                input.focus();
            }

            // Setup delete handlers
            if (peopleList) {
                peopleList.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const personToDelete = btn.dataset.person;
                        Editor.allPeople = Editor.allPeople.filter(p => p !== personToDelete);
                        await Editor.savePeopleToStorage();
                        Modal.hide();
                        this.showPeopleManager();
                    });
                });
            }
        }, 100);
    },

    /**
     * Setup daily note functionality
     */
    setupDailyNote() {
        if (!this.dailyNoteBtn) return;

        this.dailyNoteBtn.addEventListener("click", async () => {
            await this.createDailyNote();
        });
    },

    /**
     * Create a new daily note section with current date
     */
    async createDailyNote() {
        const now = new Date();

        // Format date as YYYY-MM-DD [Day]
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        // Get day name
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[now.getDay()];

        // Combine for the heading
        const headingText = `${dateStr} (${dayName})`;

        // Create header block with the date
        const headerBlock = {
            id: Utils.generateId(),
            type: "header",
            data: {
                text: headingText,
                level: 1,
            },
        };

        // Create empty paragraph block for note content
        const paragraphBlock = {
            id: Utils.generateId(),
            type: "paragraph",
            data: {
                text: "",
            },
        };

        try {
            // Get current content
            const content = await Editor.instance.save();

            // Insert at the beginning of the document
            content.blocks.unshift(headerBlock, paragraphBlock);

            // Re-render the editor with new content
            await Editor.instance.render(content);

            // Focus the new paragraph block
            setTimeout(() => {
                Editor.instance.caret.setToBlock(1, "start");
            }, 100);

            // Update sidebar
            Sidebar.update(content.blocks);

            console.log("Sidebar: Daily note created for", dateStr);
        } catch (error) {
            console.error("Sidebar: Failed to create daily note:", error);
        }
    },

    /**
     * Setup search functionality
     */
    setupSearch() {
        let selectedIndex = -1;

        this.searchInput.addEventListener(
            "input",
            Utils.debounce((e) => {
                const query = e.target.value.trim().toLowerCase();
                selectedIndex = -1;

                if (query.length === 0) {
                    this.hideSearchResults();
                    return;
                }

                const results = this.headingIndex.filter((h) =>
                    h.text.toLowerCase().includes(query),
                );

                this.renderSearchResults(results);
            }, 150),
        );

        // Keyboard navigation
        this.searchInput.addEventListener("keydown", (e) => {
            const items = this.searchResults.querySelectorAll("li");

            if (e.key === "ArrowDown") {
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                this.updateSearchSelection(items, selectedIndex);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, 0);
                this.updateSearchSelection(items, selectedIndex);
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (selectedIndex >= 0 && items[selectedIndex]) {
                    items[selectedIndex].click();
                } else if (items.length > 0) {
                    items[0].click();
                }
            } else if (e.key === "Escape") {
                this.hideSearchResults();
                this.searchInput.blur();
            }
        });

        // Close search results when clicking outside
        document.addEventListener("click", (e) => {
            if (
                !this.searchInput.contains(e.target) &&
                !this.searchResults.contains(e.target)
            ) {
                this.hideSearchResults();
            }
        });
    },

    /**
     * Render search results
     */
    renderSearchResults(results) {
        if (results.length === 0) {
            this.searchResults.innerHTML =
                '<li class="no-results">No headings found</li>';
            this.showSearchResults();
            return;
        }

        this.searchResults.innerHTML = results
            .map(
                (result, index) => `
            <li data-id="${result.id}" data-index="${index}">
                <span class="level-indicator">H${result.level}</span>
                ${Utils.escapeHtml(result.text)}
            </li>
        `,
            )
            .join("");

        // Add click handlers
        this.searchResults.querySelectorAll("li[data-id]").forEach((li) => {
            li.addEventListener("click", () => {
                const id = li.dataset.id;
                Utils.scrollToElement(id);
                this.setActiveHeading(id);
                this.hideSearchResults();
                this.searchInput.value = "";
            });
        });

        this.showSearchResults();
    },

    /**
     * Update search selection highlight
     */
    updateSearchSelection(items, index) {
        items.forEach((item, i) => {
            item.classList.toggle("active", i === index);
        });

        if (items[index]) {
            items[index].scrollIntoView({ block: "nearest" });
        }
    },

    /**
     * Show search results dropdown
     */
    showSearchResults() {
        this.searchResults.classList.remove("hidden");
    },

    /**
     * Hide search results dropdown
     */
    hideSearchResults() {
        this.searchResults.classList.add("hidden");
    },

    /**
     * Setup resize functionality
     */
    setupResize() {
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        this.resizeHandle.addEventListener("mousedown", (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = this.sidebar.offsetWidth;
            this.resizeHandle.classList.add("active");
            document.body.style.cursor = "ew-resize";
            document.body.style.userSelect = "none";
        });

        document.addEventListener(
            "mousemove",
            Utils.throttle((e) => {
                if (!isResizing) return;

                const diff = e.clientX - startX;
                const newWidth = Math.max(
                    parseInt(
                        getComputedStyle(
                            document.documentElement,
                        ).getPropertyValue("--sidebar-min-width"),
                    ),
                    Math.min(startWidth + diff, window.innerWidth * 0.4),
                );

                this.sidebar.style.width = newWidth + "px";
            }, 16),
        );

        document.addEventListener("mouseup", () => {
            if (isResizing) {
                isResizing = false;
                this.resizeHandle.classList.remove("active");
                document.body.style.cursor = "";
                document.body.style.userSelect = "";
                this.saveSidebarWidth();
            }
        });
    },

    /**
     * Load sidebar width from storage
     */
    async loadSidebarWidth() {
        const width = localStorage.getItem("sidebar-width");
        if (width) {
            this.sidebar.style.width = width;
        }
    },

    /**
     * Save sidebar width to storage
     */
    saveSidebarWidth() {
        localStorage.setItem("sidebar-width", this.sidebar.style.width);
    },

    /**
     * Setup hash navigation
     */
    setupHashNavigation() {
        // Handle initial hash
        if (window.location.hash) {
            const id = window.location.hash.slice(1);
            setTimeout(() => {
                Utils.scrollToElement(id);
                this.setActiveHeading(id);
            }, 100);
        }

        // Handle hash changes
        window.addEventListener("hashchange", () => {
            const id = window.location.hash.slice(1);
            if (id) {
                Utils.scrollToElement(id);
                this.setActiveHeading(id);
            }
        });
    },

    /**
     * Build heading index from blocks
     */
    buildHeadingIndex(blocks) {
        this.headingIndex = blocks
            .filter((block) => block.type === "header")
            .map((block) => ({
                id: block.id,
                text: block.data.text,
                level: block.data.level,
            }));

        this.renderTree();
    },

    /**
     * Render the navigation tree
     */
    renderTree() {
        if (this.headingIndex.length === 0) {
            this.headingTree.innerHTML =
                '<li class="empty-state">No headings yet</li>';
            return;
        }

        // Build hierarchical structure
        const tree = this.buildHierarchy(this.headingIndex);
        this.headingTree.innerHTML = this.renderTreeNodes(tree);
        this.attachTreeListeners();
    },

    /**
     * Build hierarchical tree from flat heading list
     */
    buildHierarchy(headings) {
        const root = [];
        const stack = [{ level: 0, children: root }];

        for (const heading of headings) {
            const node = {
                id: heading.id,
                text: heading.text,
                level: heading.level,
                children: [],
            };

            // Find parent level
            while (
                stack.length > 1 &&
                stack[stack.length - 1].level >= heading.level
            ) {
                stack.pop();
            }

            // Add to parent's children
            stack[stack.length - 1].children.push(node);
            stack.push(node);
        }

        return root;
    },

    /**
     * Render tree nodes recursively
     */
    renderTreeNodes(nodes, depth = 0) {
        if (!nodes || nodes.length === 0) return "";

        return nodes
            .map((node) => {
                const hasChildren = node.children && node.children.length > 0;
                const toggleClass = hasChildren ? "" : "no-children";
                const isActive =
                    node.id === this.activeHeadingId ? "active" : "";

                return `
                <li>
                    <div class="tree-item ${isActive}" data-id="${node.id}" data-level="${node.level}">
                        <button class="toggle-btn ${toggleClass}" aria-label="Toggle">▶</button>
                        <a href="#${node.id}" class="tree-link">${Utils.escapeHtml(node.text)}</a>
                    </div>
                    ${hasChildren ? `<ul class="children hidden">${this.renderTreeNodes(node.children, depth + 1)}</ul>` : ""}
                </li>
            `;
            })
            .join("");
    },

    /**
     * Attach event listeners to tree items
     */
    attachTreeListeners() {
        // Toggle buttons
        this.headingTree
            .querySelectorAll(".toggle-btn:not(.no-children)")
            .forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const li = btn.closest("li");
                    const children = li.querySelector(".children");

                    if (children) {
                        children.classList.toggle("hidden");
                        btn.classList.toggle("expanded");
                    }
                });
            });

        // Tree links
        this.headingTree.querySelectorAll(".tree-link").forEach((link) => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const id = link.closest(".tree-item").dataset.id;
                Utils.scrollToElement(id);
                this.setActiveHeading(id);
            });
        });
    },

    /**
     * Set active heading in sidebar
     */
    setActiveHeading(id) {
        // Remove previous active
        this.headingTree
            .querySelectorAll(".tree-item.active")
            .forEach((item) => {
                item.classList.remove("active");
            });

        // Set new active
        const item = this.headingTree.querySelector(
            `.tree-item[data-id="${id}"]`,
        );
        if (item) {
            item.classList.add("active");

            // Expand parent nodes
            let parent = item.closest("li").parentElement;
            while (parent && parent.classList.contains("children")) {
                parent.classList.remove("hidden");
                const toggle =
                    parent.previousElementSibling?.querySelector(".toggle-btn");
                if (toggle) toggle.classList.add("expanded");
                parent = parent.closest("li")?.parentElement;
            }
        }

        this.activeHeadingId = id;
    },

    /**
     * Setup theme management
     */
    setupTheme() {
        // Check saved theme and apply it (even if toggle button doesn't exist yet)
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }

        // Only setup toggle if element exists
        if (!this.themeToggle) return;

        this.updateThemeIcon(savedTheme || 'light');

        // Attach toggle event
        this.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });
    },

    /**
     * Toggle theme
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: newTheme } }));
    },

    /**
     * Update theme toggle icon
     */
    updateThemeIcon(theme) {
        if (!this.themeToggle) return;
        
        const svg = this.themeToggle.querySelector('svg');
        if (!svg) return;
        
        if (theme === 'dark') {
            // Sun icon (show sun in dark mode to indicate clicking will switch to light)
            svg.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
        } else {
            // Moon icon (show moon in light mode to indicate clicking will switch to dark)
            svg.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
        }
    },

    /**
     * Update tree when content changes
     */
    update(blocks) {
        this.buildHeadingIndex(blocks);
    },
};

// Make globally available
window.Sidebar = Sidebar;
