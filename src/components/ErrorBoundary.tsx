import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { translations } from '@/lib/i18n/translations';
import type { Language } from '@/lib/i18n/translations';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

function getLang(): Language {
  return (localStorage.getItem('vibe-tube-atlas-language') as Language) || 'vi';
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // ErrorBoundary is a catch-all safety net; logging is acceptable but gate
    // the verbose component stack behind DEV to avoid leaking tree structure
    // to the browser console in production.
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Caught render error:', error)
      console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack)
    }
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const t = translations[getLang()];
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background px-4">
          <div className="flex flex-col items-center space-y-6 text-center">
            <div className="flex bg-destructive/10 p-6 rounded-full">
              <AlertTriangle className="h-16 w-16 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{t.errors.oops}</h1>
              <h2 className="text-2xl font-semibold tracking-tight">{t.errors.somethingWentWrong}</h2>
            </div>
            <p className="max-w-[600px] text-muted-foreground">
              {t.errors.errorDescription}
            </p>
            <div className="flex gap-4 mt-4">
              <Button
                variant="outline"
                size="lg"
                onClick={this.handleReload}
              >
                {t.errors.tryAgain}
              </Button>
              <Button
                size="lg"
                onClick={() => window.location.reload()}
              >
                {t.errors.reloadPage}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
