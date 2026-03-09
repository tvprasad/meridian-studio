import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { azureAiApi } from '../api/azure-ai';
import { useTrackedMutation } from '../hooks/useTrackedMutation';
import { Eye, Upload, Image, FileText } from 'lucide-react';

type Tab = 'analyze' | 'ocr';

const TABS: { id: Tab; label: string }[] = [
  { id: 'analyze', label: 'Image Analysis' },
  { id: 'ocr', label: 'OCR / Read Text' },
];

export function VisionIntelligence() {
  const [tab, setTab] = useState<Tab>('analyze');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const analyze = useTrackedMutation({ service: 'Vision', operation: 'analyze' }, { mutationFn: azureAiApi.analyzeImage });
  const ocr = useTrackedMutation({ service: 'Vision', operation: 'ocr' }, { mutationFn: azureAiApi.ocr });

  const currentMutation = tab === 'analyze' ? analyze : ocr;

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
    analyze.reset();
    ocr.reset();
  };

  const handleRun = () => {
    if (!file) return;
    if (tab === 'analyze') analyze.mutate(file);
    else ocr.mutate(file);
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-50">
          <Eye className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Vision Intelligence</h1>
            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-violet-100 text-violet-600">AI Lab — Preview</span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">Analyze images for captions, tags, objects, and extract text via OCR.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mt-8 border-b border-gray-200">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors -mb-px ${
              tab === id
                ? 'bg-white border border-gray-200 border-b-white text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Card className="mt-0 rounded-tl-none">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            id="vision-upload"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          <label htmlFor="vision-upload" className="cursor-pointer">
            <Upload className="w-10 h-10 text-gray-400 mx-auto" />
            <p className="mt-3 text-gray-600">
              <span className="text-blue-600 font-medium">Click to upload</span> an image
            </p>
            <p className="text-sm text-gray-500 mt-1">PNG, JPG, WEBP up to 10MB</p>
          </label>
        </div>

        {file && (
          <div className="mt-4 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {file.type.startsWith('image/') ? (
                <Image className="w-6 h-6 text-gray-400" />
              ) : (
                <FileText className="w-6 h-6 text-gray-400" />
              )}
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <Button onClick={handleRun} loading={currentMutation.isPending}>
              {tab === 'analyze' ? 'Analyze' : 'Extract Text'}
            </Button>
          </div>
        )}

        {preview && (
          <div className="mt-4">
            <img src={preview} alt="Preview" className="max-h-64 rounded-lg mx-auto object-contain" />
          </div>
        )}
      </Card>

      {currentMutation.isError && (
        <Card className="mt-4 border-red-200 bg-red-50">
          <p className="text-red-800 text-sm">{(currentMutation.error as Error).message}</p>
        </Card>
      )}

      {/* Image Analysis Results */}
      {tab === 'analyze' && analyze.data && (
        <Card className="mt-6">
          <h2 className="text-lg font-semibold mb-4">Analysis Result</h2>

          {analyze.data.data.captionResult && (
            <div className="mb-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Caption</p>
              <p className="text-gray-900 font-medium">{analyze.data.data.captionResult.text}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Confidence: {(analyze.data.data.captionResult.confidence * 100).toFixed(1)}%
              </p>
            </div>
          )}

          {analyze.data.data.tagsResult?.values && analyze.data.data.tagsResult.values.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {analyze.data.data.tagsResult.values.map((tag) => (
                  <span
                    key={tag.name}
                    className="px-2.5 py-1 bg-blue-50 text-blue-800 rounded-full text-sm border border-blue-100"
                  >
                    {tag.name}
                    <span className="ml-1 text-blue-400 text-xs">{(tag.confidence * 100).toFixed(0)}%</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {analyze.data.data.objectsResult?.values && analyze.data.data.objectsResult.values.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Objects</p>
              <div className="flex flex-wrap gap-2">
                {analyze.data.data.objectsResult.values.flatMap((obj) =>
                  obj.tags.map((t, i) => (
                    <span key={i} className="px-2.5 py-1 bg-indigo-50 text-indigo-800 rounded-full text-sm border border-indigo-100">
                      {t.name} <span className="text-indigo-400 text-xs">{(t.confidence * 100).toFixed(0)}%</span>
                    </span>
                  ))
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-6 border-t pt-3">
            Elapsed: {analyze.data.elapsed_ms}ms · Request: {analyze.data.request_id}
          </p>
        </Card>
      )}

      {/* OCR Results */}
      {tab === 'ocr' && ocr.data && (() => {
        const blocks = ocr.data.data.readResult?.blocks;
        const content = ocr.data.data.content;
        const lines = blocks?.flatMap((b) => b.lines) ?? [];
        return (
          <Card className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Extracted Text</h2>
            {content ? (
              <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-gray-50 rounded-lg p-4 font-mono leading-relaxed">
                {content}
              </pre>
            ) : lines.length > 0 ? (
              <div className="space-y-1">
                {lines.map((line, i) => (
                  <p key={i} className="text-sm text-gray-800">{line.text}</p>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No text detected in this image.</p>
            )}
            <p className="text-xs text-gray-400 mt-4 border-t pt-3">
              Elapsed: {ocr.data.elapsed_ms}ms · Request: {ocr.data.request_id}
            </p>
          </Card>
        );
      })()}
    </div>
  );
}
