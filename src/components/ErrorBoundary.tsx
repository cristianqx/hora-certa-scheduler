
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-xl font-bold text-red-700 mb-2">Algo deu errado</h2>
          <p className="text-red-600 mb-4">Ocorreu um erro ao renderizar este componente.</p>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            onClick={() => this.setState({ hasError: false })}
          >
            Tentar novamente
          </button>
          {this.state.error && (
            <pre className="mt-4 p-3 bg-red-100 text-red-800 rounded text-sm overflow-auto">
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
