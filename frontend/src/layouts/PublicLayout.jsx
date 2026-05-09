import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { App as AntdApp } from 'antd';
import { submitLead } from '../api/contact';
import ChatWidget from '../Components/ChatWidget.jsx';
import { useAuth } from '../contexts/authContext.jsx';
import '../styles/public-minimal.css';

const NAV_LINKS = [
  { to: '/#home', label: 'Home' },
  { to: '/#about', label: 'About' },
  { to: '/#offers', label: 'Offers' },
];

function Newsletter() {
  const { message } = AntdApp.useApp();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      message.warning('Invalid email address.');
      return;
    }
    setLoading(true);
    try {
      await submitLead({ type: 'newsletter', email: value, message: 'Footer subscribe' });
      setEmail('');
      message.success('Subscription sent.');
    } catch {
      message.error('Could not send subscription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="ml-subscribe-form" onSubmit={onSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your text here"
        required
      />
      <button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Button'}</button>
    </form>
  );
}

export default function PublicLayout() {
  const { pathname, hash } = useLocation();
  const { token, user } = useAuth();
  const isHomePage = pathname === '/';

  useEffect(() => {
    if (!hash) return;
    const id = hash.replace('#', '');
    const run = () => {
      const target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    setTimeout(run, 0);
  }, [pathname, hash]);

  return (
    <div className={`ml-page ${isHomePage ? 'ml-page--home' : ''}`}>
      {isHomePage ? null : (
        <header className="ml-header">
          <nav className="ml-nav">
            {NAV_LINKS.map((link) => (
              <Link key={link.label} to={link.to} className="ml-nav-link">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-header-tools">
            <div className="ml-search-wrap">
              <input type="text" placeholder="Search" />
            </div>
            <Link to="/login" className="ml-black-btn">login</Link>
          </div>
        </header>
      )}

      <main className={`ml-main ${isHomePage ? 'ml-main--home' : ''}`}>
        <Outlet />
      </main>

      {isHomePage ? null : (
        <footer className="ml-footer">
          <div className="ml-footer-top">
            <div className="ml-brand">
              <h4>ACME</h4>
              <p>Lorem Street, 180</p>
              <p>+00 000 000 000</p>
            </div>

            <div className="ml-col">
              <h5>Category</h5>
              <p>Item text 1</p>
              <p>Item text 2</p>
              <p>Item text 3</p>
            </div>

            <div className="ml-col">
              <h5>Category</h5>
              <p>Item text 1</p>
              <p>Item text 2</p>
              <p>Item text 3</p>
            </div>

            <div className="ml-col">
              <h5>Category</h5>
              <p>Item text 1</p>
              <p>Item text 2</p>
              <p>Item text 3</p>
            </div>

            <div className="ml-subscribe">
              <h4>Subscribe</h4>
              <p>Lorem ipsum dolor sit amet</p>
              <Newsletter />
            </div>
          </div>
        </footer>
      )}

      {token && user ? <ChatWidget /> : null}
    </div>
  );
}
