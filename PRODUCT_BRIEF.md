# Meridian Platform — Product Brief

## Executive Summary

Meridian is a governed, self-hosted Retrieval-Augmented Generation (RAG) platform that gives enterprises AI-powered answers they can actually trust. Every response carries a confidence score, a citation trail, and a governance decision — so your teams get grounded answers from your own data, with full observability and zero vendor lock-in.

## The Problem

Organizations adopting generative AI face three unsolved tensions:

1. **Trust gap** — LLMs hallucinate. When an engineer asks "What's our rollback procedure for Service X?", a wrong answer costs hours or causes outages. Most AI tools return answers with no confidence signal and no way to say "I don't know."
2. **Data gravity** — Critical knowledge lives in internal wikis, ServiceNow, runbooks, and PDFs. Public AI products can't reach it. Custom RAG pipelines can, but they ship without governance, observability, or a usable frontend.
3. **Vendor lock-in** — Teams build on one provider's stack and discover they can't switch models, swap vector stores, or run locally without rewriting everything.

## The Solution

Meridian is an end-to-end knowledge platform: ingest your documents, ground your AI in your data, and give your teams a governed chat interface — all deployed on infrastructure you control.

| Layer | What It Does |
|-------|-------------|
| **Meridian Studio** | React frontend — chat, agent, ingestion, evaluation, cognitive services |
| **Meridian API** | Python FastAPI backend — RAG engine, confidence scoring, governance |
| **Meridian MCP** | Model Context Protocol server for tool-calling workflows |
| **Azure Infrastructure** | Container Apps, Cognitive Services, AI Search, SQL — or run fully local |

## Key Capabilities

### Ask Meridian — Grounded Answers with Guardrails
Multi-turn conversational search over your knowledge base. Every answer includes a confidence score, source citations, and markdown rendering. When confidence falls below your configured threshold, Meridian refuses to answer and explains why — preventing hallucinated responses from reaching your users.

### AI Operations Agent — Reasoning Over Live Systems
A ReAct-based agent that searches ServiceNow incidents, change requests, and your knowledge base in a single query. Displays a step-by-step reasoning timeline so operators can see exactly how the AI arrived at its answer. Built for complex operational questions like "What changed before the outage last Tuesday?"

### Ingestion Pipeline — Your Data, Your Way
Multi-stage document pipeline (Upload, Extract, Chunk, Embed, Index) with support for TXT, Markdown, PDF, and DOCX. Includes a ServiceNow connector that syncs KB articles directly into the knowledge base — no manual exports required.

### Evaluation Dashboard — Measure What Matters
Aggregate metrics (total queries, average confidence, refusal rate, P50/P95 latency) and a paginated query log with sortable columns and filters. Know exactly how your AI is performing, where it refuses, and where retrieval quality needs improvement.

### Cognitive AI Services — Azure AI at Your Fingertips
Language intelligence (sentiment, entities, key phrases), vision (image analysis, OCR), speech (STT/TTS), and document intelligence (invoice, receipt, ID extraction) — all through a clean, governed interface with per-call cost tracking.

## Why Meridian?

| Challenge | ChatGPT Enterprise | Azure AI Studio | Custom RAG | **Meridian** |
|-----------|-------------------|-----------------|------------|-------------|
| Confidence-driven governance | No | Partial | Build it yourself | Built in — refuse, explain, threshold |
| Provider agility (swap LLM/vector store) | Locked to OpenAI | Locked to Azure | Possible but painful | Config change — Ollama or Azure, Chroma or AI Search |
| Full observability (trace IDs, per-stage timing) | No | Partial | Build it yourself | Every query traced end-to-end |
| ITSM integration (ServiceNow) | No | No | Build it yourself | Native — incidents, changes, KB sync |
| Self-hosted / air-gapped option | No | No | Yes | Yes — run entirely local with Ollama + Chroma |
| Production-ready frontend | Yes | Studio UI | Build it yourself | Meridian Studio — dark mode, keyboard shortcuts, offline detection |
| Calibrated confidence (isotonic regression) | No | No | Research project | Built in and optional |

## The 2 AM Problem

Every operations team knows this story: a pipeline fails at 2 AM. Someone gets a phone call. They log in, dig through logs, discover the source system changed a schema. They patch it manually. No sleep.

Meridian's AI Operations Agent is built for this. Today, an operator can ask "What incidents are open for the data pipeline?" and the agent searches ServiceNow, reasons through the results step-by-step, and delivers a grounded answer with full transparency.

Tomorrow, the agent evolves from reactive to autonomous: detect pipeline failures via scheduled health checks, diagnose the root cause using ReAct reasoning over incidents and runbooks, and resolve the issue — or create a pre-triaged incident with the diagnosis — before anyone's phone rings. The infrastructure is already in place: the ReAct executor, the ServiceNow toolchain, and the evaluation telemetry. What comes next is the trigger layer and write-back capability.

**The goal: your AI agent handles the 2 AM call so your engineers don't have to.**

## Architecture at a Glance

```
Users --> Meridian Studio (React SPA)
              |
              v
         Meridian API (FastAPI)
         /        |        \
   LLM Provider   Vector Store   ServiceNow
   (Ollama or     (Chroma or     (Incidents,
    Azure OpenAI)  AI Search)     Changes, KB)
```

All components run as containers. No proprietary runtimes, no SDK lock-in. The same governance layer applies regardless of which LLM or vector store is backing the system.

## Deployment Options

| Mode | LLM | Vector Store | Infrastructure | Use Case |
|------|-----|-------------|----------------|----------|
| **Local** | Ollama | Chroma | Docker Compose | Development, demos, air-gapped environments |
| **Cloud** | Azure OpenAI | Azure AI Search | Azure Container Apps | Production, team-wide deployment |
| **Hybrid** | Azure OpenAI | Chroma (local) | Mix | Staged migration, cost optimization |

Switching between modes requires configuration changes only — no code modifications, no redeployment of the frontend.

## Security & Governance

- **Self-hosted**: Your data never leaves your infrastructure. No third-party SaaS dependency for core RAG functionality.
- **Confidence thresholds**: Configurable per-deployment. Below threshold, the system refuses to answer and provides an explanation — preventing low-confidence hallucinations.
- **Trace IDs on every query**: Full audit trail from question to retrieval scores to generated answer.
- **Session-scoped diagnostics**: API call tracking, cost estimation, and latency metrics visible to operators on every page.
- **No training on your data**: When using Azure OpenAI, your prompts and completions are not used to train models.

## Who Is This For?

| Persona | Why They Care |
|---------|--------------|
| **VP of Engineering / CTO** | Governed AI adoption without vendor lock-in. Confidence scoring = responsible AI story for the board. |
| **Platform / DevOps Teams** | Self-hosted, containerized, observable. Integrates with ServiceNow. Runs local or in Azure. |
| **IT Operations / SRE** | AI agent that reasons over incidents, changes, and runbooks — not just a chatbot. |
| **Knowledge Management** | Ingest documents and ServiceNow KB articles into a single searchable, AI-powered knowledge base. |
| **AI / ML Teams** | Calibrated confidence, evaluation dashboard, provider agility — the plumbing they'd otherwise build themselves. |

## Roadmap Highlights

| Capability | Status |
|-----------|--------|
| Multi-turn chat with confidence governance | Shipped |
| ReAct AI Operations Agent | Shipped |
| ServiceNow connector (KB sync) | Shipped |
| Evaluation dashboard with metrics | Shipped |
| Cognitive AI Services (Language, Vision, Speech, Document) | Shipped |
| User feedback loop (thumbs up/down per answer) | Planned |
| Authentication and RBAC | Planned |
| Scheduled ServiceNow sync (cron-based) | Planned |
| Query log export (CSV/JSON) | Planned |
| Multi-tenant workspace isolation | Planned |
| Confluence / SharePoint connectors | Planned |

---

**Built by Prasad Thiriveedi** | [studio.vplsolutions.com](https://studio.vplsolutions.com) | [api.vplsolutions.com](https://api.vplsolutions.com)
