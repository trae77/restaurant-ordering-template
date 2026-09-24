import { formatMoney } from '../lib/api';
import { useCart } from '../context/CartContext';

const TAX_RATE = 0.08;

export function CartSummary({ showControls = true }: { showControls?: boolean }) {
  const { lines, setQuantity, removeItem, subtotalCents } = useCart();
  const tax = Math.round(subtotalCents * TAX_RATE);
  const total = subtotalCents + tax;

  if (lines.length === 0) {
    return <p className="empty-hint">Your cart is empty. Browse the menu to add items.</p>;
  }

  return (
    <div className="cart-summary">
      <ul className="cart-lines">
        {lines.map((line) => (
          <li key={line.menuItemId}>
            <div className="cart-line-main">
              <span className="cart-emoji" aria-hidden>
                {line.imageEmoji}
              </span>
              <div>
                <strong>{line.name}</strong>
                <div className="muted">{formatMoney(line.priceCents)} each</div>
              </div>
            </div>
            <div className="cart-line-actions">
              {showControls ? (
                <>
                  <div className="qty">
                    <button
                      type="button"
                      aria-label="Decrease"
                      onClick={() => setQuantity(line.menuItemId, line.quantity - 1)}
                    >
                      −
                    </button>
                    <span>{line.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase"
                      onClick={() => setQuantity(line.menuItemId, line.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="linkish danger"
                    onClick={() => removeItem(line.menuItemId)}
                  >
                    Remove
                  </button>
                </>
              ) : (
                <span>× {line.quantity}</span>
              )}
              <strong>{formatMoney(line.priceCents * line.quantity)}</strong>
            </div>
          </li>
        ))}
      </ul>
      <dl className="totals">
        <div>
          <dt>Subtotal</dt>
          <dd>{formatMoney(subtotalCents)}</dd>
        </div>
        <div>
          <dt>Tax (8%)</dt>
          <dd>{formatMoney(tax)}</dd>
        </div>
        <div className="total-row">
          <dt>Total</dt>
          <dd>{formatMoney(total)}</dd>
        </div>
      </dl>
    </div>
  );
}
