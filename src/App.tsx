import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/ui/Layout';
import { Dashboard } from './pages/Dashboard';
import { Query } from './pages/Query';
import { Upload } from './pages/Upload';
import { Settings } from './pages/Settings';
import { LanguageIntelligence } from './pages/LanguageIntelligence';
import { VisionIntelligence } from './pages/VisionIntelligence';
import { SpeechServices } from './pages/SpeechServices';
import { DocumentIntelligence } from './pages/DocumentIntelligence';

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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="query" element={<Query />} />
            <Route path="upload" element={<Upload />} />
            <Route path="settings" element={<Settings />} />
            <Route path="language" element={<LanguageIntelligence />} />
            <Route path="vision" element={<VisionIntelligence />} />
            <Route path="speech" element={<SpeechServices />} />
            <Route path="document" element={<DocumentIntelligence />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
