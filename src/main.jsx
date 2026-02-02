import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import RssPage from './RssPage.jsx'
import InfoPage from './InfoPage.jsx'
import DashboardPage from './DashboardPage.jsx'
import { trackPageView } from './hooks/useMatomo.js'

// Page titles for tracking
const PAGE_TITLES = {
  '': 'På G - Evenemang',
  '#rss': 'På G - RSS-flöden',
  '#info': 'På G - Information',
  '#dashboard': 'På G - Dashboard'
};

function Router() {
  const [page, setPage] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => {
      const newPage = window.location.hash;
      setPage(newPage);
      // Track virtual page view
      const path = newPage ? newPage.replace('#', '/') : '/';
      trackPageView(path, PAGE_TITLES[newPage] || 'På G');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (page === '#rss') {
    return <RssPage />;
  }
  if (page === '#info') {
    return <InfoPage />;
  }
  if (page === '#dashboard') {
    return <DashboardPage />;
  }
  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router />
  </StrictMode>,
)
