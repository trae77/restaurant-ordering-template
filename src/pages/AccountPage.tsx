import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchMyOrders, formatMoney, type Order } from '../lib/api';

export function AccountPage() {
  const { user, token, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!token) return;
    setBusy(true);
    fetchMyOrders(token)
      .then(setOrders)
      .catch((err: Error) => setError(err.message))
      .finally(() => setBusy(false));
  }, [token]);

  if (loading) return <div className="container section">Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: '/account' }} />;

  return (
    <div className="container section narrow">
      <h1>Hello, {user.name.split(' ')[0]}</h1>
      <p className="muted">{user.email}</p>

      <h2 className="mt">Order history</h2>
      {busy && <p>Loading orders…</p>}
      {error && <div className="alert">{error}</div>}
      {!busy && orders.length === 0 && (
        <p className="empty-hint">
          No orders yet. <Link to="/">Browse the menu</Link> to place your first.
        </p>
      )}
      <ul className="order-list">
        {orders.map((o) => (
          <li key={o.id} className="card order-card">
            <div className="order-card-head">
              <strong>Order #{o.id}</strong>
              <span className="badge">{o.status}</span>
            </div>
            <div className="muted">
              {new Date(o.createdAt + 'Z').toLocaleString()} · {o.fulfillment}
            </div>
            <ul className="order-items">
              {o.items.map((i) => (
                <li key={i.id}>
                  {i.quantity}× {i.name}
                </li>
              ))}
            </ul>
            <div className="order-total">{formatMoney(o.totalCents)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
