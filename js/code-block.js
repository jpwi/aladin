/**
 * CodeBlock Tool for Editor.js
 * Features: Syntax highlighting with Prism.js, line numbers, copy button, language selector
 */

class CodeBlockTool {
    /**
     * Get Tool's toolbox configuration
     */
    static get toolbox() {
        return {
            title: 'Code',
            icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/></svg>'
        };
    }

    /**
     * Language alias mapping - maps common aliases to Prism language names
     */
    static get languageAliases() {
        return {
            // JavaScript
            'js': 'javascript',
            'node': 'javascript',
            'nodejs': 'javascript',
            // TypeScript
            'ts': 'typescript',
            // Python
            'py': 'python',
            'python3': 'python',
            'py3': 'python',
            // C/C++
            'c++': 'cpp',
            'cplusplus': 'cpp',
            'h': 'c',
            'hpp': 'cpp',
            // C#
            'cs': 'csharp',
            'c#': 'csharp',
            'dotnet': 'csharp',
            // Shell/Bash
            'sh': 'bash',
            'shell': 'bash',
            'zsh': 'bash',
            // PowerShell
            'ps': 'powershell',
            'ps1': 'powershell',
            'pwsh': 'powershell',
            // Web
            'htm': 'html',
            'vue': 'html',
            'jsx': 'javascript',
            'tsx': 'typescript',
            'less': 'css',
            'sass': 'scss',
            // Data formats
            'yml': 'yaml',
            // Go
            'golang': 'go',
            // Ruby
            'rb': 'ruby',
            // Rust
            'rs': 'rust',
            // Kotlin
            'kt': 'kotlin',
            'kts': 'kotlin',
            // Swift
            'swift': 'swift',
            // Docker
            'dockerfile': 'docker',
            // Plain text
            'text': 'plaintext',
            'txt': 'plaintext',
            'plain': 'plaintext',
            'none': 'plaintext',
            '': 'plaintext'
        };
    }

    /**
     * Resolve a language alias to the canonical Prism language name
     * @param {string} alias - The language alias (e.g., 'py', 'js', 'ts')
     * @returns {string} - The canonical language name (e.g., 'python', 'javascript')
     */
    static resolveLanguage(alias) {
        if (!alias) return 'javascript'; // Default
        
        const normalized = alias.toLowerCase().trim();
        
        // Check if it's an alias
        if (CodeBlockTool.languageAliases[normalized]) {
            return CodeBlockTool.languageAliases[normalized];
        }
        
        // Check if it's already a valid language from our list
        const validLanguages = CodeBlockTool.languages.map(l => l.value);
        if (validLanguages.includes(normalized)) {
            return normalized;
        }
        
        // Return as-is (Prism might support it directly)
        return normalized;
    }

    /**
     * Available languages for the dropdown
     */
    static get languages() {
        return [
            { value: 'javascript', label: 'JavaScript' },
            { value: 'typescript', label: 'TypeScript' },
            { value: 'python', label: 'Python' },
            { value: 'java', label: 'Java' },
            { value: 'csharp', label: 'C#' },
            { value: 'cpp', label: 'C++' },
            { value: 'c', label: 'C' },
            { value: 'go', label: 'Go' },
            { value: 'rust', label: 'Rust' },
            { value: 'ruby', label: 'Ruby' },
            { value: 'php', label: 'PHP' },
            { value: 'swift', label: 'Swift' },
            { value: 'kotlin', label: 'Kotlin' },
            { value: 'html', label: 'HTML' },
            { value: 'css', label: 'CSS' },
            { value: 'scss', label: 'SCSS' },
            { value: 'json', label: 'JSON' },
            { value: 'yaml', label: 'YAML' },
            { value: 'xml', label: 'XML' },
            { value: 'markdown', label: 'Markdown' },
            { value: 'sql', label: 'SQL' },
            { value: 'bash', label: 'Bash' },
            { value: 'powershell', label: 'PowerShell' },
            { value: 'docker', label: 'Docker' },
            { value: 'plaintext', label: 'Plain Text' }
        ];
    }

    /**
     * Automatic language detection based on code content
     */
    static detectLanguage(code) {
        const patterns = [
            { lang: 'javascript', regex: /\b(const|let|var|function|=>|console\.log|require\(|import\s+.*from)\b/ },
            { lang: 'typescript', regex: /\b(interface|type\s+\w+\s*=|:\s*(string|number|boolean|any)\b)/ },
            { lang: 'python', regex: /\b(def\s+\w+|import\s+\w+|from\s+\w+\s+import|print\(|if\s+__name__|:\s*$)/m },
            { lang: 'java', regex: /\b(public\s+class|private\s+|protected\s+|void\s+main|System\.out\.println)\b/ },
            { lang: 'csharp', regex: /\b(namespace\s+|using\s+System|Console\.WriteLine|public\s+static\s+void)\b/ },
            { lang: 'html', regex: /<(!DOCTYPE|html|head|body|div|span|script|style)\b/i },
            { lang: 'css', regex: /\{[\s\S]*?(color|background|margin|padding|display|font-size)\s*:/ },
            { lang: 'json', regex: /^\s*[\{\[][\s\S]*[\}\]]\s*$/ },
            { lang: 'sql', regex: /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|FROM|WHERE|JOIN)\b/i },
            { lang: 'bash', regex: /^(#!\/bin\/(ba)?sh|\$\s+|echo\s+|export\s+|alias\s+)/m },
            { lang: 'yaml', regex: /^\s*[\w-]+:\s*[\w\s-]*$/m },
        ];

        for (const { lang, regex } of patterns) {
            if (regex.test(code)) {
                return lang;
            }
        }
        return 'plaintext';
    }

    /**
     * Constructor
     */
    constructor({ data, api, config, readOnly }) {
        this.api = api;
        this.readOnly = readOnly;
        this.config = config || {};

        this.data = {
            code: data.code || '',
            language: data.language || 'javascript'
        };

        this.wrapper = null;
        this.codeElement = null;
        this.languageSelect = null;
    }

    /**
     * Render the tool
     */
    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.classList.add('code-block-wrapper');

        // Create header with language selector and copy button
        const header = document.createElement('div');
        header.classList.add('code-block-header');

        // Language selector
        this.languageSelect = document.createElement('select');
        this.languageSelect.classList.add('code-block-language');
        this.languageSelect.disabled = this.readOnly;

        CodeBlockTool.languages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.value;
            option.textContent = lang.label;
            if (lang.value === this.data.language) {
                option.selected = true;
            }
            this.languageSelect.appendChild(option);
        });

        this.languageSelect.addEventListener('change', () => {
            this.data.language = this.languageSelect.value;
            this.highlightCode();
        });

        // Copy button
        const copyBtn = document.createElement('button');
        copyBtn.classList.add('code-block-copy');
        copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Copy</span>';
        copyBtn.addEventListener('click', () => this.copyCode(copyBtn));

        header.appendChild(this.languageSelect);
        header.appendChild(copyBtn);

        // Code container with line numbers
        const codeContainer = document.createElement('div');
        codeContainer.classList.add('code-block-container', 'line-numbers');

        // Pre and code elements for Prism
        const pre = document.createElement('pre');
        pre.classList.add('line-numbers');

        this.codeElement = document.createElement('code');
        this.codeElement.classList.add(`language-${this.data.language}`);

        if (this.readOnly) {
            this.codeElement.textContent = this.data.code;
        } else {
            // Make code editable
            this.codeElement.contentEditable = 'true';
            this.codeElement.spellcheck = false;
            this.codeElement.textContent = this.data.code;

            // Debounce timer for syntax highlighting
            let highlightTimeout = null;

            // Handle input - update line numbers in real-time, debounce highlighting
            this.codeElement.addEventListener('input', () => {
                this.data.code = this.codeElement.textContent;
                this.updateLineNumbers();
                
                // Debounced syntax highlighting (500ms after last keystroke)
                clearTimeout(highlightTimeout);
                highlightTimeout = setTimeout(() => {
                    this.highlightCodePreserveCursor();
                }, 500);
            });

            // Handle paste - strip formatting
            this.codeElement.addEventListener('paste', (e) => {
                e.preventDefault();
                const text = e.clipboardData.getData('text/plain');
                document.execCommand('insertText', false, text);
                this.data.code = this.codeElement.textContent;
                this.updateLineNumbers();
            });

            // Handle key events
            this.codeElement.addEventListener('keydown', (e) => {
                // Tab key for indentation
                if (e.key === 'Tab') {
                    e.preventDefault();
                    e.stopPropagation();
                    document.execCommand('insertText', false, '  ');
                }
                // Enter key - update line numbers immediately
                if (e.key === 'Enter') {
                    setTimeout(() => this.updateLineNumbers(), 0);
                }
                // Prevent backspace from deleting the block when cursor is at start
                // but still allow deleting content
                if (e.key === 'Backspace') {
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        // Only stop propagation if at the very beginning and nothing to delete
                        if (range.startOffset === 0 && range.collapsed && 
                            range.startContainer === this.codeElement ||
                            range.startContainer === this.codeElement.firstChild && range.startOffset === 0) {
                            e.stopPropagation();
                        }
                    }
                }
                // Prevent arrow key navigation from leaving the block
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.stopPropagation();
                }
            });

            // Handle blur to re-highlight with syntax coloring
            this.codeElement.addEventListener('blur', () => {
                clearTimeout(highlightTimeout);
                this.highlightCode();
            });

            // Placeholder handling
            if (!this.data.code) {
                this.codeElement.setAttribute('data-placeholder', 'Enter code here...');
            }
        }

        pre.appendChild(this.codeElement);
        codeContainer.appendChild(pre);

        this.wrapper.appendChild(header);
        this.wrapper.appendChild(codeContainer);

        // Initial highlight and line numbers
        setTimeout(() => {
            this.highlightCode();
            this.updateLineNumbers();
        }, 0);

        return this.wrapper;
    }

    /**
     * Update line numbers without re-highlighting (preserves cursor position)
     */
    updateLineNumbers() {
        if (!this.wrapper) return;
        
        const pre = this.wrapper.querySelector('pre');
        if (!pre) return;
        
        const code = this.codeElement?.textContent || '';
        const lines = code.split('\n');
        // Always show at least 1 line number
        const lineCount = Math.max(1, lines.length);
        
        // Find or create line numbers element
        let lineNumbersRows = pre.querySelector('.line-numbers-rows');
        
        if (!lineNumbersRows) {
            lineNumbersRows = document.createElement('span');
            lineNumbersRows.className = 'line-numbers-rows';
            lineNumbersRows.setAttribute('aria-hidden', 'true');
            pre.appendChild(lineNumbersRows);
        }
        
        // Update line numbers
        const currentSpans = lineNumbersRows.children.length;
        
        if (currentSpans < lineCount) {
            // Add more line number spans
            for (let i = currentSpans; i < lineCount; i++) {
                const span = document.createElement('span');
                lineNumbersRows.appendChild(span);
            }
        } else if (currentSpans > lineCount) {
            // Remove extra spans
            while (lineNumbersRows.children.length > lineCount) {
                lineNumbersRows.removeChild(lineNumbersRows.lastChild);
            }
        }
    }

    /**
     * Apply syntax highlighting with Prism
     */
    highlightCode() {
        if (!this.codeElement) return;

        const code = this.codeElement.textContent;
        this.data.code = code;

        // Auto-detect language if plaintext and there's code
        if (this.data.language === 'plaintext' && code.trim()) {
            const detected = CodeBlockTool.detectLanguage(code);
            if (detected !== 'plaintext') {
                this.data.language = detected;
                this.languageSelect.value = detected;
            }
        }

        // Update class for Prism
        this.codeElement.className = `language-${this.data.language}`;

        // Apply Prism highlighting
        if (typeof Prism !== 'undefined') {
            Prism.highlightElement(this.codeElement);
        }
    }

    /**
     * Apply syntax highlighting while preserving cursor position
     */
    highlightCodePreserveCursor() {
        if (!this.codeElement) return;
        
        // Save cursor position as text offset
        const selection = window.getSelection();
        let cursorOffset = 0;
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            // Calculate the text offset from the beginning of the code element
            const preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(this.codeElement);
            preCaretRange.setEnd(range.startContainer, range.startOffset);
            cursorOffset = preCaretRange.toString().length;
        }
        
        // Get current code content
        const code = this.codeElement.textContent;
        this.data.code = code;
        
        // Update class for Prism
        this.codeElement.className = `language-${this.data.language}`;
        
        // Apply Prism highlighting
        if (typeof Prism !== 'undefined') {
            Prism.highlightElement(this.codeElement);
        }
        
        // Restore cursor position
        this.restoreCursorPosition(cursorOffset);
    }

    /**
     * Restore cursor position after highlighting
     */
    restoreCursorPosition(targetOffset) {
        if (!this.codeElement) return;
        
        const walker = document.createTreeWalker(
            this.codeElement,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let currentOffset = 0;
        let node = null;
        
        while ((node = walker.nextNode())) {
            const nodeLength = node.textContent.length;
            if (currentOffset + nodeLength >= targetOffset) {
                // Found the node containing our offset
                const range = document.createRange();
                const selection = window.getSelection();
                
                range.setStart(node, targetOffset - currentOffset);
                range.collapse(true);
                
                selection.removeAllRanges();
                selection.addRange(range);
                return;
            }
            currentOffset += nodeLength;
        }
        
        // If we couldn't find the exact position, put cursor at the end
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(this.codeElement);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    /**
     * Copy code to clipboard
     */
    async copyCode(button) {
        try {
            await navigator.clipboard.writeText(this.data.code);
            const originalHtml = button.innerHTML;
            button.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Copied!</span>';
            button.classList.add('copied');

            setTimeout(() => {
                button.innerHTML = originalHtml;
                button.classList.remove('copied');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);
        }
    }

    /**
     * Save tool data
     */
    save() {
        return {
            code: this.data.code,
            language: this.data.language
        };
    }

    /**
     * Validate data
     */
    validate(savedData) {
        // Allow empty code blocks (user might want to add code later)
        return true;
    }

    /**
     * Sanitize pasted data
     */
    static get sanitize() {
        return {
            code: true,
            language: false
        };
    }

    /**
     * Allow pressing Enter inside
     */
    static get enableLineBreaks() {
        return true;
    }

    /**
     * Paste handling - convert pasted code blocks
     */
    static get pasteConfig() {
        return {
            tags: ['PRE', 'CODE'],
            patterns: {
                // Match fenced code blocks
                fencedCode: /^```(\w+)?\n([\s\S]*?)```$/gm
            }
        };
    }

    /**
     * Handle pasted content
     */
    onPaste(event) {
        const { data } = event.detail;

        if (event.type === 'tag') {
            // Handle pasted HTML code/pre tags
            this.data.code = data.textContent;
            const langClass = data.className?.match(/language-(\w+)/);
            if (langClass) {
                this.data.language = CodeBlockTool.resolveLanguage(langClass[1]);
            }
        } else if (event.type === 'pattern') {
            // Handle fenced code blocks from markdown
            const match = data.match;
            this.data.language = CodeBlockTool.resolveLanguage(match[1] || '');
            this.data.code = match[2] || '';
        }

        if (this.codeElement) {
            this.codeElement.textContent = this.data.code;
            if (this.languageSelect) {
                this.languageSelect.value = this.data.language;
            }
            this.highlightCode();
        }
    }
}

// Make globally available
window.CodeBlockTool = CodeBlockTool;
