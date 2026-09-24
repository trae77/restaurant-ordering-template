import type { MenuItem } from '../lib/api';
import { formatMoney } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useState } from 'react';

export function MenuItemCard({ item }: { item: MenuItem }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(item, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 900);
  }

  return (
    <article className="menu-card">
      <div className="menu-card-emoji" aria-hidden>
        {item.imageEmoji || '🍽️'}
      </div>
      <div className="menu-card-body">
        <div className="menu-card-top">
          <h3>{item.name}</h3>
          <span className="price">{formatMoney(item.priceCents)}</span>
        </div>
        <p>{item.description}</p>
        <button
          type="button"
          className={`btn btn-primary ${added ? 'btn-added' : ''}`}
          onClick={handleAdd}
        >
          {added ? 'Added ✓' : 'Add to cart'}
        </button>
      </div>
    </article>
  );
}
