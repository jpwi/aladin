/**
 * AI - Retrieval-Augmented Generation system for knowledge base queries
 * Supports OpenAI, Gemini, Ollama, and LM Studio
 */

const AI = {
    // Configuration
    config: {
        provider: null, // 'openai', 'gemini', 'ollama', 'lmstudio'
        apiKey: null,
        model: null,
        embeddingModel: null,
        baseUrl: null, // For local LLMs
        temperature: 0.1, // Low for factual responses
        maxTokens: 1000,
        // Developer settings
        devMode: false,
        logRawResponse: false,
    },

    // Vector storage
    chunks: [],
    embeddings: [],

    // Providers configuration
    providers: {
        openai: {
            name: "OpenAI",
            embeddingEndpoint: "https://api.openai.com/v1/embeddings",
            chatEndpoint: "https://api.openai.com/v1/chat/completions",
            models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
            embeddingModels: [
                "text-embedding-3-large",
                "text-embedding-3-small",
                "text-embedding-ada-002",
            ],
            requiresApiKey: true,
        },
        gemini: {
            name: "Google Gemini",
            embeddingEndpoint:
                "https://generativelanguage.googleapis.com/v1beta/models/{model}:embedContent",
            chatEndpoint:
                "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
            models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro"],
            embeddingModels: ["text-embedding-004"],
            requiresApiKey: true,
        },
        ollama: {
            name: "Ollama (Local)",
            embeddingEndpoint: "http://localhost:11434/api/embeddings",
            chatEndpoint: "http://localhost:11434/api/chat",
            models: [
                "llama3.2",
                "llama3.1",
                "llama3",
                "mistral",
                "codellama",
                "mixtral",
                "phi3",
                "gemma2",
                "qwen2",
            ],
            embeddingModels: [
                "nomic-embed-text",
                "mxbai-embed-large",
                "all-minilm",
            ],
            requiresApiKey: false,
            hint: "Run: OLLAMA_ORIGINS=* ollama serve",
        },
        lmstudio: {
            name: "LM Studio (Local)",
            embeddingEndpoint: "http://localhost:1234/v1/embeddings",
            chatEndpoint: "http://localhost:1234/v1/chat/completions",
            models: [
                "lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF",
                "TheBloke/Mistral-7B-Instruct-v0.2-GGUF",
                "Use model name from LM Studio",
            ],
            embeddingModels: [
                "nomic-ai/nomic-embed-text-v1.5-GGUF",
                "Use embedding model name from LM Studio",
            ],
            requiresApiKey: false,
            hint: "Start LM Studio → Local Server (port 1234)",
            customModels: true, // Allow custom model names
        },
    },

    // System prompt for RAG - optimized for small local models
    // Simple, direct instructions to minimize "thinking" output
    systemPrompt: `You answer questions using ONLY the provided sources. Be direct and concise.

If the sources contain relevant information:
- Answer in 2-4 sentences
- Add [Source Title](#anchor) after statements from that source

If the sources do NOT contain relevant information:
- Only say: "I couldn't find information about this in your notes."
- Do NOT list any sources in this case

Never explain your process. Never list sources separately.`,

    /**
     * Initialize the AI system
     */
    async init() {
        // Load saved configuration
        const savedConfig = await Storage.getSetting("ai-config", null);
        console.log("AI: Loading config from storage:", savedConfig);
        if (savedConfig) {
            this.config = { ...this.config, ...savedConfig };
            console.log("AI: Applied saved config:", this.config);
        }

        // Load cached embeddings
        await this.loadEmbeddings();

        console.log("AI: Initialized");
        return this;
    },

    /**
     * Check if AI is configured
     */
    isConfigured() {
        if (!this.config.provider) return false;
        const provider = this.providers[this.config.provider];
        if (provider.requiresApiKey && !this.config.apiKey) return false;
        if (!this.config.model) return false;
        return true;
    },

    /**
     * Save configuration
     */
    async saveConfig(config) {
        this.config = { ...this.config, ...config };
        await Storage.saveSetting("ai-config", this.config);
        // Force immediate vault save for AI settings (important to persist)
        await Storage.saveToVault();
        console.log("AI: Configuration saved to vault");
    },

    /**
     * Get available models for current provider
     */
    getAvailableModels() {
        if (!this.config.provider) return [];
        return this.providers[this.config.provider].models || [];
    },

    /**
     * Get available embedding models for current provider
     */
    getAvailableEmbeddingModels() {
        if (!this.config.provider) return [];
        return this.providers[this.config.provider].embeddingModels || [];
    },

    // ==========================================
    // Chunking System
    // ==========================================

    /**
     * Create chunks from document blocks
     * Each chunk preserves section context and anchors
     * Smaller chunks (350 tokens) improve retrieval precision for local models
     */
    async createChunks(blocks) {
        const chunks = [];
        let currentSection = { title: "Document", level: 0, id: null };
        let chunkBuffer = [];
        let chunkTokenCount = 0;
        const MAX_CHUNK_TOKENS = 350; // Smaller chunks = better retrieval precision

        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];

            // Track section hierarchy
            if (block.type === "header") {
                // Flush current buffer before starting new section
                if (chunkBuffer.length > 0) {
                    chunks.push(this.createChunk(chunkBuffer, currentSection));
                    chunkBuffer = [];
                    chunkTokenCount = 0;
                }

                currentSection = {
                    title: block.data.text,
                    level: block.data.level,
                    id: block.id,
                };

                // Add heading to new chunk
                chunkBuffer.push({
                    type: "heading",
                    text: block.data.text,
                    level: block.data.level,
                    blockId: block.id,
                });
                chunkTokenCount += this.estimateTokens(block.data.text);
            } else {
                // Extract text content from block
                const content = this.extractBlockContent(block);
                if (content) {
                    const tokens = this.estimateTokens(content);

                    // Check if adding this would exceed chunk limit
                    if (
                        chunkTokenCount + tokens > MAX_CHUNK_TOKENS &&
                        chunkBuffer.length > 0
                    ) {
                        chunks.push(
                            this.createChunk(chunkBuffer, currentSection),
                        );
                        chunkBuffer = [];
                        chunkTokenCount = 0;
                    }

                    chunkBuffer.push({
                        type: block.type,
                        text: content,
                        blockId: block.id,
                    });
                    chunkTokenCount += tokens;
                }
            }
        }

        // Flush remaining buffer
        if (chunkBuffer.length > 0) {
            chunks.push(this.createChunk(chunkBuffer, currentSection));
        }

        this.chunks = chunks;
        console.log(`AI: Created ${chunks.length} chunks`);
        return chunks;
    },

    /**
     * Create a chunk object
     */
    createChunk(buffer, section) {
        const text = buffer
            .map((item) => {
                if (item.type === "heading") {
                    return `# ${item.text}`;
                }
                return item.text;
            })
            .join("\n\n");

        const blockIds = buffer.map((item) => item.blockId).filter((id) => id);

        return {
            id: Utils.generateId(),
            text: text,
            section: {
                title: section.title,
                level: section.level,
                anchor: section.id,
            },
            blockIds: blockIds,
            tokenCount: this.estimateTokens(text),
        };
    },

    /**
     * Extract text content from a block
     */
    extractBlockContent(block) {
        switch (block.type) {
            case "paragraph":
                return this.stripHtml(block.data.text || "");
            case "list":
                return (block.data.items || []).join("\n• ");
            case "quote":
                return block.data.text || "";
            case "code":
                return `Code: ${block.data.code || ""}`;
            case "image":
                // Extract caption and alt text for image understanding
                const caption = block.data?.caption || "";
                const alt = block.image?.alt || block.data?.file?.hash || "";
                return caption || alt ? `[Image: ${caption || alt}]` : null;
            case "file":
                return `[File: ${block.data?.originalName || "attachment"}]`;
            default:
                return null;
        }
    },

    /**
     * Strip HTML tags from text
     */
    stripHtml(html) {
        const div = document.createElement("div");
        div.innerHTML = html;
        return div.textContent || div.innerText || "";
    },

    /**
     * Estimate token count (rough approximation)
     */
    estimateTokens(text) {
        return Math.ceil(text.length / 4);
    },

    // ==========================================
    // Embedding System
    // ==========================================

    /**
     * Generate embeddings for all chunks
     */
    async generateEmbeddings() {
        if (!this.isConfigured()) {
            throw new Error("AI is not configured");
        }

        if (this.chunks.length === 0) {
            throw new Error("No chunks to embed. Run indexContent first.");
        }

        console.log(
            `AI: Generating embeddings for ${this.chunks.length} chunks...`,
        );

        const embeddings = [];
        const batchSize = 10;

        for (let i = 0; i < this.chunks.length; i += batchSize) {
            const batch = this.chunks.slice(i, i + batchSize);
            const texts = batch.map((chunk) => chunk.text);

            try {
                const vectors = await this.getEmbeddings(texts);

                for (let j = 0; j < batch.length; j++) {
                    embeddings.push({
                        chunkId: batch[j].id,
                        vector: vectors[j],
                    });
                }

                console.log(
                    `AI: Embedded ${Math.min(i + batchSize, this.chunks.length)}/${this.chunks.length} chunks`,
                );
            } catch (error) {
                console.error(
                    "AI: Failed to generate embeddings for batch:",
                    error,
                );
                throw error;
            }
        }

        this.embeddings = embeddings;
        await this.saveEmbeddings();
        console.log("AI: Embeddings generated and saved");
        return embeddings;
    },

    /**
     * Get embeddings from the configured provider
     */
    async getEmbeddings(texts) {
        const provider = this.config.provider;

        switch (provider) {
            case "openai":
                return this.getOpenAIEmbeddings(texts);
            case "gemini":
                return this.getGeminiEmbeddings(texts);
            case "ollama":
                return this.getOllamaEmbeddings(texts);
            case "lmstudio":
                return this.getLMStudioEmbeddings(texts);
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    },

    /**
     * OpenAI embeddings
     */
    async getOpenAIEmbeddings(texts) {
        const response = await fetch(this.providers.openai.embeddingEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.config.apiKey}`,
            },
            body: JSON.stringify({
                model: this.config.embeddingModel || "text-embedding-3-small",
                input: texts,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "OpenAI embedding failed");
        }

        const data = await response.json();
        return data.data.map((item) => item.embedding);
    },

    /**
     * Gemini embeddings
     */
    async getGeminiEmbeddings(texts) {
        const model = this.config.embeddingModel || "text-embedding-004";
        const embeddings = [];

        for (const text of texts) {
            const url =
                this.providers.gemini.embeddingEndpoint.replace(
                    "{model}",
                    model,
                ) + `?key=${this.config.apiKey}`;

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    content: { parts: [{ text }] },
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.error?.message || "Gemini embedding failed",
                );
            }

            const data = await response.json();
            embeddings.push(data.embedding.values);
        }

        return embeddings;
    },

    /**
     * Ollama embeddings
     */
    async getOllamaEmbeddings(texts) {
        const embeddings = [];
        const model = this.config.embeddingModel || "nomic-embed-text";
        const baseUrl =
            this.config.baseUrl || this.providers.ollama.embeddingEndpoint;

        for (const text of texts) {
            try {
                const response = await fetch(baseUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: model,
                        prompt: text,
                    }),
                });

                if (!response.ok) {
                    throw new Error("Ollama embedding failed");
                }

                const data = await response.json();
                embeddings.push(data.embedding);
            } catch (error) {
                if (
                    error.message.includes("Failed to fetch") ||
                    error.name === "TypeError"
                ) {
                    throw new Error(
                        "CORS error: Cannot connect to Ollama. Please run Ollama with CORS enabled:\n\n" +
                            "macOS/Linux: OLLAMA_ORIGINS=* ollama serve\n" +
                            "Windows: set OLLAMA_ORIGINS=* && ollama serve\n\n" +
                            "Or serve the app from a local web server (not file://)",
                    );
                }
                throw error;
            }
        }

        return embeddings;
    },

    /**
     * LM Studio embeddings (OpenAI-compatible)
     */
    async getLMStudioEmbeddings(texts) {
        // Build the proper endpoint URL
        let baseUrl = this.config.baseUrl || "http://localhost:1234";
        // Remove trailing slash if present
        baseUrl = baseUrl.replace(/\/$/, "");
        // Ensure we use the embeddings endpoint
        const endpoint = baseUrl.includes("/v1/")
            ? baseUrl
            : `${baseUrl}/v1/embeddings`;

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: this.config.embeddingModel || "text-embedding",
                    input: texts,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                // Check for no model loaded error
                if (
                    errorText.includes("No models loaded") ||
                    response.status === 400
                ) {
                    throw new Error(
                        "LM Studio: No embedding model loaded.\n\n" +
                            "Please load an embedding model in LM Studio:\n" +
                            "1. Go to the 'Discover' or 'My Models' tab\n" +
                            "2. Load an embedding model (e.g., nomic-embed-text)\n" +
                            "3. Try again",
                    );
                }
                throw new Error(
                    `LM Studio embedding failed: ${response.status} - ${errorText}`,
                );
            }

            const data = await response.json();
            return data.data.map((item) => item.embedding);
        } catch (error) {
            if (
                error.message.includes("Failed to fetch") ||
                error.name === "TypeError"
            ) {
                throw new Error(
                    "Cannot connect to LM Studio. Make sure:\n" +
                        "1. LM Studio is running\n" +
                        "2. Local Server is started (check the Server tab)\n" +
                        "3. An embedding model is loaded",
                );
            }
            throw error;
        }
    },

    /**
     * Save embeddings to storage
     */
    async saveEmbeddings() {
        await Storage.saveSetting("ai-chunks", this.chunks);
        await Storage.saveSetting("ai-embeddings", this.embeddings);
    },

    /**
     * Load embeddings from storage
     */
    async loadEmbeddings() {
        this.chunks = await Storage.getSetting("ai-chunks", []);
        this.embeddings = await Storage.getSetting("ai-embeddings", []);
        console.log(
            `AI: Loaded ${this.chunks.length} chunks, ${this.embeddings.length} embeddings`,
        );
    },

    // ==========================================
    // Retrieval System
    // ==========================================

    /**
     * Calculate cosine similarity between two vectors
     */
    cosineSimilarity(a, b) {
        if (!a || !b || a.length !== b.length) return 0;

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
        return magnitude === 0 ? 0 : dotProduct / magnitude;
    },

    /**
     * Retrieve most relevant chunks for a query using hybrid search
     * Combines vector similarity with BM25-style keyword matching
     */
    async retrieveChunks(query, topK = 5) {
        if (this.embeddings.length === 0) {
            throw new Error(
                "No embeddings available. Run generateEmbeddings first.",
            );
        }

        // Get query embedding (with query prompt for bge models)
        const queryText = this.formatQueryForEmbedding(query);
        const [queryEmbedding] = await this.getEmbeddings([queryText]);

        // Calculate vector similarities
        const vectorScores = this.embeddings.map((emb, idx) => ({
            chunkId: emb.chunkId,
            vectorScore: this.cosineSimilarity(queryEmbedding, emb.vector),
            index: idx,
        }));

        // Calculate BM25-style keyword scores
        const keywordScores = this.calculateKeywordScores(query);

        // Combine scores (hybrid search)
        const combinedScores = vectorScores.map((vs) => {
            const ks = keywordScores.find((k) => k.chunkId === vs.chunkId);
            const keywordScore = ks ? ks.score : 0;
            // Weight: 70% vector, 30% keyword
            const hybridScore = vs.vectorScore * 0.7 + keywordScore * 0.3;
            return {
                chunkId: vs.chunkId,
                similarity: hybridScore,
                vectorScore: vs.vectorScore,
                keywordScore: keywordScore,
            };
        });

        // Sort by combined score
        combinedScores.sort((a, b) => b.similarity - a.similarity);

        // Get top K chunks - use higher threshold to filter irrelevant results
        const topChunks = combinedScores
            .slice(0, topK)
            .map((score) => {
                const chunk = this.chunks.find((c) => c.id === score.chunkId);
                return {
                    ...chunk,
                    similarity: score.similarity,
                };
            })
            .filter((c) => c && c.similarity > 0.3); // Higher threshold for quality

        console.log(
            `AI: Retrieved ${topChunks.length} chunks, scores:`,
            topChunks.map((c) => c.similarity.toFixed(3)),
        );
        return topChunks;
    },

    /**
     * Format query for embedding (adds instruction prefix for bge/e5 models)
     */
    formatQueryForEmbedding(query) {
        const model = (this.config.embeddingModel || "").toLowerCase();
        // BGE and E5 models benefit from query prefixes
        if (model.includes("bge") || model.includes("e5")) {
            return `Represent this question for retrieving relevant passages: ${query}`;
        }
        return query;
    },

    /**
     * Calculate BM25-style keyword scores for all chunks
     */
    calculateKeywordScores(query) {
        // Tokenize query
        const queryTerms = this.tokenize(query);
        if (queryTerms.length === 0) return [];

        // Calculate IDF for each term
        const docCount = this.chunks.length;
        const idf = {};
        for (const term of queryTerms) {
            const docsWithTerm = this.chunks.filter((c) =>
                this.tokenize(c.text).includes(term),
            ).length;
            idf[term] = Math.log(
                (docCount - docsWithTerm + 0.5) / (docsWithTerm + 0.5) + 1,
            );
        }

        // Calculate BM25 score for each chunk
        const k1 = 1.5;
        const b = 0.75;
        const avgDocLen =
            this.chunks.reduce((sum, c) => sum + c.text.length, 0) / docCount;

        return this.chunks.map((chunk) => {
            const docTerms = this.tokenize(chunk.text);
            const docLen = chunk.text.length;
            let score = 0;

            for (const term of queryTerms) {
                const tf = docTerms.filter((t) => t === term).length;
                if (tf > 0) {
                    const numerator = tf * (k1 + 1);
                    const denominator =
                        tf + k1 * (1 - b + b * (docLen / avgDocLen));
                    score += idf[term] * (numerator / denominator);
                }
            }

            // Normalize to 0-1 range (approximate)
            const normalizedScore = Math.min(score / 10, 1);

            return {
                chunkId: chunk.id,
                score: normalizedScore,
            };
        });
    },

    /**
     * Simple tokenizer for keyword matching
     */
    tokenize(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\sÀ-ÿ]/g, " ") // Keep unicode letters
            .split(/\s+/)
            .filter((t) => t.length > 2); // Skip very short tokens
    },

    // ==========================================
    // Chat System
    // ==========================================

    /**
     * Ask a question and get a grounded answer
     */
    async ask(question) {
        if (!this.isConfigured()) {
            throw new Error(
                "AI is not configured. Please configure AI settings first.",
            );
        }

        if (this.embeddings.length === 0) {
            throw new Error(
                "Knowledge base not indexed. Please index content first.",
            );
        }

        // Retrieve relevant chunks
        const relevantChunks = await this.retrieveChunks(question, 5);

        if (relevantChunks.length === 0) {
            return {
                answer: "I couldn't find any relevant information in your notes to answer this question.",
                sources: [],
            };
        }

        // Format context for LLM - show how to cite each source
        const context = relevantChunks
            .map(
                (chunk, i) =>
                    `SOURCE: "${chunk.section.title}" (cite as: [${chunk.section.title}](#${chunk.section.anchor}))\n${chunk.text}`,
            )
            .join("\n\n---\n\n");

        // Generate answer
        let answer = await this.generateAnswer(question, context);

        // Developer mode: log raw response before filtering
        if (this.config.devMode && this.config.logRawResponse) {
            console.log("AI [Dev] Raw response before filtering:", answer);
        }

        // Filter out model "thinking" - remove internal reasoning
        answer = this.filterThinking(answer);

        // Post-process: if answer says "couldn't find" but has links, clean it up
        answer = this.cleanupNotFoundResponse(answer);

        // Developer mode: log filtered response
        if (this.config.devMode && this.config.logRawResponse) {
            console.log("AI [Dev] Filtered response:", answer);
        }

        return {
            answer: answer,
            sources: relevantChunks.map((chunk) => ({
                title: chunk.section.title,
                anchor: chunk.section.anchor,
                similarity: Math.round(chunk.similarity * 100),
            })),
        };
    },

    /**
     * Clean up confused "not found" responses that still list sources
     */
    cleanupNotFoundResponse(text) {
        // Check if the response says it couldn't find info
        const notFoundPhrases = [
            /couldn't find/i,
            /could not find/i,
            /no information/i,
            /not found/i,
            /don't have information/i,
        ];

        const hasNotFound = notFoundPhrases.some((p) => p.test(text));

        if (hasNotFound) {
            // If it says not found but has links, return clean "not found" message
            const hasLinks = /\[.+?\]\(#.+?\)/.test(text);
            if (hasLinks) {
                return "I couldn't find information about this in your notes.";
            }
        }

        return text;
    },

    /**
     * Filter out model "thinking" and internal reasoning from response
     */
    filterThinking(text) {
        // Remove common thinking patterns
        let filtered = text;

        // Remove text between <think> tags (some models use this)
        filtered = filtered.replace(/<think>[\s\S]*?<\/think>/gi, "");

        // Remove entire thinking blocks that span multiple lines
        // These often explain what the user asked and the rules being followed
        const blockPatterns = [
            // "First, the user asked/is asking..." blocks
            /First,?\s*(the user|they)\s*(asked|is asking|are asking|want)[^]*?(?=\n\n[A-Z]|\n\n\*|\n\n-|\n\n#|$)/gi,
            // "The source text..." blocks
            /The source text[^]*?(?=\n\n[A-Z]|\n\n\*|\n\n-|\n\n#|$)/gi,
            // "And they provided..." blocks
            /And they provided[^]*?(?=\n\n[A-Z]|\n\n\*|\n\n-|\n\n#|$)/gi,
            // "The rules say/require..." blocks
            /The rules (say|require|state)[^]*?(?=\n\n[A-Z]|\n\n\*|\n\n-|\n\n#|$)/gi,
            // "I must/need to/should/will..." at start of paragraph
            /^I (must|need to|should|will|have to)[^]*?(?=\n\n|\n[A-Z]|$)/gim,
            // "Let me..." blocks
            /Let me (analyze|check|look|see|search|find)[^]*?(?=\n\n[A-Z]|\n\n\*|\n\n-|$)/gi,
            // "Looking at..." blocks
            /Looking at (the|this|these)[^]*?(?=\n\n[A-Z]|\n\n\*|\n\n-|$)/gi,
        ];

        for (const pattern of blockPatterns) {
            filtered = filtered.replace(pattern, "");
        }

        // Remove lines that start with thinking indicators
        const thinkingPhrases = [
            /^(Hmm|Okay|Alright|Well,|So,|Now,|First,)/i,
            /^(Let me|I need to|I should|I'll|I will|I must|I have to)/i,
            /^(Looking at|Analyzing|Checking|Scanning|Searching|Reading)/i,
            /^(The user|The question|Based on this|I can see|I notice|From the|According to)/i,
            /^(The rules|Do NOT|Given that|Since the)/i,
            /^(They (asked|provided|want|are asking))/i,
        ];

        const lines = filtered.split("\n");
        const filteredLines = [];
        let skipUntilAnswer = false;

        for (const line of lines) {
            const trimmed = line.trim();

            // Skip empty lines at start
            if (filteredLines.length === 0 && !trimmed) continue;

            // Check if line looks like thinking
            let isThinking = false;
            for (const pattern of thinkingPhrases) {
                if (pattern.test(trimmed)) {
                    isThinking = true;
                    break;
                }
            }

            // Skip thinking lines at the start or middle
            if (isThinking) {
                if (filteredLines.length === 0) {
                    skipUntilAnswer = true;
                }
                continue;
            }

            // If we're skipping and find a substantive answer, start including
            if (skipUntilAnswer) {
                // Look for actual answer content (starts with answer-like text)
                if (
                    trimmed.length > 20 &&
                    !trimmed.endsWith(":") &&
                    !trimmed.startsWith("[Source")
                ) {
                    skipUntilAnswer = false;
                    filteredLines.push(trimmed);
                }
                continue;
            }

            filteredLines.push(line);
        }

        // Clean up extra whitespace
        let result = filteredLines.join("\n").trim();
        result = result.replace(/\n{3,}/g, "\n\n"); // Max 2 newlines

        return result.length > 10 ? result : text.trim();
    },

    /**
     * Generate answer using the configured LLM
     */
    async generateAnswer(question, context) {
        const provider = this.config.provider;

        const messages = [
            { role: "system", content: this.systemPrompt },
            {
                role: "user",
                content: `Question: ${question}\n\nSource text:\n${context}`,
            },
        ];

        switch (provider) {
            case "openai":
                return this.chatOpenAI(messages);
            case "gemini":
                return this.chatGemini(messages);
            case "ollama":
                return this.chatOllama(messages);
            case "lmstudio":
                return this.chatLMStudio(messages);
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    },

    /**
     * OpenAI chat
     */
    async chatOpenAI(messages) {
        const response = await fetch(this.providers.openai.chatEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.config.apiKey}`,
            },
            body: JSON.stringify({
                model: this.config.model || "gpt-4o-mini",
                messages: messages,
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "OpenAI chat failed");
        }

        const data = await response.json();
        return data.choices[0].message.content;
    },

    /**
     * Gemini chat
     */
    async chatGemini(messages) {
        const model = this.config.model || "gemini-1.5-flash";
        const url =
            this.providers.gemini.chatEndpoint.replace("{model}", model) +
            `?key=${this.config.apiKey}`;

        // Convert messages to Gemini format
        const contents = messages.map((msg) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
        }));

        // Gemini doesn't support system messages the same way
        if (contents[0].role === "user" && messages[0].role === "system") {
            contents[0].parts[0].text =
                messages[0].content + "\n\n" + contents[1].parts[0].text;
            contents.splice(1, 1);
            contents[0].role = "user";
        }

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: contents,
                generationConfig: {
                    temperature: this.config.temperature,
                    maxOutputTokens: this.config.maxTokens,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "Gemini chat failed");
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    },

    /**
     * Ollama chat
     */
    async chatOllama(messages) {
        const baseUrl =
            this.config.baseUrl || this.providers.ollama.chatEndpoint;

        try {
            const response = await fetch(baseUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: this.config.model || "llama3",
                    messages: messages,
                    stream: false,
                    options: {
                        temperature: this.config.temperature,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error("Ollama chat failed");
            }

            const data = await response.json();
            return data.message.content;
        } catch (error) {
            if (
                error.message.includes("Failed to fetch") ||
                error.name === "TypeError"
            ) {
                throw new Error(
                    "CORS error: Cannot connect to Ollama. Please run Ollama with CORS enabled:\n\n" +
                        "macOS/Linux: OLLAMA_ORIGINS=* ollama serve\n" +
                        "Windows: set OLLAMA_ORIGINS=* && ollama serve\n\n" +
                        "Or serve the app from a local web server (not file://)",
                );
            }
            throw error;
        }
    },

    /**
     * LM Studio chat (OpenAI-compatible)
     */
    async chatLMStudio(messages) {
        // Build the proper endpoint URL
        let baseUrl = this.config.baseUrl || "http://localhost:1234";
        // Remove trailing slash if present
        baseUrl = baseUrl.replace(/\/$/, "");
        // Ensure we use the chat completions endpoint
        const endpoint = baseUrl.includes("/v1/")
            ? baseUrl
            : `${baseUrl}/v1/chat/completions`;

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: this.config.model || "local-model",
                    messages: messages,
                    temperature: this.config.temperature,
                    max_tokens: this.config.maxTokens,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                // Check for no model loaded error
                if (
                    errorText.includes("No models loaded") ||
                    response.status === 400
                ) {
                    throw new Error(
                        "LM Studio: No chat model loaded.\n\n" +
                            "Please load a chat model in LM Studio:\n" +
                            "1. Go to the 'Discover' or 'My Models' tab\n" +
                            "2. Load a chat model (e.g., Mistral, Llama, etc.)\n" +
                            "3. Try again",
                    );
                }
                throw new Error(
                    `LM Studio chat failed: ${response.status} - ${errorText}`,
                );
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            if (
                error.message.includes("Failed to fetch") ||
                error.name === "TypeError"
            ) {
                throw new Error(
                    "Cannot connect to LM Studio. Make sure:\n" +
                        "1. LM Studio is running\n" +
                        "2. Local Server is started (check the Server tab)\n" +
                        "3. A chat model is loaded",
                );
            }
            throw error;
        }
    },

    // ==========================================
    // Index Management
    // ==========================================

    /**
     * Index the entire knowledge base
     */
    async indexContent() {
        console.log("AI: Indexing content...");

        // Get current content
        const content = await Storage.loadContent();
        if (!content || !content.blocks || content.blocks.length === 0) {
            throw new Error("No content to index");
        }

        // Create chunks
        await this.createChunks(content.blocks);

        // Generate embeddings
        await this.generateEmbeddings();

        console.log("AI: Indexing complete");
        return {
            chunks: this.chunks.length,
            embeddings: this.embeddings.length,
        };
    },

    /**
     * Clear the index
     */
    async clearIndex() {
        this.chunks = [];
        this.embeddings = [];
        await Storage.saveSetting("ai-chunks", []);
        await Storage.saveSetting("ai-embeddings", []);
        console.log("AI: Index cleared");
    },

    /**
     * Get index statistics
     */
    getIndexStats() {
        return {
            chunks: this.chunks.length,
            embeddings: this.embeddings.length,
            isIndexed: this.embeddings.length > 0,
            provider: this.config.provider,
            model: this.config.model,
        };
    },

    /**
     * Test connection to the configured provider
     */
    async testConnection() {
        if (!this.config.provider) {
            throw new Error("No provider configured");
        }

        try {
            // Try a simple embedding request
            await this.getEmbeddings(["test connection"]);
            return { success: true, message: "Connection successful" };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },
};

// Make globally available
window.AI = AI;
