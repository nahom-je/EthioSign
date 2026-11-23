import React from 'react';
import { 
  ShieldCheck, 
  BookOpen, 
  Heart, 
  ExternalLink, 
  AlertTriangle, 
  Cpu, 
  Users, 
  CheckCircle2,
  Lock
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
          Project Mission & Standards
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          About EthioSign
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          An accessible, AI-powered platform designed to reduce communication barriers between Deaf people who communicate using 
          <strong> Ethiopian Sign Language (EthSL)</strong> and hearing people who do not understand sign language.
        </p>
      </div>

      {/* 1. Core Linguistic Imperative */}
      <div className="bg-gradient-to-tr from-blue-900 to-indigo-950 rounded-3xl p-8 sm:p-10 text-white shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Core Linguistic Requirement</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold">
          Ethiopian Sign Language (EthSL) ≠ ASL
        </h2>
        <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed">
          Ethiopian Sign Language is an independent language with its own unique phonology, morphology, syntax, and cultural idioms. 
          It is <strong>not</strong> American Sign Language (ASL) or British Sign Language (BSL).
        </p>
        <p className="text-xs sm:text-sm text-blue-200/80 leading-relaxed">
          While ASL datasets are frequently used in general computer vision research, EthioSign strictly refuses to present ASL models as Ethiopian Sign Language. 
          All vocabulary, video demonstrations, and recognition benchmarks within this platform are derived from verified EthSL sources, including the CESLR benchmark corpus and Ethiopian Deaf community documentation.
        </p>
      </div>

      {/* 2. Target Users & Social Impact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
            1
          </div>
          <h3 className="text-base font-bold text-slate-900">Deaf Individuals</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Communicate effortlessly in hospitals, government offices, stores, and transport hubs without requiring a third-party human interpreter for basic exchanges.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
            2
          </div>
          <h3 className="text-base font-bold text-slate-900">Hearing Families & Friends</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Converse naturally through voice or text and learn authentic Ethiopian Sign Language signs at your own pace with slow-motion video breakdowns.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            3
          </div>
          <h3 className="text-base font-bold text-slate-900">Service Providers & Schools</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Provide accessible frontline points of contact in public healthcare, educational institutions, and civic venues across Ethiopia.
          </p>
        </div>
      </div>

      {/* 3. Research Foundation & Technical Architecture */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Cpu className="w-4 h-4 text-blue-600" />
          <span>Scientific & Technological Foundation</span>
        </div>
        <h3 className="text-2xl font-bold text-slate-900">
          Research Leads & System Architecture
        </h3>

        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            EthioSign's AI architecture builds upon peer-reviewed computer vision and continuous sign language recognition research:
          </p>
          <ul className="space-y-3 pl-4 border-l-2 border-blue-200">
            <li>
              <strong className="text-slate-900">CESLR (Continuous Ethiopian Sign Language Recognition):</strong><br />
              Utilizes a ResNet-18 2D spatio-temporal visual encoder coupled with 1D temporal convolutions and Bidirectional LSTM (BiLSTM) with CTC loss, trained on 1,320 clips across 22 signers covering 62 core vocabulary glosses.
            </li>
            <li>
              <strong className="text-slate-900">Skeleton-Based Representation (PMC12533181 - Scientific Reports 2024):</strong><br />
              Validates that skeletal key-points extracted via MediaPipe Holistic (tracking hand joints, body posture, and facial landmarks) achieve up to 94% signer-dependent and 73% signer-independent accuracy, drastically reducing compute overhead.
            </li>
          </ul>
        </div>
      </div>

      {/* 4. Responsible AI & Explicit Limitations */}
      <div className="bg-amber-50 rounded-3xl border border-amber-200 p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Responsible AI & Realistic Limitations</span>
        </div>
        <h3 className="text-xl font-bold text-amber-950">
          What EthioSign Can and Cannot Do (MVP Scope)
        </h3>
        <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
          In full accordance with honest software engineering principles:
        </p>
        <ul className="space-y-2 text-xs text-amber-800 list-disc pl-5 leading-relaxed">
          <li>
            <strong>Vocabulary Boundary:</strong> The prototype recognizer operates on the validated 62-gloss EthSL vocabulary. It does <em>not</em> translate unrestricted open-ended conversational speech until continuous sign recognition models are trained on larger national datasets.
          </li>
          <li>
            <strong>Signer Variability:</strong> Sign languages involve rich non-manual markers (facial expressions, mouthings, head tilts). Lighting and background conditions may affect confidence. Low-confidence predictions are clearly displayed as uncertain.
          </li>
          <li>
            <strong>No Fake AI:</strong> The frontend does not fabricate translations or simulate pretend recognition. When a mock provider is active for UI development, it is explicitly labeled as a demonstration.
          </li>
        </ul>
      </div>

      {/* 5. Privacy Policy & Biometric Data Safeguards */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
          <Lock className="w-4 h-4 text-emerald-600" />
          <span>Biometric & Stream Privacy Guarantees</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900">
          Zero Permanent Video Retention
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <h4 className="font-bold text-slate-800 mb-1">Volatile Client Memory</h4>
            <p>Webcam frames are analyzed in temporary memory to detect landmarks. Video feeds are never saved to disk or transmitted to advertising third parties.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <h4 className="font-bold text-slate-800 mb-1">User Permission Control</h4>
            <p>Camera and microphone streams are exclusively activated when explicitly initiated by the user and terminate completely when stopped.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
