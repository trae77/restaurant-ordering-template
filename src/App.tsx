import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AccountPage } from './pages/AccountPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { SignupPage } from './pages/SignupPage';
import { RESTAURANT_NAME } from './lib/branding';

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <p>
          <strong>{RESTAURANT_NAME}</strong> — demo ordering template for client
          pitches. Swap branding &amp; seed menu to re-skin.
        </p>
        <p className="muted small">
          Not a real restaurant. No payments processed.
        </p>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <div className="app-shell">
            <Header />
            <main>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route
                  path="/order-confirmation/:id"
                  element={<OrderConfirmationPage />}
                />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
