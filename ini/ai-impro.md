You’re running into a very common wall with local 7–8B models, and your intuition is correct:
the issue is not just “model quality”, it’s usually retrieval + context pressure + prompting.

Below is a practical, realistic playbook to improve results without giving up data ownership.

First: set expectations for an 8B local model

A model like deepseek-r1-qwen3-8b can:

Summarize

Extract facts

Answer grounded questions

But it will struggle with:

Large context windows filled with noisy chunks

Weak retrieval

Multi-hop reasoning across many documents

Ambiguous questions

So improvement comes mostly from system design, not upgrading the model.

1. Fix retrieval before touching the LLM (most important)
   Common problem

“I have a large base of text”

Large corpus + small model = retrieval errors dominate.

What to do
A. Reduce chunk size

Many systems over-chunk.

Target:

250–500 tokens per chunk

One idea per chunk

Never cross sections

Smaller chunks → higher retrieval precision.

B. Increase metadata use (very underused)

Store rich metadata and filter aggressively.

Example metadata:

{
"file": "notes.html",
"section": "Backup Strategy",
"tags": ["backup", "s3", "encryption"],
"type": "procedure"
}

Then:

Filter by file

Filter by section

Filter by tag

Filter by type

This dramatically improves relevance for small models.

C. Use hybrid search (vector + keyword)

Pure vector search often fails for:

Acronyms

Config values

Code-ish text

Exact terms

Use:

Vector similarity

BM25 / keyword search

Then merge results.

This alone often gives a huge boost.

2. Improve embeddings (often overlooked)
   If embeddings are weak, everything is weak

If you’re using:

Old OpenAI embeddings

Small local embedding models

You’re losing recall.

Better local embedding models

Run locally if possible:

bge-large-en-v1.5

e5-large-v2

bge-m3 (multilingual, very strong)

These often outperform cloud embeddings for RAG.

Embed questions differently

Use query-specific prompts if supported:

Represent this question for retrieving relevant passages:
{{query}}

This matters a lot for e5/bge models.

3. Reduce context load aggressively
   Mistake

Passing 8–15 chunks to an 8B model.

Fix

Use:

Top 3–5 chunks

Hard token budget

If the answer isn’t in 5 chunks, retrieval is broken.

Add a re-ranking step

Even a tiny cross-encoder helps.

Options:

bge-reranker-large

LLM-based re-ranking (short prompt)

This selects the best 3 chunks from the top 10.

4. Make the LLM’s job boringly simple

Small models fail when they must:

Decide relevance

Infer missing facts

Reword creatively

Force extractive behavior
System prompt (stronger than before)
You are a document assistant.

Rules:

- Use only the provided text.
- Do not infer or guess.
- Do not rephrase unless necessary.
- Prefer copying original sentences.
- If information is missing, say "Not found".
- Cite exact section anchors.

Ask better questions

Instead of:

“How does the backup system work?”

Ask:

“According to the notes, where are backups stored and how long are they retained?”

This massively improves accuracy on small models.

5. Add a two-step answering pipeline (very effective)

Instead of asking the LLM directly:

Step 1: Extraction

Prompt:

Extract all sentences relevant to the question.
Return them verbatim with their source anchors.

Step 2: Summarization

Prompt:

Summarize the extracted sentences without adding new information.

This reduces hallucination by orders of magnitude.

Even weak models perform well here.

6. Pre-compute summaries (hierarchical RAG)

For large knowledge bases:

Build:

Section summaries

File-level summaries

Store them as separate chunks.

Then:

Retrieve summaries first

Narrow down to sections

Retrieve raw text only if needed

This is huge for performance with small models.

7. Accept model limits (and compensate)

An honest assessment:

Task 8B local Mitigation
Exact citation ⚠️ Strong metadata
Multi-section answers ❌ Two-step pipeline
Large context reasoning ❌ Hierarchical retrieval
Factual Q&A ✅ Smaller chunks
Summaries ✅ Extract-then-summarize 8. When to scale up (still local)

If you can:

14B–32B models are a big jump

Context handling improves a lot

Good local upgrades:

Qwen2.5-14B

DeepSeek-R1-14B

Mixtral (if you have RAM)

9. Quick checklist (actionable)

If results are bad, check in this order:

❓ Are chunks ≤500 tokens?

🔍 Hybrid search enabled?

🧠 Good embeddings?

🏷 Metadata filtering?

📉 ≤5 chunks sent to LLM?

📌 Extractive prompt?

🔁 Two-step pipeline?

Fixing #1–#4 usually gives the biggest gains.

Final takeaway

Small local models don’t fail because they’re dumb.
They fail because they’re asked to do too much.

Make retrieval precise, reduce context, force extraction, and they become surprisingly reliable.
