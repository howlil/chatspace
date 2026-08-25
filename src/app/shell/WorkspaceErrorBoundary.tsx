import { AlertTriangle } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface WorkspaceErrorBoundaryProps {
  children: ReactNode;
}

interface WorkspaceErrorBoundaryState {
  failed: boolean;
}

export class WorkspaceErrorBoundary extends Component<
  WorkspaceErrorBoundaryProps,
  WorkspaceErrorBoundaryState
> {
  override state: WorkspaceErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): WorkspaceErrorBoundaryState {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Chatspace workspace failed safely.', error, info.componentStack);
  }

  override render() {
    if (this.state.failed) {
      return (
        <section
          className="m-3 flex items-start gap-2 rounded-lg border border-red-300/15 bg-red-300/[0.045] p-3 text-xs text-cs-text"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 shrink-0 text-red-200" size={15} aria-hidden="true" />
          <div className="grid gap-1">
            <strong>Chatspace stopped safely</strong>
            <span className="text-cs-muted">ChatGPT is still available. Reload the page to restore Chatspace.</span>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
