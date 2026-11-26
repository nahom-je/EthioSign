import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Uncaught UI error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 shadow-sm p-8 text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">
                Something went wrong
              </h2>
              <p className="text-sm text-slate-600">
                An unexpected error occurred while rendering this page. Your camera stream and local data remain private.
              </p>
              {this.state.error?.message && (
                <p className="text-xs font-mono text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-100 break-words">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
              <a
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors"
              >
                <Home className="w-4 h-4" />
                Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
