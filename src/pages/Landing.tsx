import { Link } from 'react-router-dom';
import {
  BrainCircuit,
  Database,
  Shield,
  Languages,
  Eye,
  Mic,
  FileSearch,
  ArrowRight,
  Github,
  Linkedin,
} from 'lucide-react';

const CORE_CAPABILITIES = [
  {
    icon: BrainCircuit,
    title: 'Ask Meridian',
    desc: 'Multi-turn RAG chat grounded in your documents with confidence scoring and governance guardrails.',
  },
  {
    icon: Database,
    title: 'Ingestion Pipeline',
    desc: 'Upload, extract, chunk, embed, and index documents into a searchable knowledge base.',
  },
  {
    icon: Shield,
    title: 'Governance & Diagnostics',
    desc: 'Every query is traced, scored, and auditable. Refusals are transparent with confidence thresholds.',
  },
  {
    icon: FileSearch,
    title: 'Document Intelligence',
    desc: 'Structured extraction from invoices, receipts, IDs, and layouts.',
  },
];

const LAB_CAPABILITIES = [
  {
    icon: Languages,
    title: 'Language Intelligence',
    desc: 'Sentiment analysis, entity recognition, key phrases, and language detection.',
  },
  {
    icon: Eye,
    title: 'Vision Intelligence',
    desc: 'Image captioning, object detection, tagging, and OCR text extraction.',
  },
  {
    icon: Mic,
    title: 'Speech Services',
    desc: 'Speech-to-text transcription with word timings and text-to-speech synthesis.',
  },
];

export function Landing() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Iridescent top accent */}
      <div className="h-1 bg-gradient-to-r from-orange-400 via-violet-500 to-teal-400 shrink-0" />

      {/* Nav */}
      <header className="max-w-6xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg overflow-hidden shadow-lg">
            <img src="/vpllogo.jfif" alt="VPL" className="w-full h-full object-contain" />
          </div>
          <span className="text-lg font-bold iridescent-text">Meridian Studio</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/tvprasad/meridian-studio"
            target="_blank"
            rel="noreferrer"
            className="text-white/50 hover:text-white/90 transition-colors"
            title="GitHub"
          >
            <Github className="w-5 h-5" />
          </a>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-teal-500 text-white text-sm font-medium hover:from-violet-500 hover:to-teal-400 transition-all shadow-lg shadow-violet-500/20"
          >
            Open Studio
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-medium tracking-wide uppercase text-violet-400 mb-4">
            Governed AI Platform
          </p>
          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight">
            <span className="iridescent-text">Ask your documents</span>
            <br />
            <span className="text-white/90">anything.</span>
          </h1>
          <p className="mt-6 text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
            Meridian is a RAG-powered knowledge engine with built-in governance.
            Ingest documents, ask questions in plain language, and get grounded
            answers with confidence scoring and full traceability.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 text-white font-semibold hover:from-violet-500 hover:to-teal-400 transition-all shadow-xl shadow-violet-500/25 text-base"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="https://github.com/tvprasad/meridian"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl border border-white/15 text-white/70 hover:text-white hover:border-white/30 transition-all text-base"
            >
              <Github className="w-5 h-5" />
              View Source
            </a>
          </div>
        </div>
      </section>

      {/* Core capabilities */}
      <section className="max-w-6xl mx-auto w-full px-6 pb-16">
        <h2 className="text-center text-2xl font-bold text-white/90 mb-12">
          Everything you need for enterprise AI
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CORE_CAPABILITIES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-violet-500/30 hover:bg-white/[0.06] transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/20 to-teal-500/20 flex items-center justify-center mb-4 group-hover:from-violet-600/30 group-hover:to-teal-500/30 transition-colors">
                <Icon className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="font-semibold text-white/90 mb-1.5">{title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Lab — Preview */}
      <section className="max-w-6xl mx-auto w-full px-6 pb-24">
        <div className="flex items-center justify-center gap-3 mb-10">
          <h2 className="text-xl font-bold text-white/70">AI Lab</h2>
          <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400">Preview</span>
        </div>
        <p className="text-center text-sm text-white/40 -mt-8 mb-10">Interactive playgrounds to explore Azure AI capabilities directly.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {LAB_CAPABILITIES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group rounded-2xl border border-white/10 border-dashed bg-white/[0.02] p-6 hover:border-violet-500/30 hover:bg-white/[0.05] transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/15 to-teal-500/15 flex items-center justify-center mb-4 group-hover:from-violet-600/25 group-hover:to-teal-500/25 transition-colors">
                <Icon className="w-5 h-5 text-violet-400/70" />
              </div>
              <h3 className="font-semibold text-white/75 mb-1.5">{title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/40">Built by</span>
            <span className="text-sm text-white/70 iridescent-text">Prasad Thiriveedi</span>
            <div className="flex items-center gap-2 ml-1">
              <a
                href="https://github.com/tvprasad/"
                target="_blank"
                rel="noreferrer"
                className="text-white/40 hover:text-violet-400 transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/-prasad"
                target="_blank"
                rel="noreferrer"
                className="text-white/40 hover:text-teal-400 transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
          <p className="text-xs text-white/25">
            Microsoft Azure and all third-party product names are trademarks of their respective owners.
          </p>
        </div>
      </footer>
    </div>
  );
}
