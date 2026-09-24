import { Link } from 'react-router-dom';
import { CartSummary } from '../components/CartSummary';
import { useCart } from '../context/CartContext';

export function CartPage() {
  const { itemCount } = useCart();

  return (
    <div className="container section narrow">
      <h1>Your Cart</h1>
      <CartSummary />
      <div className="row-actions">
        <Link to="/" className="btn btn-ghost">
          Continue shopping
        </Link>
        {itemCount > 0 && (
          <Link to="/checkout" className="btn btn-primary">
            Checkout
          </Link>
        )}
      </div>
    </div>
  );
}
