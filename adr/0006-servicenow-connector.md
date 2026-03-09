# ADR-0006: ServiceNow Knowledge Base Connector

## Status

Accepted

## Context

Meridian's knowledge base was populated exclusively through manual file uploads (PDF, TXT, Markdown, DOCX). Many enterprises store their IT knowledge articles in ServiceNow's Knowledge Management module. Requiring users to export articles as files and re-upload them creates friction and stale data.

We needed a way to pull ServiceNow KB articles directly into Meridian's ingestion pipeline.

## Decision

Add a **ServiceNow tab** to the existing Ingestion Pipeline page rather than creating a separate route. The connector uses a server-side credential model where ServiceNow instance URL, username, and password are configured on the backend — the frontend never handles credentials.

### Frontend changes

- **Source tabs** on the Ingest page: `File Upload` (existing) | `ServiceNow` (new)
- **ServiceNow tab** provides:
  - Test Connection button (calls `POST /ingest/servicenow/test`)
  - Optional filters: Knowledge Base name, Category, Article Limit
  - Sync Articles button (calls `POST /ingest/servicenow`)
  - Result display: ingested count, chunks count, message
  - Error handling with friendly messages for 502 (unreachable)
- **Types**: `ServiceNowIngestRequest` (filters only), `ServiceNowIngestResponse`
- **API methods**: `meridianApi.ingestServiceNow()`, `meridianApi.testServiceNowConnection()`

### Backend contract

| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/ingest/servicenow/test` | POST | (empty) | `{ status: string }` |
| `/ingest/servicenow` | POST | `{ kb_name?, category?, limit? }` | `{ ingested, chunks, message? }` |

### Why tabs, not a separate page

- Ingestion is the concept; file upload and ServiceNow are just sources
- Additional connectors (SharePoint, Confluence) become additional tabs — no route bloat
- Shared health status bar applies to all sources without duplication

### Security

- Credentials are stored server-side (environment variables), never sent from the browser
- The frontend only sends optional filter parameters

## Consequences

- New connectors follow the same tab pattern — add a source type, a tab button, and a component
- Backend must implement the two ServiceNow endpoints
- Suggested questions updated to reflect IT help desk and AI/GenAI topics typical of ServiceNow KBs
