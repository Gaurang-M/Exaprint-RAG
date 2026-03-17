# Exaprint RAG

A Retrieval-Augmented Generation (RAG) system for the Exaprint website. It crawls and indexes web pages into a vector database, then answers natural language questions using the indexed content.

## Architecture

```
Web Pages → Scraper → Chunker → Embedder (OpenAI) → ChromaDB
                                                          ↓
User Question → Retriever → LLM (Claude) → Answer + Sources
```

**Stack:**
- **Embeddings:** OpenAI `text-embedding-3-small`
- **LLM:** Anthropic Claude (default: `claude-haiku-4-5`)
- **Vector DB:** ChromaDB
- **Framework:** LangChain + Express + TypeScript

## Prerequisites

- Node.js >= 20
- Docker (for ChromaDB)
- OpenAI API key
- Anthropic API key

## Setup

**1. Install dependencies**
```bash
npm install
```

**2. Configure environment**
```bash
cp .env.example .env
```
Edit `.env` and fill in your API keys:

| Variable | Description | Default |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI API key (for embeddings) | required |
| `ANTHROPIC_API_KEY` | Anthropic API key (for answer generation) | required |
| `CHROMA_URL` | ChromaDB server URL | `http://localhost:8000` |
| `CHROMA_COLLECTION_NAME` | Collection name in ChromaDB | `exaprint_docs` |
| `ANTHROPIC_MODEL` | Claude model ID | `claude-haiku-4-5-20251001` |
| `OPENAI_EMBEDDING_MODEL` | OpenAI embedding model | `text-embedding-3-small` |
| `PORT` | API server port | `3000` |
| `RETRIEVER_K` | Number of chunks retrieved per query | `5` |

**3. Start ChromaDB**
```bash
docker compose up -d
```

## Usage

### Step 1 — Ingest web pages

Scrape one or more URLs and store them in ChromaDB:

```bash
# Single page
npm run ingest -- https://www.exaprint.fr/

# Multiple URLs
npm run ingest -- https://www.exaprint.fr/ https://www.exaprint.fr/about

# From a file (one URL per line, # lines are ignored)
npm run ingest -- --file urls.txt

# Full site crawl (depth 5, excluding account/checkout pages)
npm run ingest:site -- https://www.exaprint.fr/
```

**Ingest options:**

| Flag | Description | Default |
|---|---|---|
| `-d, --depth <n>` | Crawl depth (0 = single page only) | `0` |
| `-e, --exclude <paths...>` | URL paths to skip (e.g. `/login /account`) | — |
| `-t, --timeout <ms>` | Request timeout per page | `10000` |
| `--clear` | Wipe the collection before ingesting | — |
| `-f, --file <path>` | Text file with one URL per line | — |
| `-c, --collection <name>` | ChromaDB collection name | from `.env` |

### Step 2 — Start the API server

```bash
npm run serve

# With auto-reload on file changes
npm run serve:watch
```

### Step 3 — Query

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What paper formats does Exaprint offer?"}'
```

**Response:**
```json
{
  "question": "What paper formats does Exaprint offer?",
  "answer": "Exaprint offers formats including A4, A3, A5...",
  "sources": [
    "https://www.exaprint.fr/flyers",
    "https://www.exaprint.fr/brochures"
  ]
}
```

**Request body:**

| Field | Type | Description |
|---|---|---|
| `question` | `string` | The question to answer (max 1000 chars) |
| `k` | `number` (optional) | Override number of chunks to retrieve (1–20) |

## Project Structure

```
src/
├── api/
│   ├── middleware/       # Error handler, request logger
│   ├── routes/query.ts   # POST /query endpoint
│   └── server.ts         # Express app entry point
├── cli/
│   └── ingest.ts         # CLI for ingesting URLs
├── config/
│   └── env.ts            # Environment variable validation
├── ingestion/
│   ├── embedder.ts       # OpenAI embeddings
│   ├── pipeline.ts       # Orchestrates scrape → chunk → embed → store
│   ├── splitter.ts       # Text chunking
│   └── vectorStore.ts    # ChromaDB client
├── loaders/
│   └── webLoader.ts      # Web scraper with crawl support
├── retrieval/
│   ├── chain.ts          # RAG chain (retrieve + generate)
│   └── retriever.ts      # ChromaDB retriever
└── utils/
    └── logger.ts         # Logger
```
