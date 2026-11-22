import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, Result } from 'antd';
import { logError } from '../../../services/logger';
import './AppErrorBoundary.scss';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches render errors so one crash shows a fallback instead of a blank page.
 *
 * React concept: error boundaries are still class components.
 * Why: hooks cannot replace componentDidCatch.
 */
export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logError(error, info.componentStack ? 'render' : 'render');
  }

  private handleReset = () => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="app-error-boundary">
          <Result
            status="error"
            title="This page hit an unexpected error"
            subTitle="The error was logged. You can try the page again."
            extra={
              <Button type="primary" onClick={this.handleReset}>
                Try again
              </Button>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}
