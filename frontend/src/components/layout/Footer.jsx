import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, ExternalLink, HelpCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: About & Mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                ES
              </div>
              <span className="text-xl font-bold text-white tracking-tight">EthioSign</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              EthioSign bridges the communication divide between the Deaf community communicating in 
              <strong> Ethiopian Sign Language (EthSL)</strong> and hearing individuals through real-time AI recognition, 
              speech synthesis, and validated sign demonstration sequences.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 rounded-lg p-2.5 max-w-md">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                <strong>Privacy Guaranteed:</strong> Camera frames are processed strictly in real-time memory. 
                Raw webcam video is never stored or uploaded.
              </span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Communication
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Communication Dashboard
                </Link>
              </li>
              <li>
                <Link to="/sign-to-text" className="hover:text-white transition-colors">
                  Sign-to-Text (Webcam)
                </Link>
              </li>
              <li>
                <Link to="/speech-to-sign" className="hover:text-white transition-colors">
                  Speech-to-Sign (Audio)
                </Link>
              </li>
              <li>
                <Link to="/dictionary" className="hover:text-white transition-colors">
                  EthSL Vocabulary Lexicon
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Research & Community */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              EthSL Community
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>CESLR Benchmark Corpus</li>
              <li>Ethiopian Sign Language Research</li>
              <li>ENAD Vocabulary Guidelines</li>
              <li>
                <Link to="/about" className="hover:text-white text-blue-400 inline-flex items-center gap-1">
                  Read Project Ethics <ExternalLink className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} EthioSign Platform. Dedicated to inclusive communication in Ethiopia.</p>
          <div className="flex items-center gap-4 mt-3 sm:mt-0">
            <Link to="/settings" className="hover:text-slate-300">Privacy & Settings</Link>
            <span>•</span>
            <Link to="/about" className="hover:text-slate-300">WCAG 2.2 AA Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
