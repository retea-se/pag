import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import RssPage from './RssPage.jsx'
import InfoPage from './InfoPage.jsx'
import DashboardPage from './DashboardPage.jsx'

function Router() {
  const [page, setPage] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setPage(window.location.hash);
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
