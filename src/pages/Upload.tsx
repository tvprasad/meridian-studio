import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { azureAiApi } from '../api/azure-ai';
import { meridianApi } from '../api/meridian';
import { Upload as UploadIcon, FileText, Image, Settings } from 'lucide-react';

const RETRIEVAL_LABELS: Record<string, string> = {
  chroma: 'Local (Chroma)',
  azure: 'Azure AI Search',
};

export function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const { data: health } = useQuery({ queryKey: ['health'], queryFn: meridianApi.health });

  const analyzeImage = useMutation({
    mutationFn: azureAiApi.analyzeImage,
  });

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        setPreview(URL.createObjectURL(selectedFile));
      } else {
        setPreview(null);
      }
    }
  };

  const handleAnalyze = () => {
    if (file) {
      analyzeImage.mutate(file);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Document Upload</h1>
      <p className="text-gray-500 mt-1">Add files to the knowledge base. Once uploaded, Meridian can reference them when answering questions.</p>
      {health && (
        <p className="mt-2 text-xs text-gray-400 flex items-center gap-1.5">
          Documents will be indexed into
          <span className="font-medium text-gray-600">{RETRIEVAL_LABELS[health.retrieval_provider] ?? health.retrieval_provider}</span>
          —
          <Link to="/settings" className="inline-flex items-center gap-0.5 text-primary-600 hover:text-primary-700 transition-colors">
            <Settings className="w-3 h-3" />
            change in Settings
          </Link>
        </p>
      )}

      <Card className="mt-8">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept="image/*,.pdf,.docx"
            onChange={handleFileChange}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <UploadIcon className="w-12 h-12 text-gray-400 mx-auto" />
            <p className="mt-4 text-gray-600">
              <span className="text-primary-600 font-medium">Click to upload</span> or drag and drop
            </p>
            <p className="text-sm text-gray-500 mt-1">PNG, JPG, PDF up to 10MB</p>
          </label>
        </div>

        {file && (
          <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              {file.type.startsWith('image/') ? (
                <Image className="w-8 h-8 text-gray-400" />
              ) : (
                <FileText className="w-8 h-8 text-gray-400" />
              )}
              <div className="ml-4">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <Button onClick={handleAnalyze} loading={analyzeImage.isPending}>
              Analyze
            </Button>
          </div>
        )}

        {preview && (
          <div className="mt-6">
            <img src={preview} alt="Preview" className="max-h-64 rounded-lg mx-auto" />
          </div>
        )}
      </Card>

      {analyzeImage.data && (
        <Card className="mt-6">
          <h2 className="text-lg font-semibold mb-4">Analysis Result</h2>
          
          {analyzeImage.data.data.captionResult && (
            <div className="mb-4">
              <p className="text-sm text-gray-500">Caption</p>
              <p className="font-medium">{analyzeImage.data.data.captionResult.text}</p>
              <p className="text-sm text-gray-500">
                Confidence: {(analyzeImage.data.data.captionResult.confidence * 100).toFixed(1)}%
              </p>
            </div>
          )}

          {analyzeImage.data.data.tagsResult?.values && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {analyzeImage.data.data.tagsResult.values.slice(0, 10).map((tag) => (
                  <span
                    key={tag.name}
                    className="px-2 py-1 bg-gray-100 rounded text-sm"
                  >
                    {tag.name} ({(tag.confidence * 100).toFixed(0)}%)
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t text-sm text-gray-500">
            <p>Request ID: {analyzeImage.data.request_id}</p>
            <p>Elapsed: {analyzeImage.data.elapsed_ms}ms</p>
          </div>
        </Card>
      )}
    </div>
  );
}