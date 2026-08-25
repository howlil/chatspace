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
  state: WorkspaceErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): WorkspaceErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Chatspace workspace failed safely.', error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return (
        <section className="chatspace-fallback" role="alert">
          <strong>Chatspace stopped safely</strong>
          <span>ChatGPT is still available. Reload the page to restore Chatspace.</span>
        </section>
      );
    }

    return this.props.children;
  }
}
