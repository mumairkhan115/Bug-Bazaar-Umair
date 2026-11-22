import { useState } from 'react';
import { Alert, Button, Card, Col, Form, Input, Row, Space, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/redux';
import { ApiRequestError } from '../../services/api/errors';
import { loginRequest } from '../../services/api/auth';
import { setSession } from './sessionSlice';
import './LoginPage.scss';

interface LoginValues {
  email: string;
  password: string;
}

/**
 * Signs the shopper in and returns them to the page they requested.
 *
 * Why: the submitting flag blocks a second submit while the first request is open.
 * A 401 from a wrong password is explained here. Other 401s clear the session in the client.
 */
export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm<LoginValues>();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const from =
    typeof location.state === 'object' &&
    location.state !== null &&
    'from' in location.state &&
    typeof location.state.from === 'string'
      ? location.state.from
      : '/account';

  const handleFinish = async (values: LoginValues) => {
    if (submitting) {
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const session = await loginRequest(values.email, values.password);
      dispatch(setSession(session));
      navigate(from, { replace: true });
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 400 && error.details) {
        form.setFields(
          Object.entries(error.details).map(([name, errors]) => ({
            name: name as keyof LoginValues,
            errors: [errors],
          })),
        );
      } else if (error instanceof ApiRequestError && error.status === 401) {
        setFormError('Email or password is incorrect.');
      } else {
        setFormError('The store is unavailable. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={16} lg={12} xl={10} xxl={8}>
        <Card>
          <Space className="login-page" direction="vertical" size="middle">
            <Typography.Title level={3}>Sign in</Typography.Title>
            <Typography.Paragraph>Demo account: umair@bugbazaar.dev / quack</Typography.Paragraph>
            {formError ? <Alert type="error" showIcon message={formError} /> : null}
            <Form<LoginValues>
              form={form}
              layout="vertical"
              onFinish={(values) => void handleFinish(values)}
            >
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Email is required.' },
                  { type: 'email', message: 'Enter a valid email.' },
                ]}
              >
                <Input autoComplete="email" />
              </Form.Item>
              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: 'Password is required.' }]}
              >
                <Input.Password autoComplete="current-password" />
              </Form.Item>
              <Button type="primary" htmlType="submit" disabled={submitting}>
                {submitting ? 'Signing in' : 'Sign in'}
              </Button>
            </Form>
          </Space>
        </Card>
      </Col>
    </Row>
  );
}
