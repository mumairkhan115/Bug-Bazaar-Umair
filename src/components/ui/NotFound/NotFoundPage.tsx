import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import './NotFoundPage.scss';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <Result
        status="404"
        title="Page not found"
        subTitle="That address is not part of The Bug Bazaar."
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            Back to the shop
          </Button>
        }
      />
    </div>
  );
}
