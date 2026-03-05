import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { azureAiApi } from '../api/azure-ai';
import { ScanSearch, Upload, FileText } from 'lucide-react';
import type { DocumentAnalysisResult } from '../api/types';

const MODELS = [
  { value: 'prebuilt-read', label: 'Read — General text extraction' },
  { value: 'prebuilt-layout', label: 'Layout — Tables & structure' },
  { value: 'prebuilt-invoice', label: 'Invoice — Invoice fields' },
  { value: 'prebuilt-receipt', label: 'Receipt — Receipt fields' },
  { value: 'prebuilt-idDocument', label: 'ID Document — Identity cards' },
  { value: 'prebuilt-businessCard', label: 'Business Card' },
];

type ResultTab = 'content' | 'fields' | 'tables' | 'kvpairs';

function ResultPanel({ data }: { data: DocumentAnalysisResult }) {
  const [rTab, setRTab] = useState<ResultTab>('content');

  const hasFields = data.fields && Object.keys(data.fields).length > 0;
  const hasTables = data.tables && data.tables.length > 0;
  const hasKv = data.key_value_pairs && data.key_value_pairs.length > 0;
  const hasContent = !!data.content || (data.paragraphs && data.paragraphs.length > 0);

  const resultTabs: { id: ResultTab; label: string; show: boolean }[] = [
    { id: 'content', label: 'Content', show: !!hasContent },
    { id: 'fields', label: 'Fields', show: !!hasFields },
    { id: 'tables', label: 'Tables', show: !!hasTables },
    { id: 'kvpairs', label: 'Key-Value Pairs', show: !!hasKv },
  ];

  const visibleTabs = resultTabs.filter((t) => t.show);

  return (
    <div>
      {visibleTabs.length > 1 && (
        <div className="flex gap-1 mb-4 border-b border-gray-100">
          {visibleTabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setRTab(id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-t transition-colors -mb-px ${
                rTab === id
                  ? 'bg-white border border-gray-200 border-b-white text-orange-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Content / Paragraphs */}
      {rTab === 'content' && (
        <div>
          {data.content ? (
            <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-gray-50 rounded-lg p-4 font-mono leading-relaxed max-h-96 overflow-y-auto">
              {data.content}
            </pre>
          ) : data.paragraphs && data.paragraphs.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {data.paragraphs.map((p, i) => (
                <div key={i} className={`text-sm p-2 rounded ${p.role ? 'bg-amber-50 border border-amber-100' : 'text-gray-800'}`}>
                  {p.role && <span className="text-xs font-medium text-amber-700 uppercase mr-2">{p.role}</span>}
                  {p.content}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No text content extracted.</p>
          )}
        </div>
      )}

      {/* Fields */}
      {rTab === 'fields' && hasFields && (
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(data.fields!).map(([key, field]) => (
            <div key={key} className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 mb-0.5">{key}</p>
              <p className="text-sm font-medium text-gray-900">{field.value ?? '—'}</p>
              {field.confidence != null && (
                <p className="text-xs text-gray-400 mt-0.5">{(field.confidence * 100).toFixed(0)}% confidence</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tables */}
      {rTab === 'tables' && hasTables && (
        <div className="space-y-6 max-h-96 overflow-y-auto">
          {data.tables!.map((table, ti) => {
            const grid: string[][] = Array.from({ length: table.row_count }, () =>
              Array(table.column_count).fill('')
            );
            table.cells.forEach((c) => { grid[c.row_index][c.column_index] = c.content; });
            return (
              <div key={ti}>
                <p className="text-xs text-gray-500 mb-2">Table {ti + 1} · {table.row_count} rows × {table.column_count} cols</p>
                <div className="overflow-x-auto">
                  <table className="text-sm border-collapse w-full">
                    <tbody>
                      {grid.map((row, ri) => (
                        <tr key={ri}>
                          {row.map((cell, ci) => (
                            <td key={ci} className={`border border-gray-200 px-3 py-1.5 ${ri === 0 ? 'bg-gray-50 font-medium' : ''}`}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Key-Value Pairs */}
      {rTab === 'kvpairs' && hasKv && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {data.key_value_pairs!.map((kv, i) => (
            <div key={i} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg text-sm">
              <span className="font-medium text-gray-700 w-40 shrink-0">{kv.key}</span>
              <span className="text-gray-900 flex-1">{kv.value}</span>
              <span className="text-xs text-gray-400 shrink-0">{(kv.confidence * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DocumentIntelligence() {
  const [file, setFile] = useState<File | null>(null);
  const [modelId, setModelId] = useState('prebuilt-read');
  const [preview, setPreview] = useState<string | null>(null);

  const analyze = useMutation({
    mutationFn: ({ file, modelId }: { file: File; modelId: string }) =>
      azureAiApi.analyzeDocument(file, modelId),
  });

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    analyze.reset();
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

  const handleAnalyze = () => {
    if (file) analyze.mutate({ file, modelId });
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-orange-50">
          <ScanSearch className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Intelligence</h1>
          <p className="text-gray-500 text-sm mt-0.5">Extract structured data from documents — invoices, receipts, IDs, and more.</p>
        </div>
      </div>

      <Card className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                id="doc-upload"
                className="hidden"
                accept="image/*,.pdf"
                onChange={handleFileChange}
              />
              <label htmlFor="doc-upload" className="cursor-pointer">
                <Upload className="w-10 h-10 text-gray-400 mx-auto" />
                <p className="mt-3 text-gray-600">
                  <span className="text-orange-600 font-medium">Click to upload</span> a document
                </p>
                <p className="text-sm text-gray-500 mt-1">PDF, PNG, JPG, TIFF up to 50MB</p>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-orange-500 focus:outline-none"
            >
              {MODELS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-2">Choose the model that matches your document type for best results.</p>
          </div>
        </div>

        {file && (
          <div className="mt-4 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB · {MODELS.find((m) => m.value === modelId)?.label}</p>
              </div>
            </div>
            <Button onClick={handleAnalyze} loading={analyze.isPending}>
              Analyze Document
            </Button>
          </div>
        )}

        {preview && (
          <div className="mt-4">
            <img src={preview} alt="Document preview" className="max-h-48 rounded-lg mx-auto object-contain" />
          </div>
        )}
      </Card>

      {analyze.isError && (
        <Card className="mt-4 border-red-200 bg-red-50">
          <p className="text-red-800 text-sm">{(analyze.error as Error).message}</p>
        </Card>
      )}

      {analyze.data && (
        <Card className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Extraction Result</h2>
            {analyze.data.model_id && (
              <span className="text-xs text-gray-400 font-mono">{analyze.data.model_id}</span>
            )}
          </div>

          <ResultPanel data={analyze.data} />

          <p className="text-xs text-gray-400 mt-4 border-t pt-3">
            Elapsed: {analyze.data.elapsed_ms}ms · Request: {analyze.data.request_id}
          </p>
        </Card>
      )}
    </div>
  );
}
