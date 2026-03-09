import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/ui/Layout';
import { Dashboard } from './pages/Dashboard';
import { Query } from './pages/Query';
import { Ingest } from './pages/Ingest';
import { Settings } from './pages/Settings';
import { LanguageIntelligence } from './pages/LanguageIntelligence';
import { VisionIntelligence } from './pages/VisionIntelligence';
import { SpeechServices } from './pages/SpeechServices';
import { DocumentIntelligence } from './pages/DocumentIntelligence';
import { DiagnosticsProvider } from './hooks/useDiagnostics';
import { Landing } from './pages/Landing';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DiagnosticsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/welcome" element={<Landing />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="query" element={<Query />} />
            <Route path="ingest" element={<Ingest />} />
            <Route path="settings" element={<Settings />} />
            <Route path="language" element={<LanguageIntelligence />} />
            <Route path="vision" element={<VisionIntelligence />} />
            <Route path="speech" element={<SpeechServices />} />
            <Route path="document" element={<DocumentIntelligence />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </DiagnosticsProvider>
    </QueryClientProvider>
  );
}

export default App;
