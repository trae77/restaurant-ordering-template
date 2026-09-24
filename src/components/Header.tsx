import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { RESTAURANT_NAME } from '../lib/branding';

export function Header() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden>
            NK
          </span>
          <span className="brand-text">
            <strong>{RESTAURANT_NAME}</strong>
            <small>Order Online</small>
          </span>
        </Link>
        <nav className="nav">
          <NavLink to="/" end>
            Menu
          </NavLink>
          <NavLink to="/cart">
            Cart{itemCount > 0 ? ` (${itemCount})` : ''}
          </NavLink>
          {user ? (
            <>
              <NavLink to="/account">Account</NavLink>
              <button type="button" className="linkish" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <NavLink to="/login">Sign in</NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
