import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  // Load preferences from localStorage safely
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('ethiosign_high_contrast') === 'true';
  });

  const [largeText, setLargeText] = useState(() => {
    return localStorage.getItem('ethiosign_large_text') === 'true';
  });

  const [autoSpeak, setAutoSpeak] = useState(() => {
    return localStorage.getItem('ethiosign_auto_speak') === 'true';
  });

  const [speechRate, setSpeechRate] = useState(() => {
    return parseFloat(localStorage.getItem('ethiosign_speech_rate')) || 1.0;
  });

  const [signPlaybackSpeed, setSignPlaybackSpeed] = useState(() => {
    return parseFloat(localStorage.getItem('ethiosign_video_speed')) || 1.0;
  });

  const [storeHistory, setStoreHistory] = useState(() => {
    return localStorage.getItem('ethiosign_store_history') === 'true';
  });

  const [selectedCamera, setSelectedCamera] = useState(() => {
    return localStorage.getItem('ethiosign_selected_camera') || '';
  });

  const [selectedMic, setSelectedMic] = useState(() => {
    return localStorage.getItem('ethiosign_selected_mic') || '';
  });

  // Local conversation history (strictly in-browser memory or opt-in localStorage)
  const [history, setHistory] = useState(() => {
    if (storeHistory) {
      try {
        return JSON.parse(localStorage.getItem('ethiosign_history') || '[]');
      } catch {
        return [];
      }
    }
    return [];
  });

  // Persist settings
  useEffect(() => {
    localStorage.setItem('ethiosign_high_contrast', highContrast);
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem('ethiosign_large_text', largeText);
    if (largeText) {
      document.documentElement.classList.add('large-text');
    } else {
      document.documentElement.classList.remove('large-text');
    }
  }, [largeText]);

  useEffect(() => {
    localStorage.setItem('ethiosign_selected_camera', selectedCamera);
  }, [selectedCamera]);

  useEffect(() => {
    localStorage.setItem('ethiosign_selected_mic', selectedMic);
  }, [selectedMic]);

  useEffect(() => {
    localStorage.setItem('ethiosign_auto_speak', autoSpeak);
  }, [autoSpeak]);

  useEffect(() => {
    localStorage.setItem('ethiosign_speech_rate', speechRate.toString());
  }, [speechRate]);

  useEffect(() => {
    localStorage.setItem('ethiosign_video_speed', signPlaybackSpeed.toString());
  }, [signPlaybackSpeed]);

  useEffect(() => {
    localStorage.setItem('ethiosign_store_history', storeHistory);
    if (!storeHistory) {
      localStorage.removeItem('ethiosign_history');
    }
  }, [storeHistory]);

  const addHistoryItem = (item) => {
    const newItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...item
    };
    setHistory((prev) => {
      const updated = [newItem, ...prev.slice(0, 49)];
      if (storeHistory) {
        localStorage.setItem('ethiosign_history', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('ethiosign_history');
  };

  return (
    <SettingsContext.Provider
      value={{
        highContrast,
        setHighContrast,
        largeText,
        setLargeText,
        autoSpeak,
        setAutoSpeak,
        speechRate,
        setSpeechRate,
        signPlaybackSpeed,
        setSignPlaybackSpeed,
        storeHistory,
        setStoreHistory,
        selectedCamera,
        setSelectedCamera,
        selectedMic,
        setSelectedMic,
        history,
        addHistoryItem,
        clearHistory
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
