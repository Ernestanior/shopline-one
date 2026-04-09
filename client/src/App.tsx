import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductCollection from './pages/ProductCollection';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Test from './pages/Test';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Account from './pages/Account';
import OrderDetail from './pages/OrderDetail';
import Checkout from './pages/Checkout';
import CheckoutPage from './pages/CheckoutPage';
import PaymentReturnPage from './pages/PaymentReturnPage';
import TransactionsPage from './pages/admin/TransactionsPage';
import Admin from './pages/Admin';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import RefundPolicy from './pages/RefundPolicy';
import { AuthProvider } from './auth/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { NotificationProvider } from './contexts/NotificationContext';
import RequireAuth from './auth/RequireAuth';
import './App.css';

function AnimatedRoutes() {
  const location = useLocation();

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div key={location.pathname} className="page-transition">
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/collections/:category" element={<ProductCollection />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/policies/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/policies/terms-of-service" element={<TermsOfService />} />
        <Route path="/policies/refund-policy" element={<RefundPolicy />} />
        <Route path="/test" element={<Test />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/checkout/:orderId" element={<CheckoutPage />} />
        <Route path="/checkout/payment/:orderId" element={<CheckoutPage />} />
        <Route path="/payment/return/:orderId" element={<PaymentReturnPage />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/transactions" element={<TransactionsPage />} />
        <Route
          path="/account"
          element={
            <RequireAuth>
              <Account />
            </RequireAuth>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <RequireAuth>
              <OrderDetail />
            </RequireAuth>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <div className="App">
              <Header />
              <main>
              <AnimatedRoutes />
            </main>
            <Footer />
          </div>
        </NotificationProvider>
      </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
