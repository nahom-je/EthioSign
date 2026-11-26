import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const SESSION_ID_KEY = 'ethiosign_session_id';

function getOrCreateSessionId() {
  let id = localStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

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

  const sessionReadyRef = useRef(false);

  useEffect(() => {
    localStorage.setItem('ethiosign_store_history', storeHistory);
    if (!storeHistory) {
      localStorage.removeItem('ethiosign_history');
      sessionReadyRef.current = false;
      return;
    }

    const sessionId = getOrCreateSessionId();
    (async () => {
      try {
        await fetch(`${BACKEND_URL}/api/conversations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, isStorageConsented: true })
        });
        sessionReadyRef.current = true;

        const res = await fetch(`${BACKEND_URL}/api/conversations/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data?.messages) && data.data.messages.length > 0) {
            const remote = [...data.data.messages].reverse().slice(0, 50);
            setHistory(remote);
            localStorage.setItem('ethiosign_history', JSON.stringify(remote));
          }
        }
      } catch {
        // Offline / backend unavailable — localStorage still works
      }
    })();
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

    if (storeHistory) {
      const sessionId = getOrCreateSessionId();
      fetch(`${BACKEND_URL}/api/conversations/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: item.sender || 'deaf',
          type: item.type || 'sign',
          amharic: item.amharic ?? null,
          english: item.english ?? null,
          confidence: typeof item.confidence === 'number' ? item.confidence : null,
          isMock: Boolean(item.isMock),
          glossIndex: item.glossIndex ?? null,
          matchedSignCount: item.matchedSignCount ?? null
        })
      }).catch(() => {});
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('ethiosign_history');
    const sessionId = localStorage.getItem(SESSION_ID_KEY);
    if (sessionId) {
      fetch(`${BACKEND_URL}/api/conversations/${sessionId}`, { method: 'DELETE' }).catch(() => {});
      localStorage.removeItem(SESSION_ID_KEY);
    }
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
