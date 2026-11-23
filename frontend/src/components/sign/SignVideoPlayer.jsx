import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, FastForward, CheckCircle2, ShieldCheck, Volume2 } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export default function SignVideoPlayer({
  sign,
  autoPlay = false,
  showNotes = true,
  className = ''
}) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { signPlaybackSpeed, setSignPlaybackSpeed } = useSettings();
  const [currentSpeed, setCurrentSpeed] = useState(signPlaybackSpeed);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = currentSpeed;
    }
  }, [currentSpeed]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const restartVideo = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlaying(true);
  };

  const handleSpeedChange = (speed) => {
    setCurrentSpeed(speed);
    setSignPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  if (!sign) {
    return (
      <div className="bg-slate-100 rounded-2xl border border-slate-200 aspect-16/9 flex items-center justify-center p-6 text-slate-400 text-sm">
        Select an EthSL sign to inspect demonstration video
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs ${className}`}>
      {/* Video Container */}
      <div className="relative aspect-16/10 bg-slate-950 flex items-center justify-center overflow-hidden group">
        <video
          ref={videoRef}
          src={sign.videoUrl}
          playsInline
          loop
          autoPlay={autoPlay}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="w-full h-full object-cover"
        />

        {/* Watermark / Badge Overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/85 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Validated EthSL</span>
        </div>

        {/* Speed indicator pill */}
        {currentSpeed !== 1 && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-600/90 text-white backdrop-blur-sm">
            {currentSpeed}x Slow-mo
          </div>
        )}

        {/* Play/Pause Overlay Button on Hover or Paused */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg hover:scale-110 hover:bg-blue-600 transition-all focus:outline-hidden"
            aria-label="Play EthSL Video"
          >
            <Play className="w-6 h-6 ml-0.5" />
          </button>
        )}
      </div>

      {/* Video Controls Bar */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-blue-500"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            onClick={restartVideo}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-blue-500"
            title="Replay from start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Speed Controls (Essential for Sign Language Learners) */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs font-medium text-slate-600">
            {[0.5, 0.75, 1.0].map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`px-2 py-1 rounded-md transition-colors ${
                  currentSpeed === speed
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'hover:text-slate-900'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Gloss Title Label */}
        <div className="text-right">
          <div className="text-lg font-bold text-slate-900 font-ethiopic leading-tight">
            {sign.gloss}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {sign.english}
          </div>
        </div>
      </div>

      {/* Detailed Sign Information & Linguistic Notes */}
      {showNotes && (
        <div className="p-4 border-t border-slate-100 space-y-3 bg-white">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Gesture & Keypoints Description
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              {sign.signKeypointsDescription || sign.usageNotes}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Source: <strong>{sign.source}</strong>
            </span>
            <span>Variant: <strong>{sign.regionalVariant || 'National'}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
