import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartSummary } from '../components/CartSummary';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { placeOrder } from '../lib/api';

export function CheckoutPage() {
  const { lines, clear, itemCount } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (itemCount === 0) {
    return (
      <div className="container section narrow">
        <h1>Checkout</h1>
        <p className="empty-hint">Your cart is empty.</p>
        <Link to="/" className="btn btn-primary">
          Browse menu
        </Link>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const order = await placeOrder(
        {
          items: lines.map((l) => ({
            menuItemId: l.menuItemId,
            quantity: l.quantity,
          })),
          customerName,
          customerPhone,
          customerEmail: customerEmail || undefined,
          fulfillment,
          address: fulfillment === 'delivery' ? address : undefined,
          notes: notes || undefined,
        },
        token
      );
      clear();
      navigate(`/order-confirmation/${order.id}`, { state: { order } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container section checkout-layout">
      <div>
        <h1>Checkout</h1>
        {!user && (
          <p className="muted ban-note">
            Ordering as a guest is fine.{' '}
            <Link to="/login">Sign in</Link> to save this order to your history.
          </p>
        )}
        <form className="card form" onSubmit={onSubmit}>
          <label>
            Name *
            <input
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              autoComplete="name"
            />
          </label>
          <label>
            Phone *
            <input
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              autoComplete="tel"
              placeholder="555-0100"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          <fieldset className="fulfillment">
            <legend>Fulfillment</legend>
            <label className="radio">
              <input
                type="radio"
                name="fulfillment"
                checked={fulfillment === 'pickup'}
                onChange={() => setFulfillment('pickup')}
              />
              Pickup
            </label>
            <label className="radio">
              <input
                type="radio"
                name="fulfillment"
                checked={fulfillment === 'delivery'}
                onChange={() => setFulfillment('delivery')}
              />
              Delivery (stub — no real routing)
            </label>
          </fieldset>

          {fulfillment === 'delivery' && (
            <label>
              Delivery address *
              <input
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City"
              />
            </label>
          )}

          <label>
            Order notes
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Extra napkins, allergy notes…"
            />
          </label>

          {error && <div className="alert">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Placing order…' : 'Place order'}
          </button>
        </form>
      </div>
      <aside className="card sticky-side">
        <h2>Order summary</h2>
        <CartSummary showControls={false} />
      </aside>
    </div>
  );
}
