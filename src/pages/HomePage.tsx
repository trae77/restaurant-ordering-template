import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MenuItemCard } from '../components/MenuItemCard';
import { fetchMenu, type Category } from '../lib/api';
import { RESTAURANT_NAME, TAGLINE } from '../lib/branding';
import { useCart } from '../context/CartContext';

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<number | 'all'>('all');
  const { itemCount } = useCart();

  useEffect(() => {
    fetchMenu()
      .then((cats) => {
        setCategories(cats);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const visible =
    activeCat === 'all'
      ? categories
      : categories.filter((c) => c.id === activeCat);

  return (
    <div>
      <section className="hero">
        <div className="container hero-inner">
          <p className="eyebrow">Neighborhood Italian</p>
          <h1>{RESTAURANT_NAME}</h1>
          <p className="tagline">{TAGLINE}</p>
          <div className="hero-actions">
            <a href="#menu" className="btn btn-primary">
              Browse menu
            </a>
            {itemCount > 0 && (
              <Link to="/cart" className="btn btn-ghost">
                View cart ({itemCount})
              </Link>
            )}
          </div>
        </div>
      </section>

      <section id="menu" className="container section">
        <div className="section-head">
          <h2>Our Menu</h2>
          <p className="muted">Fresh daily. Swap seed data & branding for any client demo.</p>
        </div>

        {loading && <p>Loading menu…</p>}
        {error && (
          <div className="alert">
            Could not load menu: {error}. Is the API running on port 4000?
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="cat-pills" role="tablist">
              <button
                type="button"
                className={activeCat === 'all' ? 'pill active' : 'pill'}
                onClick={() => setActiveCat('all')}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={activeCat === c.id ? 'pill active' : 'pill'}
                  onClick={() => setActiveCat(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {visible.map((cat) => (
              <div key={cat.id} className="category-block">
                <h3 className="category-title">{cat.name}</h3>
                <div className="menu-grid">
                  {cat.items.map((item) => (
                    <MenuItemCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </section>
    </div>
  );
}
