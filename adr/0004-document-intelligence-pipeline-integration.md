# ADR-0004: Integrate Document Intelligence into the Ingestion Pipeline

## Status

Proposed

## Context

Meridian Studio currently treats Document Intelligence as a standalone Cognitive AI Service — users upload a document, see extracted data, and that's it. The result is not connected to the knowledge base.

Meanwhile, the Ingestion Pipeline (Upload → Chunk → Embed → Index) has no awareness of document structure. When a user ingests a scanned PDF or image-based document, the chunking step receives no extractable text and produces empty or garbage chunks. The RAG engine then fails to retrieve relevant context at query time, with no indication of why.

This creates two problems:

1. **Broken user experience** — scanned PDFs silently produce poor results. Users don't know why their queries fail.
2. **Wasted capability** — Document Intelligence can extract text from these files, but it sits in a separate page with no connection to the pipeline that needs it.

Having Document Intelligence as a standalone demo page adds no durable value. Integrating it into the ingestion pipeline solves a real problem and makes the platform cohesive.

## Decision

Add a **text extraction** stage to the ingestion pipeline, powered by Azure Document Intelligence, between Upload and Chunk.

### New pipeline

```
Upload → Extract → Chunk → Embed → Index
```

### Smart routing (backend)

Not all files need OCR. The backend detects whether extraction is needed:

| File type | Extraction strategy |
|-----------|-------------------|
| `.txt`, `.md` | Direct read — no extraction needed |
| `.docx` | Library-based text extraction (python-docx) |
| Text PDF (has text layer) | Basic PDF text extraction (PyPDF2/pdfplumber) |
| Scanned PDF (no text layer) | Route through Document Intelligence (`prebuilt-read`) |
| Images (`.png`, `.jpg`, `.tiff`) | Route through Document Intelligence (`prebuilt-read`) |

Detection logic: attempt basic text extraction first. If the result is empty or below a character threshold, fall back to Document Intelligence OCR.

### Extraction model

Use `prebuilt-read` as the default for ingestion. It extracts general text content, which is what the chunker needs. The specialized models (invoice, receipt, ID) extract structured fields — useful for analysis but not for RAG passage retrieval.

### Graceful degradation

If `AZURE_DOCUMENT_ENDPOINT` and `AZURE_DOCUMENT_KEY` are not configured:

- Text-based files (`.txt`, `.md`, `.docx`, text PDFs) continue to work normally
- Scanned PDFs and images produce a warning: "Document Intelligence not configured — scanned documents may produce poor results"
- The pipeline does not fail — it proceeds with whatever text was extractable

### Frontend changes

| Change | Detail |
|--------|--------|
| Ingest page | Add "Extract" as 5th pipeline stage between Upload and Chunk |
| Document Intelligence page | Repurpose as "Document Preview" — upload a file, see what the pipeline would extract. Useful for debugging extraction quality |
| Sidebar nav | Remove Document Intelligence from Cognitive AI Services section (3 services remain: Language, Vision, Speech) |
| Settings page | Remove Document Intelligence from the Cognitive AI Services list |
| Diagnostics | Document Intelligence API calls during ingestion are tracked in the existing diagnostics system |

### Repurposed page: Document Preview

The current Document Intelligence page becomes a diagnostic tool. Users upload a file and see exactly what text the extraction step would produce — content, paragraphs, tables, key-value pairs. This helps answer "why didn't Meridian find this in my document?" without touching the actual knowledge base.

The page keeps its existing UI (model selector, tabbed results) but is repositioned as a pipeline debugging tool rather than a standalone AI service.

## Alternatives Considered

- **Keep them separate**: Document Intelligence stays as a standalone demo. Scanned PDFs continue to produce poor ingestion results. Users must manually extract text and re-upload. No integration value.
- **Remove Document Intelligence entirely**: Loses the debugging/preview capability. Users have no way to inspect what the pipeline extracts.
- **Always run Document Intelligence on every file**: Unnecessary cost and latency for text-based files that don't need OCR. Smart routing avoids this.
- **Let users choose the extraction model during ingestion**: Adds complexity to the ingest UI. `prebuilt-read` is the correct default for RAG — specialized models are for structured data extraction, not passage retrieval.

## Consequences

- The ingestion pipeline gains OCR capability for scanned documents and images
- Azure Document Intelligence becomes a pipeline dependency for non-text files (with graceful fallback)
- Cognitive AI Services section shrinks from 4 to 3 pages (Language, Vision, Speech)
- Document Preview page provides extraction debugging without modifying the knowledge base
- Backend requires changes to the ingestion endpoint: file type detection, conditional OCR routing, extraction stage reporting
- Cost implication: Document Intelligence charges per page — ingesting a 100-page scanned PDF costs ~$1.50 (at $0.015/page for Read model). This should be visible in the Diagnostics panel
- Future: when the backend supports SSE or stage callbacks, the "Extract" stage can show real progress instead of timer-based simulation
