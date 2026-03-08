import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { meridianApi } from '../api/meridian';
import { FileText, Settings, Upload, CheckCircle2, Circle, Loader2, AlertCircle, Database, Scissors, Binary, Info, ChevronRight } from 'lucide-react';

type PipelineStage = 'idle' | 'uploading' | 'chunking' | 'embedding' | 'indexing' | 'done' | 'error';

interface StageConfig {
  key: PipelineStage;
  label: string;
  icon: React.ElementType;
  description: string;
}

const STAGES: StageConfig[] = [
  { key: 'uploading', label: 'Upload', icon: Upload, description: 'Sending document to backend' },
  { key: 'chunking', label: 'Chunk', icon: Scissors, description: 'Splitting into passages' },
  { key: 'embedding', label: 'Embed', icon: Binary, description: 'Generating vector embeddings' },
  { key: 'indexing', label: 'Index', icon: Database, description: 'Writing to vector store' },
];

const RETRIEVAL_LABELS: Record<string, string> = {
  chroma: 'Local (Chroma)',
  azure: 'Azure AI Search',
};

const ACCEPTED_TYPES = '.pdf,.txt,.md,.docx';

function StageIndicator({ stage, currentStage, errorStage }: {
  stage: StageConfig;
  currentStage: PipelineStage;
  errorStage: PipelineStage | null;
}) {
  const stageOrder = STAGES.map((s) => s.key);
  const currentIdx = stageOrder.indexOf(currentStage);
  const thisIdx = stageOrder.indexOf(stage.key);
  const isError = errorStage === stage.key;
  const isActive = currentStage === stage.key && !isError;
  const isDone = currentStage === 'done' || (currentIdx > thisIdx && !isError);

  const Icon = stage.icon;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
      isError ? 'bg-red-50 border border-red-200' :
      isActive ? 'bg-primary-50 border border-primary-200' :
      isDone ? 'bg-emerald-50 border border-emerald-200' :
      'bg-gray-50 border border-gray-100'
    }`}>
      <div className="shrink-0">
        {isError ? (
          <AlertCircle className="w-5 h-5 text-red-500" />
        ) : isActive ? (
          <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
        ) : isDone ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        ) : (
          <Circle className="w-5 h-5 text-gray-300" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${
            isError ? 'text-red-500' :
            isActive ? 'text-primary-600' :
            isDone ? 'text-emerald-600' :
            'text-gray-400'
          }`} />
          <span className={`text-sm font-medium ${
            isError ? 'text-red-700' :
            isActive ? 'text-primary-700' :
            isDone ? 'text-emerald-700' :
            'text-gray-500'
          }`}>{stage.label}</span>
        </div>
        <p className={`text-xs mt-0.5 ${
          isError ? 'text-red-500' :
          isActive || isDone ? 'text-gray-500' :
          'text-gray-400'
        }`}>{stage.description}</p>
      </div>
    </div>
  );
}

export function Ingest() {
  const [files, setFiles] = useState<File[]>([]);
  const [currentStage, setCurrentStage] = useState<PipelineStage>('idle');
  const [errorStage, setErrorStage] = useState<PipelineStage | null>(null);
  const [result, setResult] = useState<{ ingested: number; chunks: number; message?: string } | null>(null);

  const { data: health } = useQuery({ queryKey: ['health'], queryFn: meridianApi.health });

  const ingest = useMutation({
    mutationFn: async (filesToIngest: File[]) => {
      setErrorStage(null);
      setResult(null);

      // Stage 1: Upload
      setCurrentStage('uploading');
      const formData = new FormData();
      filesToIngest.forEach((f) => formData.append('files', f));

      // The backend will handle chunk → embed → index.
      // We simulate stage progression based on timing since the backend
      // does all stages in one call. When the backend exposes stage
      // callbacks or SSE, we can wire them up here.
      const stageTimer = setTimeout(() => setCurrentStage('chunking'), 1500);
      const stageTimer2 = setTimeout(() => setCurrentStage('embedding'), 3000);
      const stageTimer3 = setTimeout(() => setCurrentStage('indexing'), 5000);

      try {
        const response = await meridianApi.ingest(formData);
        clearTimeout(stageTimer);
        clearTimeout(stageTimer2);
        clearTimeout(stageTimer3);
        setCurrentStage('done');
        return response;
      } catch (err) {
        clearTimeout(stageTimer);
        clearTimeout(stageTimer2);
        clearTimeout(stageTimer3);
        throw err;
      }
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: () => {
      setErrorStage(currentStage);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (selected?.length) {
      setFiles(Array.from(selected));
      setCurrentStage('idle');
      setErrorStage(null);
      setResult(null);
    }
  };

  const handleIngest = () => {
    if (files.length > 0) {
      ingest.mutate(files);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setCurrentStage('idle');
    setErrorStage(null);
    setResult(null);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Ingestion Pipeline</h1>
      <p className="text-gray-500 mt-1">Ingest documents into the knowledge base. Files are chunked, embedded, and indexed so Meridian can reference them when answering questions.</p>
      {health && (
        <p className="mt-2 text-xs text-gray-400 flex items-center gap-1.5">
          Documents will be indexed into
          <span className="font-medium text-gray-600">{RETRIEVAL_LABELS[health.retrieval_provider] ?? health.retrieval_provider}</span>
          ({health.document_count} documents indexed)
          —
          <Link to="/settings" className="inline-flex items-center gap-0.5 text-primary-600 hover:text-primary-700 transition-colors">
            <Settings className="w-3 h-3" />
            change in Settings
          </Link>
        </p>
      )}

      <details className="mt-6 group bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <summary className="flex items-center gap-3 p-4 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
          <Info className="w-5 h-5 text-blue-500 shrink-0" />
          <span className="font-medium flex-1">What should I ingest?</span>
          <ChevronRight className="w-4 h-4 text-blue-400 transition-transform group-open:rotate-90" />
        </summary>
        <div className="px-4 pb-4 pl-12">
          <p className="text-blue-700">
            Upload documents that contain knowledge you want Meridian to reference when answering questions.
            Good examples: product manuals, policy documents, FAQs, technical specs, research papers, or meeting notes.
            Each file is split into passages, converted to vector embeddings, and stored in your configured index
            so the RAG engine can retrieve relevant context at query time.
          </p>
          <p className="mt-2 text-blue-600">
            Supported formats: <span className="font-medium">PDF, TXT, Markdown, DOCX</span>.
            For best results, use text-rich documents — scanned images without OCR text will produce poor results.
          </p>
        </div>
      </details>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: File selection + action */}
        <div className="lg:col-span-2">
          <Card>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-300 transition-colors">
              <input
                type="file"
                id="file-ingest"
                className="hidden"
                accept={ACCEPTED_TYPES}
                multiple
                onChange={handleFileChange}
              />
              <label htmlFor="file-ingest" className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                <p className="mt-4 text-gray-600">
                  <span className="text-primary-600 font-medium">Select documents</span> to ingest
                </p>
                <p className="text-sm text-gray-400 mt-1">PDF, TXT, Markdown, DOCX — multiple files supported</p>
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-6 space-y-2">
                <p className="text-sm font-medium text-gray-700">{files.length} file{files.length > 1 ? 's' : ''} selected</p>
                {files.map((f) => (
                  <div key={f.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.name}</p>
                      <p className="text-xs text-gray-400">{(f.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                ))}

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleIngest}
                    loading={ingest.isPending}
                    disabled={currentStage === 'done'}
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Ingest Documents
                  </Button>
                  {(currentStage === 'done' || errorStage) && (
                    <Button onClick={handleReset} variant="secondary">
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Error display */}
          {ingest.isError && (
            <Card className="mt-4 border-red-200 bg-red-50">
              <p className="text-red-800 text-sm">{(ingest.error as Error).message}</p>
            </Card>
          )}

          {/* Success result */}
          {result && (
            <Card className="mt-4 border-emerald-200 bg-emerald-50">
              <h3 className="font-semibold text-emerald-800">Ingestion Complete</h3>
              <div className="mt-2 text-sm text-emerald-700 space-y-1">
                <p>Documents ingested: {result.ingested}</p>
                <p>Chunks created: {result.chunks}</p>
                {result.message && <p>{result.message}</p>}
              </div>
            </Card>
          )}
        </div>

        {/* Right: Pipeline stages */}
        <div>
          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Pipeline Stages</h3>
            <div className="space-y-2">
              {STAGES.map((stage) => (
                <StageIndicator
                  key={stage.key}
                  stage={stage}
                  currentStage={currentStage}
                  errorStage={errorStage}
                />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
