import { useState, useRef, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { azureAiApi } from '../api/azure-ai';
import { useTrackedMutation } from '../hooks/useTrackedMutation';
import { Mic, Upload, Volume2 } from 'lucide-react';

type Tab = 'transcribe' | 'tts';

const TABS: { id: Tab; label: string }[] = [
  { id: 'transcribe', label: 'Speech to Text' },
  { id: 'tts', label: 'Text to Speech' },
];

const VOICES = [
  { value: 'en-US-JennyNeural', label: 'Jenny (en-US)' },
  { value: 'en-US-GuyNeural', label: 'Guy (en-US)' },
  { value: 'en-GB-SoniaNeural', label: 'Sonia (en-GB)' },
  { value: 'en-GB-RyanNeural', label: 'Ryan (en-GB)' },
  { value: 'es-ES-ElviraNeural', label: 'Elvira (es-ES)' },
  { value: 'fr-FR-DeniseNeural', label: 'Denise (fr-FR)' },
  { value: 'de-DE-KatjaNeural', label: 'Katja (de-DE)' },
  { value: 'zh-CN-XiaoxiaoNeural', label: 'Xiaoxiao (zh-CN)' },
  { value: 'ja-JP-NanamiNeural', label: 'Nanami (ja-JP)' },
];

export function SpeechServices() {
  const [tab, setTab] = useState<Tab>('transcribe');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [ttsText, setTtsText] = useState('');
  const [voice, setVoice] = useState('en-US-JennyNeural');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const transcribe = useTrackedMutation({ service: 'Speech:STT', operation: 'transcribe' }, { mutationFn: azureAiApi.transcribe });

  const tts = useTrackedMutation({ service: 'Speech:TTS', operation: 'synthesize' }, {
    mutationFn: ({ text, voice }: { text: string; voice: string }) => azureAiApi.textToSpeech(text, voice),
    onSuccess: (blob) => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    },
  });

  useEffect(() => {
    return () => { if (audioUrl) URL.revokeObjectURL(audioUrl); };
  }, [audioUrl]);

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setAudioFile(f); transcribe.reset(); }
  };

  const handleTranscribe = () => {
    if (audioFile) transcribe.mutate(audioFile);
  };

  const handleSynthesize = () => {
    if (ttsText.trim()) tts.mutate({ text: ttsText, voice });
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-teal-50">
          <Mic className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Speech Services</h1>
          <p className="text-gray-500 text-sm mt-0.5">Transcribe audio to text, or synthesize speech from text.</p>
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
                ? 'bg-white border border-gray-200 border-b-white text-teal-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Speech to Text */}
      {tab === 'transcribe' && (
        <>
          <Card className="mt-0 rounded-tl-none">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                id="audio-upload"
                className="hidden"
                accept="audio/*,.wav,.mp3,.ogg,.flac,.m4a"
                onChange={handleAudioChange}
              />
              <label htmlFor="audio-upload" className="cursor-pointer">
                <Upload className="w-10 h-10 text-gray-400 mx-auto" />
                <p className="mt-3 text-gray-600">
                  <span className="text-teal-600 font-medium">Click to upload</span> an audio file
                </p>
                <p className="text-sm text-gray-500 mt-1">WAV, MP3, OGG, FLAC, M4A up to 25MB</p>
              </label>
            </div>

            {audioFile && (
              <div className="mt-4 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mic className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">{audioFile.name}</p>
                    <p className="text-xs text-gray-500">{(audioFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <Button onClick={handleTranscribe} loading={transcribe.isPending}>
                  Transcribe
                </Button>
              </div>
            )}
          </Card>

          {transcribe.isError && (
            <Card className="mt-4 border-red-200 bg-red-50">
              <p className="text-red-800 text-sm">{(transcribe.error as Error).message}</p>
            </Card>
          )}

          {transcribe.data && (
            <Card className="mt-6">
              <h2 className="text-lg font-semibold mb-4">Transcript</h2>
              <p className="text-gray-800 leading-relaxed">{(transcribe.data as unknown as Record<string, unknown>).text as string ?? JSON.stringify(transcribe.data)}</p>

              <p className="text-xs text-gray-400 mt-4 border-t pt-3">
                Request: {(transcribe.data as unknown as Record<string, unknown>).request_id as string ?? '—'}
              </p>
            </Card>
          )}
        </>
      )}

      {/* Text to Speech */}
      {tab === 'tts' && (
        <>
          <Card className="mt-0 rounded-tl-none">
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Text to Speak</label>
                <textarea
                  rows={5}
                  className="block w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="Enter text to synthesize into speech…"
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                />
              </div>
              <div className="w-48 shrink-0">
                <label className="block text-sm font-medium text-gray-700 mb-2">Voice</label>
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-teal-500 focus:outline-none"
                >
                  {VOICES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button onClick={handleSynthesize} loading={tts.isPending} disabled={!ttsText.trim()}>
                <Volume2 className="w-4 h-4 mr-2" />
                Synthesize
              </Button>
            </div>
          </Card>

          {tts.isError && (
            <Card className="mt-4 border-red-200 bg-red-50">
              <p className="text-red-800 text-sm">{(tts.error as Error).message}</p>
            </Card>
          )}

          {audioUrl && (
            <Card className="mt-6">
              <h2 className="text-lg font-semibold mb-4">Synthesized Audio</h2>
              <audio ref={audioRef} controls className="w-full" src={audioUrl} />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
