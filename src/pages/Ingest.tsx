import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { meridianApi } from '../api/meridian';
import { ApiError } from '../api/client';
import type { ServiceNowIngestResponse, ServiceNowStatusResponse } from '../api/types';
import { FileText, FileCode, FileType2, FileSearch, Settings, Upload, CheckCircle2, Circle, Loader2, AlertCircle, Database, Scissors, Binary, Info, ChevronRight, ArrowRight, Globe, CheckCircle, XCircle } from 'lucide-react';

type IngestSource = 'file' | 'servicenow';

type PipelineStage = 'idle' | 'uploading' | 'extracting' | 'chunking' | 'embedding' | 'indexing' | 'done' | 'error';

interface StageConfig {
  key: PipelineStage;
  label: string;
  icon: React.ElementType;
  description: string;
}

const STAGES: StageConfig[] = [
  { key: 'uploading', label: 'Upload', icon: Upload, description: 'Sending document to backend' },
  { key: 'extracting', label: 'Extract', icon: FileSearch, description: 'Extracting text (OCR for scanned docs)' },
  { key: 'chunking', label: 'Chunk', icon: Scissors, description: 'Splitting into passages' },
  { key: 'embedding', label: 'Embed', icon: Binary, description: 'Generating vector embeddings' },
  { key: 'indexing', label: 'Index', icon: Database, description: 'Writing to vector store' },
];

const RETRIEVAL_LABELS: Record<string, string> = {
  chroma: 'Local (Chroma)',
  azure: 'Azure AI Search',
};

const ACCEPTED_TYPES = '.pdf,.txt,.md,.docx';

function getFileIcon(filename: string): { Icon: React.ElementType; color: string } {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':  return { Icon: FileType2, color: 'text-red-400' };
    case 'md':
    case 'markdown': return { Icon: FileCode, color: 'text-purple-400' };
    case 'docx':
    case 'doc':  return { Icon: FileText, color: 'text-blue-400' };
    default:     return { Icon: FileText, color: 'text-gray-400 dark:text-gray-500' };
  }
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

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
      isError ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' :
      isActive ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800' :
      isDone ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' :
      'bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10'
    }`}>
      <div className="shrink-0">
        {isError ? (
          <AlertCircle className="w-5 h-5 text-red-500" />
        ) : isActive ? (
          <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
        ) : isDone ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        ) : (
          <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${
            isError ? 'text-red-500' :
            isActive ? 'text-primary-600 dark:text-primary-400' :
            isDone ? 'text-emerald-600 dark:text-emerald-400' :
            'text-gray-400 dark:text-gray-500'
          }`} />
          <span className={`text-sm font-medium ${
            isError ? 'text-red-700 dark:text-red-400' :
            isActive ? 'text-primary-700 dark:text-primary-400' :
            isDone ? 'text-emerald-700 dark:text-emerald-400' :
            'text-gray-500 dark:text-gray-400'
          }`}>{stage.label}</span>
        </div>
        <p className={`text-xs mt-0.5 ${
          isError ? 'text-red-500' :
          isActive || isDone ? 'text-gray-500 dark:text-gray-400' :
          'text-gray-400 dark:text-gray-500'
        }`}>{stage.description}</p>
      </div>
    </div>
  );
}

function friendlySnowError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 502) return `Could not reach the ServiceNow instance: ${err.message}`;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred.';
}

function ServiceNowTab({ onSyncSuccess }: { onSyncSuccess: () => void }) {
  const [kbName, setKbName] = useState('');
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [result, setResult] = useState<ServiceNowIngestResponse | null>(null);
  const [statusData, setStatusData] = useState<ServiceNowStatusResponse | null>(null);

  const checkStatus = useMutation({
    mutationFn: () => meridianApi.serviceNowStatus(),
    onSuccess: (data) => setStatusData(data),
    onError: () => setStatusData(null),
  });

  const sync = useMutation({
    mutationFn: () =>
      meridianApi.ingestServiceNow({
        ...(kbName.trim() && { kb_name: kbName.trim() }),
        ...(category.trim() && { category: category.trim() }),
        ...(limit && Number(limit) > 0 && { limit: Number(limit) }),
      }),
    onSuccess: (data) => {
      setResult(data);
      onSyncSuccess();
    },
  });

  const resetForm = () => {
    setResult(null);
    sync.reset();
    setStatusData(null);
    checkStatus.reset();
  };

  return (
    <div className="mt-8">
      <Card>
        {/* Connection test */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              ServiceNow Connection
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Credentials are configured on the backend. Use Check Status to verify.</p>
          </div>
          <div className="flex items-center gap-3">
            {statusData?.configured === true && (
              <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                Configured
              </span>
            )}
            {statusData?.configured === false && (
              <span className="inline-flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                <XCircle className="w-4 h-4" />
                Not configured — set credentials on the backend
              </span>
            )}
            {checkStatus.isError && (
              <span className="inline-flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
                <XCircle className="w-4 h-4" />
                {friendlySnowError(checkStatus.error)}
              </span>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => checkStatus.mutate()}
              loading={checkStatus.isPending}
            >
              Check Status
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/10">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Filters (optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Knowledge Base</label>
              <input
                type="text"
                placeholder="e.g. IT Knowledge Base"
                value={kbName}
                onChange={(e) => setKbName(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 dark:border-white/15 p-2.5 text-sm dark:bg-gray-900 dark:text-gray-200 focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Category</label>
              <input
                type="text"
                placeholder="e.g. Networking"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 dark:border-white/15 p-2.5 text-sm dark:bg-gray-900 dark:text-gray-200 focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Article Limit</label>
              <input
                type="number"
                min="1"
                placeholder="All articles"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 dark:border-white/15 p-2.5 text-sm dark:bg-gray-900 dark:text-gray-200 focus:border-primary-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Sync button */}
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/10 flex gap-3">
          <Button
            onClick={() => sync.mutate()}
            loading={sync.isPending}
            disabled={!!result}
          >
            <Database className="w-4 h-4 mr-2" />
            Sync Articles
          </Button>
          {(result || sync.isError) && (
            <Button onClick={resetForm} variant="secondary">
              Reset
            </Button>
          )}
        </div>
      </Card>

      {/* Error */}
      {sync.isError && (
        <Card className="mt-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <p className="text-red-800 dark:text-red-300 text-sm">{friendlySnowError(sync.error)}</p>
        </Card>
      )}

      {/* Success */}
      {result && (
        <Card className="mt-4 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">
          <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">Sync Complete</h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-white/5 rounded-lg px-4 py-3 border border-emerald-100 dark:border-emerald-800">
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{result.ingested}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{result.ingested === 1 ? 'article' : 'articles'} ingested</p>
            </div>
            <div className="bg-white dark:bg-white/5 rounded-lg px-4 py-3 border border-emerald-100 dark:border-emerald-800">
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{result.chunks}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{result.chunks === 1 ? 'chunk' : 'chunks'} indexed</p>
            </div>
          </div>
          {result.message && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-3">{result.message}</p>
          )}
          <div className="mt-3 flex justify-end">
            <Link
              to="/query"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 transition-colors"
            >
              Query the knowledge base
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

export function Ingest() {
  const [source, setSource] = useState<IngestSource>('file');
  const [files, setFiles] = useState<File[]>([]);
  const [currentStage, setCurrentStage] = useState<PipelineStage>('idle');
  const [errorStage, setErrorStage] = useState<PipelineStage | null>(null);
  const [result, setResult] = useState<{ ingested: number; chunks: number; message?: string } | null>(null);

  const queryClient = useQueryClient();
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
      const stageTimer = setTimeout(() => setCurrentStage('extracting'), 1200);
      const stageTimer2 = setTimeout(() => setCurrentStage('chunking'), 2800);
      const stageTimer3 = setTimeout(() => setCurrentStage('embedding'), 4500);
      const stageTimer4 = setTimeout(() => setCurrentStage('indexing'), 6500);

      try {
        const response = await meridianApi.ingest(formData);
        clearTimeout(stageTimer);
        clearTimeout(stageTimer2);
        clearTimeout(stageTimer3);
        clearTimeout(stageTimer4);
        setCurrentStage('done');
        return response;
      } catch (err) {
        clearTimeout(stageTimer);
        clearTimeout(stageTimer2);
        clearTimeout(stageTimer3);
        clearTimeout(stageTimer4);
        throw err;
      }
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['health'] });
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ingestion Pipeline</h1>
      <p className="text-gray-500 dark:text-gray-400 mt-1">Ingest documents into the knowledge base. Files are chunked, embedded, and indexed so Meridian can reference them when answering questions.</p>
      {health && (
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
          Documents will be indexed into
          <span className="font-medium text-gray-600 dark:text-gray-300">{RETRIEVAL_LABELS[health.retrieval_provider] ?? health.retrieval_provider}</span>
          ({plural(health.document_count, 'document')} indexed)
          —
          <Link to="/settings" className="inline-flex items-center gap-0.5 text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors">
            <Settings className="w-3 h-3" />
            change in Settings
          </Link>
        </p>
      )}

      {/* Source tabs */}
      <div className="flex gap-1 mt-6 border-b border-gray-200 dark:border-white/10">
        <button
          onClick={() => setSource('file')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors -mb-px flex items-center gap-2 ${
            source === 'file'
              ? 'bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/10 border-b-white dark:border-b-transparent text-primary-700 dark:text-primary-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Upload className="w-4 h-4" />
          File Upload
        </button>
        <button
          onClick={() => setSource('servicenow')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors -mb-px flex items-center gap-2 ${
            source === 'servicenow'
              ? 'bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/10 border-b-white dark:border-b-transparent text-primary-700 dark:text-primary-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          ServiceNow
        </button>
      </div>

      {source === 'file' && (
        <>
          <details className="mt-6 group bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-300">
            <summary className="flex items-center gap-3 p-4 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
              <Info className="w-5 h-5 text-blue-500 shrink-0" />
              <span className="font-medium flex-1">What should I ingest?</span>
              <ChevronRight className="w-4 h-4 text-blue-400 transition-transform group-open:rotate-90" />
            </summary>
            <div className="px-4 pb-4 pl-12">
              <p className="text-blue-700 dark:text-blue-400">
                Upload documents that contain knowledge you want Meridian to reference when answering questions.
                Good examples: product manuals, policy documents, FAQs, technical specs, research papers, or meeting notes.
                Each file is split into passages, converted to vector embeddings, and stored in your configured index
                so the RAG engine can retrieve relevant context at query time.
              </p>
              <p className="mt-2 text-blue-600 dark:text-blue-400">
                Supported formats: <span className="font-medium">PDF, TXT, Markdown, DOCX</span>.
                For best results, use text-rich documents — scanned images without OCR text will produce poor results.
              </p>
            </div>
          </details>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: File selection + action */}
            <div className="lg:col-span-2">
              <Card>
                <div className="border-2 border-dashed border-gray-300 dark:border-white/15 rounded-lg p-8 text-center hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                  <input
                    type="file"
                    id="file-ingest"
                    className="hidden"
                    accept={ACCEPTED_TYPES}
                    multiple
                    onChange={handleFileChange}
                  />
                  <label htmlFor="file-ingest" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto" />
                    <p className="mt-4 text-gray-600 dark:text-gray-300">
                      <span className="text-primary-600 dark:text-primary-400 font-medium">Select documents</span> to ingest
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">PDF, TXT, Markdown, DOCX — multiple files supported</p>
                  </label>
                </div>

                {files.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{plural(files.length, 'file')} selected</p>
                    {files.map((f) => {
                      const { Icon, color } = getFileIcon(f.name);
                      return (
                        <div key={f.name} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
                          <Icon className={`w-5 h-5 shrink-0 ${color}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{f.name}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{(f.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                      );
                    })}

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
                <Card className="mt-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                  <p className="text-red-800 dark:text-red-300 text-sm">{(ingest.error as Error).message}</p>
                </Card>
              )}

              {/* Success result */}
              {result && (
                <Card className="mt-4 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">
                  <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">Ingestion Complete</h3>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-white/5 rounded-lg px-4 py-3 border border-emerald-100 dark:border-emerald-800">
                      <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{result.ingested}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{result.ingested === 1 ? 'document' : 'documents'} ingested</p>
                    </div>
                    <div className="bg-white dark:bg-white/5 rounded-lg px-4 py-3 border border-emerald-100 dark:border-emerald-800">
                      <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{result.chunks}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{result.chunks === 1 ? 'chunk' : 'chunks'} indexed — each chunk is a retrievable passage</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    {result.message && <p className="text-xs text-emerald-600 dark:text-emerald-400">{result.message}</p>}
                    <Link
                      to="/query"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 transition-colors ml-auto"
                    >
                      Query the knowledge base
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </Card>
              )}
            </div>

            {/* Right: Pipeline stages */}
            <div>
              <Card>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Pipeline Stages</h3>
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
        </>
      )}

      {source === 'servicenow' && (
        <ServiceNowTab onSyncSuccess={() => queryClient.invalidateQueries({ queryKey: ['health'] })} />
      )}
    </div>
  );
}
