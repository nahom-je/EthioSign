import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import SignToTextPage from './pages/SignToTextPage';
import SpeechToSignPage from './pages/SpeechToSignPage';
import DictionaryPage from './pages/DictionaryPage';
import AboutPage from './pages/AboutPage';
import SettingsPage from './pages/SettingsPage';
import { SettingsProvider } from './context/SettingsContext';

export default function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <Layout>
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
        </Layout>
      </BrowserRouter>
    </SettingsProvider>
  );
}
