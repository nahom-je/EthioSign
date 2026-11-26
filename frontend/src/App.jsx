import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { SettingsProvider } from './context/SettingsContext';

const LandingPage      = lazy(() => import('./pages/LandingPage'));
const DashboardPage    = lazy(() => import('./pages/DashboardPage'));
const SignToTextPage   = lazy(() => import('./pages/SignToTextPage'));
const SpeechToSignPage = lazy(() => import('./pages/SpeechToSignPage'));
const DictionaryPage   = lazy(() => import('./pages/DictionaryPage'));
const AboutPage        = lazy(() => import('./pages/AboutPage'));
const SettingsPage     = lazy(() => import('./pages/SettingsPage'));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Loading page...</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <Layout>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/sign-to-text" element={<SignToTextPage />} />
                <Route path="/speech-to-sign" element={<SpeechToSignPage />} />
                <Route path="/dictionary" element={<DictionaryPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </Layout>
      </BrowserRouter>
    </SettingsProvider>
  );
}
