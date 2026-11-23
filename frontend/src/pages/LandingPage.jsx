import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Video, 
  Mic, 
  BookOpen, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  Users, 
  Layers, 
  HeartHandshake,
  ArrowRightLeft
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="space-y-20 pb-20">
      
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/80 via-white to-slate-50 pt-16 pb-20 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 shadow-xs">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>AI-Powered Ethiopian Sign Language Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Breaking Communication <span className="text-blue-600">Barriers</span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Connecting Deaf and hearing communities through <strong>Ethiopian Sign Language (EthSL)</strong> and AI-powered two-way communication.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-base text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/25 transition-all transform hover:-translate-y-0.5"
                >
                  <ArrowRightLeft className="w-5 h-5" />
                  <span>Start Communicating</span>
                </Link>

                <Link
                  to="/dictionary"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-base text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 shadow-xs transition-all"
                >
                  <BookOpen className="w-5 h-5 text-slate-500" />
                  <span>Explore Sign Dictionary</span>
                </Link>
              </div>

              {/* Guarantees */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-6 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Authentic EthSL (Not ASL)
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Zero Raw Video Storage
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Free & Open Source
                </span>
              </div>

            </div>

            {/* Interactive Preview Card Illustration */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-6 relative">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Two-Way Conversation Live</span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    EthSL ⇄ Audio/Text
                  </span>
                </div>

                <div className="space-y-4 py-6">
                  {/* Deaf person message */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      EthSL
                    </div>
                    <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-2xl rounded-tl-none max-w-xs">
                      <p className="text-xs text-blue-600 font-semibold uppercase">Deaf Signer (Webcam)</p>
                      <p className="text-lg font-bold text-slate-900 font-ethiopic">ደህና ነኝ አመሰግናለሁ</p>
                      <p className="text-xs text-slate-600">"I am fine, thank you"</p>
                    </div>
                  </div>

                  {/* Hearing person response */}
                  <div className="flex items-start gap-3 justify-end">
                    <div className="bg-slate-100 border border-slate-200 p-3.5 rounded-2xl rounded-tr-none max-w-xs text-right">
                      <p className="text-xs text-slate-500 font-semibold uppercase">Hearing Person (Voice)</p>
                      <p className="text-base font-semibold text-slate-900">"Nice to meet you! How is your family?"</p>
                      <div className="mt-2 flex items-center justify-end gap-1 text-[11px] font-medium text-emerald-700">
                        <span>Matched 4 EthSL signs</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      Mic
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Signer: <strong>Addis Ababa Native</strong></span>
                  <span className="text-emerald-600 font-semibold">92% AI Confidence</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. How Two-Way Communication Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Bidirectional Workflow
          </h2>
          <h3 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
            How EthioSign Bridges the Gap
          </h3>
          <p className="text-base text-slate-600">
            True communication requires both participants to be understood. EthioSign provides seamless two-way translation in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Direction A Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Direction A</span>
              <h4 className="text-xl font-bold text-slate-900 mt-1">Ethiopian Sign Language → Text & Speech</h4>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              A Deaf person performs gestures in front of the camera. The vision pipeline isolates hand and body landmarks, 
              evaluates them through the EthSL recognition provider, displays the recognized Amharic gloss, and optionally speaks it aloud for the hearing person.
            </p>
            <Link
              to="/sign-to-text"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              <span>Try Sign-to-Text</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Direction B Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Direction B</span>
              <h4 className="text-xl font-bold text-slate-900 mt-1">Speech & Text → Ethiopian Sign Language</h4>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              A hearing person speaks naturally into their microphone or types a sentence. The application transcribes the speech, 
              matches words against the validated 62-gloss EthSL corpus, and renders clear, verified video demonstrations for the Deaf participant.
            </p>
            <Link
              to="/speech-to-sign"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              <span>Try Speech-to-Sign</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* 3. Core Pillars / Feature Highlights */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h3 className="text-2xl font-bold tracking-tight">Built on Integrity and Accessibility</h3>
            <p className="text-sm text-slate-400">
              EthioSign avoids fake AI promises and adheres to rigorous linguistic, privacy, and architectural standards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold">EthSL Native</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Respects Ethiopian Sign Language as an independent language with unique grammar, not a derivative of ASL.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold">Privacy First</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Zero permanent video recording. Frames are parsed transiently in volatile RAM for feature extraction only.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold">Modular AI</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pluggable recognition adapter supporting client-side MediaPipe, FastAPI PyTorch inference, or dev mock providers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold">Accessible UX</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dual audio/visual feedback, high-contrast settings, Ethiopic typography, and WCAG 2.2 AA compliant focus indicators.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Call-to-Action Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <h3 className="text-3xl font-extrabold text-slate-900">
          Ready to experience accessible Ethiopian communication?
        </h3>
        <p className="text-base text-slate-600 max-w-xl mx-auto">
          Open the communication dashboard now with no account registration required.
        </p>
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/30 transition-all transform hover:-translate-y-0.5"
          >
            <Sparkles className="w-5 h-5" />
            <span>Open Communication Dashboard</span>
          </Link>
        </div>
      </section>

    </div>
  );
}
