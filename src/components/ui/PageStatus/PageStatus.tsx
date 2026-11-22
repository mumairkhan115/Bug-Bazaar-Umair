import type { ReactNode } from 'react';
import { Button, Empty, Result, Spin } from 'antd';
import type { RequestStatus } from '../../../domain/types';
import './PageStatus.scss';

interface PageStatusProps {
  status: RequestStatus;
  empty?: boolean;
  emptyDescription?: string;
  onRetry?: () => void;
  children: ReactNode;
}

/**
 * Renders loading, error, empty, or the successful children.
 *
 * Why: list and detail pages share one set of states so a forced error
 * looks the same everywhere.
 */
export default function PageStatus({
  status,
  empty = false,
  emptyDescription = 'Nothing to show yet.',
  onRetry,
  children,
}: PageStatusProps) {
  if (status.state === 'idle' || status.state === 'loading') {
    return (
      <div className="page-status" role="status">
        <Spin />
      </div>
    );
  }

  if (status.state === 'error') {
    return (
      <Result
        status="error"
        title="Something went wrong"
        subTitle={status.message}
        extra={
          onRetry ? (
            <Button type="primary" onClick={onRetry}>
              Retry
            </Button>
          ) : null
        }
      />
    );
  }

  if (empty) {
    return (
      <div className="page-status">
        <Empty description={emptyDescription} />
      </div>
    );
  }

  return children;
}
