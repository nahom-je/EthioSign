import { useState, useEffect, useCallback, useRef } from 'react';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isSupported, setIsSupported] = useState(true);

  const synthRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsSupported(false);
      return;
    }

    synthRef.current = window.speechSynthesis;

    const updateVoices = () => {
      const available = synthRef.current.getVoices();
      setVoices(available);
      // Prefer an Amharic or East African voice if present, else fallback
      const amVoice = available.find((v) => v.lang.startsWith('am') || v.name.toLowerCase().includes('amharic'));
      const defaultVoice = amVoice || available.find((v) => v.lang.startsWith('en')) || available[0];
      setSelectedVoice(defaultVoice || null);
    };

    updateVoices();
    if (synthRef.current.onvoiceschanged !== undefined) {
      synthRef.current.onvoiceschanged = updateVoices;
    }
  }, []);

  const speak = useCallback((text, { rate = 1.0, pitch = 1.0, volume = 1.0 } = {}) => {
    if (!synthRef.current || !text) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setIsSpeaking(false);
    };

    synthRef.current.speak(utterance);
  }, [selectedVoice]);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isSpeaking,
    isSupported,
    voices,
    selectedVoice,
    setSelectedVoice,
    speak,
    stop
  };
}
