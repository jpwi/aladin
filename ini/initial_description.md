Local Notion-Like Knowledge Page 0. Goal & Constraints

Goal
Build a local, Notion-like knowledge page that runs in a browser, stores structured notes, images, and files, and is future-proof for AI summarization and deep linking.

Constraints

Runs locally

HTML + CSS + JS

No backend required initially

Must support later upgrade to filesystem autosave

Content must be machine-readable and stable (IDs, anchors)

1. High-Level Architecture

    **UPDATED: Encrypted Single-File Vault System**

    All data is now stored in a single encrypted `.aladin` file:

    Filesystem Layout:
    /index.html ← UI + editor
    /knowledge-base.aladin ← encrypted vault file (user-selected location)

    The vault file contains:
    - All document content (blocks)
    - All attachments (base64 encoded)
    - User settings

    Encryption:
    - AES-256-GCM encryption
    - PBKDF2 key derivation (100,000 iterations)
    - Password-based protection

    Sync Capability:
    - Single file can be stored on OneDrive, Dropbox, etc.
    - Open on any device with a browser
    - File System Access API for direct file access (Chrome/Edge)
    - Fallback mode for other browsers (import/export)

    Startup Flow:
    1. If vault file location is remembered → prompt for password → open vault
    2. If no remembered vault → show welcome screen (Create New / Open Existing)
    3. Password unlocks encryption and loads data

Runtime Storage

Primary: Encrypted .aladin vault file (via File System Access API)

Working: IndexedDB (session cache for performance)

Fallback: Download/upload for browsers without File System Access API

2. Layout Specification
   2.1 Main Layout Grid

Use CSS Grid or Flexbox:

+--------------------------------------------------+
| Sidebar (resizable) | Main Editor Area |
| | |
| | |
+--------------------------------------------------+

Sidebar:

Collapsible

Resizable via drag handle

Vault controls (settings, lock)

Main area:

Block-based editor (Notion-like)

3. Sidebar (Index / Navigation)
   3.1 Sidebar Structure
   [ Search Bar ]

---

▸ Topic A
▸ Subtopic A1
▸ Subtopic A1a
▸ Topic B
▸ Topic C

3.2 Index Source

Index is generated only from heading blocks

Heading levels define hierarchy

Example:

H1 → root topic

H2 → child

H3 → child of H2

3.3 Collapse Behavior (IMPORTANT)

Requirement:
Collapse downwards, not pyramid-style horizontal expansion.

Implementation rules

Tree uses vertical indentation only

Expanding a node:

Reveals children below

Does NOT push siblings sideways

No horizontal widening of sidebar

Recommended structure

<ul class="tree">
  <li>
    <button class="toggle">▸</button>
    <a href="#block-abc">Heading</a>
    <ul class="children hidden">...</ul>
  </li>
</ul>

3.4 Resizing

Add draggable vertical handle on right edge of sidebar

Width range:

Min: 200px

Max: 40vw

Store width in localStorage

3.5 Search Bar (Headings Only)

Scope

Search only heading blocks

Ignore body text

Features

Autocomplete dropdown

Keyboard navigation (↑ ↓ Enter)

Selecting a result:

Scrolls editor to heading

Updates URL hash

Search index

[
{ id: "block-a1", text: "Project Overview", level: 1 },
{ id: "block-b2", text: "Architecture", level: 2 }
]

4. Main Editor (Notion-Like)
   4.1 Editor Type

Block-based editor (Editor.js or similar)

Each block has:

Stable ID

Type

Data payload

4.2 Heading Levels

Requirement

User can assign heading levels (H1–H6)

Markdown-like shortcuts:

# → H1

## → H2

### → H3

Toolbar control also allowed

Stored as

{
"id": "block-xyz",
"type": "heading",
"level": 2,
"text": "Design Decisions"
}

4.3 Drag & Drop Upload (Images & Files)

Supported

Drag image into editor → image block

Drag any file → file block

Click upload also allowed

5. Attachments & Metadata (CRITICAL)
   5.1 File Handling Workflow

User drops file

Compute hash (SHA-256)

Rename file to <hash>.<ext>

Store file in /attachments/

Create block referencing the file

5.2 Metadata Storage (RECOMMENDED APPROACH)

❌ Do NOT store metadata in invisible HTML
✔ Store metadata in structured JSON, not DOM tricks

File Block Example
{
"id": "block-file-1",
"type": "file",
"file": {
"hash": "92bd11...",
"originalName": "report.pdf",
"mime": "application/pdf",
"size": 231993,
"ext": "pdf",
"created": "2026-01-18T12:33:00Z",
"tags": ["research", "finance"]
}
}

Image Block Example
{
"id": "block-img-1",
"type": "image",
"image": {
"hash": "a94f3c...",
"originalName": "diagram.png",
"width": 1280,
"height": 720,
"alt": "System architecture",
"caption": "High-level overview"
}
}

5.3 Why NOT Invisible HTML Metadata

Invisible DOM metadata:

Breaks AI parsing

Breaks exports

Is fragile

Hard to version

JSON metadata:

Explicit

Stable

AI-friendly

Exportable

6. Anchors & Deep Linking
   6.1 Block Anchors

Each block MUST render with:

<div id="block-xyz"></div>

6.2 URL Behavior

Clicking heading in sidebar:

index.html#block-xyz

AI can cite:

“See Architecture → index.html#block-b2”

7. Autosave Behavior
   7.1 Autosave Target

IndexedDB

Save on:

Block change

Drag/drop

Every N seconds (debounced)

7.2 Export / Import

Manual export to data.json

Import replaces IndexedDB state

8. AI-Readiness Requirements

Design MUST ensure:

One idea per block

Stable block IDs

Headings define structure

Files/images linked via metadata

No content hidden in HTML hacks

Later AI pipeline:

data.json → chunk by heading → summarize → link to blocks

8.5 AI/RAG System (Implemented)

The application includes a complete AI-powered knowledge retrieval system:

Features:

- Semantic chunking of content by headings (300-800 tokens per chunk)
- Vector embeddings for similarity search
- RAG (Retrieval Augmented Generation) for contextual answers
- Floating chat panel for natural language queries
- Source citations linking back to relevant sections

Supported Providers:

- OpenAI (GPT-4, GPT-3.5-turbo)
- Google Gemini
- Ollama (local models)
- LM Studio (local models)

Implementation Files:

- js/ai.js - Core RAG engine (chunking, embeddings, retrieval, generation)
- js/ai-chat.js - Chat UI component

Workflow:

1. Content is chunked by heading sections
2. Embeddings are generated via configured provider
3. User queries are embedded and matched via cosine similarity
4. Top-K relevant chunks are retrieved (default: 3)
5. Context is sent to LLM with query for answer generation
6. Sources are displayed with clickable links to sections

7. Non-Goals (Explicit)

No real-time collaboration

No cloud sync

No permissions system

No markdown files on disk initially

10. Acceptance Criteria

The implementation is complete when:

Sidebar shows collapsible heading index

Collapse expands downward only

Sidebar is resizable

Search autocompletes headings only

Editor supports heading levels

Drag & drop uploads work

Attachments stored with hashed names

Metadata stored in JSON

URL anchors scroll correctly

Data survives reload (IndexedDB)

**Encrypted Vault System:**

All data stored in single encrypted .aladin file

Password protection with AES-256-GCM encryption

Startup prompts for password

Vault settings available (change password, export, lock)

Attachments stored as base64 in vault

Orphaned attachments cleaned up on save

**AI/RAG System:**

Floating chat panel accessible via toggle button

Content indexed into semantic chunks

Vector similarity search for retrieval

Multiple AI provider support (OpenAI, Gemini, Ollama, LM Studio)

Source citations link to relevant sections
