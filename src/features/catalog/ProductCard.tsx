import { ShoppingCartOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Rate, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { publicAssetUrl } from '../../domain/catalog';
import { formatPrice } from '../../domain/money';
import type { Product } from '../../domain/types';
import './ProductCard.scss';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

/** Presentational card. The catalog page owns the add-to-cart decision. */
export default function ProductCard({ product, onAdd }: ProductCardProps) {
  const soldOut = product.stock < 1;
  const className = soldOut ? 'product-card product-card--out-of-stock' : 'product-card';

  return (
    <Card
      className={className}
      variant="outlined"
      cover={<img className="product-card__image" src={publicAssetUrl(product.imageUrl)} alt="" />}
    >
      <Flex vertical gap="small">
        <Tag className="product-card__tag" color="magenta">
          {product.category}
        </Tag>
        <Link className="product-card__link" to={`/products/${product.id}`}>
          <Typography.Title level={5} className="product-card__title">
            {product.name}
          </Typography.Title>
        </Link>
        <Typography.Paragraph className="product-card__price" strong>
          {formatPrice(product.price)}
        </Typography.Paragraph>
        <Rate className="product-card__rating" disabled allowHalf value={product.rating} />
        <Typography.Text type={soldOut ? 'danger' : 'secondary'}>
          {soldOut ? 'Out of stock' : `${product.stock} in stock`}
        </Typography.Text>
        <div className="product-card__actions">
          <Button
            type="primary"
            icon={<ShoppingCartOutlined />}
            disabled={soldOut}
            onClick={() => onAdd(product)}
            block
          >
            Add
          </Button>
        </div>
      </Flex>
    </Card>
  );
}
