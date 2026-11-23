import { useState, useRef, useCallback, useEffect } from 'react';

export function useWebcam(selectedDeviceId = '') {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableDevices, setAvailableDevices] = useState([]);

  // Fetch available camera devices
  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setAvailableDevices(videoInputs);
    } catch (err) {
      console.warn('Could not list media devices:', err);
    }
  }, []);

  // Start webcam
  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Your browser does not support webcam access. Please use modern Chrome, Edge, or Firefox.');
      }

      // Constraints
      const constraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } }
          : { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
      await refreshDevices();
    } catch (err) {
      console.error('Camera startup error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission was denied. Please grant camera permission in your browser address bar.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera device was detected on your system. Please connect a webcam.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('The camera is already being used by another application or tab.');
      } else {
        setError(err.message || 'Unable to access camera.');
      }
      setIsActive(false);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDeviceId, refreshDevices]);

  // Stop webcam and release hardware cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setIsLoading(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Capture current frame as data URL or canvas imageData
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !isActive) return null;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Draw cropped center square
    const minDim = Math.min(video.videoWidth, video.videoHeight);
    const startX = (video.videoWidth - minDim) / 2;
    const startY = (video.videoHeight - minDim) / 2;
    ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, 256, 256);

    return canvas.toDataURL('image/jpeg', 0.85);
  }, [isActive]);

  return {
    videoRef,
    isActive,
    isLoading,
    error,
    startCamera,
    stopCamera,
    captureFrame,
    availableDevices,
    refreshDevices
  };
}
