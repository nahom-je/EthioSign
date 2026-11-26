import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  Video, 
  Mic, 
  BookOpen, 
  Settings as SettingsIcon, 
  Info, 
  Menu, 
  X, 
  Sparkles,
  ArrowRightLeft,
  LogIn,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const navLinks = [
    { to: '/dashboard', label: 'Communicate', amharic: 'መገናኛ', icon: ArrowRightLeft },
    { to: '/sign-to-text', label: 'Sign → Text', amharic: 'ምልክት ወደ ጽሑፍ', icon: Video },
    { to: '/speech-to-sign', label: 'Speech → Sign', amharic: 'ንግግር ወደ ምልክት', icon: Mic },
    { to: '/dictionary', label: 'EthSL Dictionary', amharic: 'የምልክት መዝገበ-ቃላት', icon: BookOpen },
    { to: '/about', label: 'About', amharic: 'ስለ ፕሮጀክቱ', icon: Info },
    { to: '/settings', label: 'Settings', amharic: 'ቅንብሮች', icon: SettingsIcon },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-blue-600 rounded-lg p-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <span className="font-extrabold text-xl tracking-tighter">ES</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  EthioSign
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                  EthSL
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium -mt-0.5 font-ethiopic">
                የኢትዮጵያ የምልክት ቋንቋ
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Action & Status Badge */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>EthSL Model v1.0 Ready</span>
            </div>
            {isAuthenticated ? (
              <div className="inline-flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>{user.name.split(' ')[0]}</span>
                </span>
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-base font-medium ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-slate-500" />
                  <span>{item.label}</span>
                </div>
                <span className="text-xs text-slate-400 font-ethiopic">{item.amharic}</span>
              </NavLink>
            );
          })}
          <div className="pt-2 border-t border-slate-100">
            {isAuthenticated ? (
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-base font-medium text-rose-600 hover:bg-rose-50"
              >
                <span className="flex items-center gap-3">
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out ({user.name})</span>
                </span>
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-blue-600 hover:bg-blue-50"
              >
                <LogIn className="w-5 h-5" />
                <span>Sign In / Register</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
