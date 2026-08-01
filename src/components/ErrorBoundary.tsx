import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackLabel?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-500 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-neutral-900 dark:text-white mb-2">
              {this.props.fallbackLabel || '系統錯誤'}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
              {this.state.error?.message || '應用程式發生未預期的錯誤'}
            </p>
            <button
              onClick={this.handleReset}
              className="px-6 py-2.5 rounded-xl bg-[#aa151b] text-white font-black text-xs uppercase tracking-wider transition-all duration-150 hover:bg-[#8e171d] active:scale-95 cursor-pointer inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              重新嘗試
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
