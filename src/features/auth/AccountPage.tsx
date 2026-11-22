import { useEffect, useState } from 'react';
import { Button, Card, Col, Descriptions, Flex, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import PageStatus from '../../components/ui/PageStatus/PageStatus';
import type { RequestStatus, User } from '../../domain/types';
import { friendlyMessage } from '../../services/api/errors';
import { currentUserRequest } from '../../services/api/auth';
import { isAbortError } from '../../services/api/client';
import { clearSession } from './sessionSlice';
import './AccountPage.scss';

export default function AccountPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const sessionUser = useAppSelector((state) => state.session.user);
  const requestKey = 'me';
  const [snapshot, setSnapshot] = useState<{
    key: string;
    status: RequestStatus;
    user: User | null;
  }>({
    key: '',
    status: { state: 'idle' },
    user: null,
  });
  const [crash, setCrash] = useState(false);
  const status = snapshot.key === requestKey ? snapshot.status : { state: 'loading' as const };
  const user = snapshot.key === requestKey ? snapshot.user : sessionUser;

  useEffect(() => {
    const controller = new AbortController();
    const activeKey = requestKey;
    currentUserRequest(controller.signal)
      .then((next) => {
        setSnapshot({ key: activeKey, status: { state: 'success' }, user: next });
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) {
          return;
        }
        setSnapshot({
          key: activeKey,
          status: { state: 'error', message: friendlyMessage(error) },
          user: null,
        });
      });
    return () => controller.abort();
  }, [requestKey]);

  if (crash) {
    throw new Error('Simulated render crash');
  }

  return (
    <PageStatus status={status}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={18} lg={14} xl={12} xxl={10}>
          <Card className="account-page">
            <Typography.Title level={3}>Account</Typography.Title>
            <Descriptions column={1}>
              <Descriptions.Item label="Name">{user?.name}</Descriptions.Item>
              <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
            </Descriptions>
            <Flex className="account-page__actions" gap="small" wrap="wrap">
              <Button
                onClick={() => {
                  dispatch(clearSession());
                  navigate('/login');
                }}
              >
                Log out
              </Button>
              <Button danger onClick={() => setCrash(true)}>
                Simulate crash
              </Button>
            </Flex>
          </Card>
        </Col>
      </Row>
    </PageStatus>
  );
}
