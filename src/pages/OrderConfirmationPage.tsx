import { Link, useLocation, useParams } from 'react-router-dom';
import { formatMoney, type Order } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function OrderConfirmationPage() {
  const { id } = useParams();
  const location = useLocation();
  const order = (location.state as { order?: Order } | null)?.order;
  const { user } = useAuth();

  return (
    <div className="container section narrow">
      <div className="confirm-hero">
        <span className="confirm-check" aria-hidden>
          ✓
        </span>
        <h1>Order placed!</h1>
        <p className="muted">
          Thanks — we&apos;ve got order #{order?.id ?? id}. This is a demo template;
          no kitchen ticket was sent.
        </p>
      </div>

      {order && (
        <div className="card">
          <p>
            <strong>{order.customerName}</strong> · {order.customerPhone}
          </p>
          <p className="muted">
            {order.fulfillment === 'pickup' ? 'Pickup' : `Delivery to ${order.address}`}
          </p>
          <ul className="order-items">
            {order.items.map((i) => (
              <li key={i.id}>
                {i.quantity}× {i.name} — {formatMoney(i.unitPriceCents * i.quantity)}
              </li>
            ))}
          </ul>
          <p className="order-total">Total {formatMoney(order.totalCents)}</p>
        </div>
      )}

      <div className="row-actions">
        <Link to="/" className="btn btn-ghost">
          Back to menu
        </Link>
        {user ? (
          <Link to="/account" className="btn btn-primary">
            View order history
          </Link>
        ) : (
          <Link to="/signup" className="btn btn-primary">
            Create account for next time
          </Link>
        )}
      </div>
    </div>
  );
}
