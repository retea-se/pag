import { useState, useEffect } from 'react';
import { RssIcon } from './components/Icons';
import { usePageViews } from './hooks/usePageViews';
import './App.css';

const RSS_FEEDS = [
  {
    id: 'today',
    name: 'Idag',
    description: 'Evenemang som händer idag',
    file: 'rss-today.xml'
  },
  {
    id: 'tomorrow',
    name: 'Imorgon',
    description: 'Evenemang som händer imorgon',
    file: 'rss-tomorrow.xml'
  },
  {
    id: 'week',
    name: 'Denna vecka',
    description: 'Evenemang de närmaste 7 dagarna',
    file: 'rss-week.xml'
  },
  {
    id: 'upcoming',
    name: 'Kommande',
    description: 'Alla kommande evenemang',
    file: 'rss-upcoming.xml'
  }
];

function RssPage() {
  const [copied, setCopied] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const pageViews = usePageViews();

  // I produktion: /pag/, i utveckling: /
  const baseUrl = window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, '');

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'events.json')
      .then(res => res.json())
      .then(data => {
        if (data.lastUpdated) {
          setLastUpdated(new Date(data.lastUpdated));
        }
      })
      .catch(() => {});
  }, []);

  const copyToClipboard = async (feedId, url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(feedId);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Kunde inte kopiera:', err);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <div className="header-brand">
            <div className="logo">
              <span className="logo-text">På G</span>
            </div>
            <div className="header-title">
              <h1>RSS-flöden</h1>
              <span className="header-subtitle">Prenumerera på evenemang</span>
            </div>
          </div>
          <a href="#" className="back-btn" title="Tillbaka">
            <span>&#x2190;</span>
          </a>
        </div>
      </header>

      <main className="main rss-main">
        <div className="rss-intro">
          <p>
            Prenumerera på evenemang i Globenområdet direkt i din RSS-läsare.
            Kopiera länken nedan eller klicka för att visa XML-koden.
          </p>
          {lastUpdated && (
            <p className="rss-updated">
              Senast uppdaterad: {lastUpdated.toLocaleDateString('sv-SE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
        </div>

        <div className="rss-feeds">
          {RSS_FEEDS.map(feed => {
            const feedUrl = `${baseUrl}/${feed.file}`;
            return (
              <div key={feed.id} className="rss-feed-card">
                <div className="rss-feed-icon">
                  <RssIcon size={24} />
                </div>
                <div className="rss-feed-content">
                  <h2>{feed.name}</h2>
                  <p>{feed.description}</p>
                  <div className="rss-feed-url">
                    <input
                      type="text"
                      value={feedUrl}
                      readOnly
                      onClick={(e) => e.target.select()}
                    />
                    <button
                      onClick={() => copyToClipboard(feed.id, feedUrl)}
                      className={copied === feed.id ? 'copied' : ''}
                    >
                      {copied === feed.id ? 'Kopierad!' : 'Kopiera'}
                    </button>
                  </div>
                  <a
                    href={feedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rss-view-link"
                  >
                    Visa XML-kod
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rss-help">
          <h3>Hur använder jag RSS?</h3>
          <ol>
            <li>Kopiera länken till det flöde du vill prenumerera på</li>
            <li>Öppna din RSS-läsare (t.ex. Feedly, Inoreader, NetNewsWire)</li>
            <li>Lägg till ett nytt flöde och klistra in länken</li>
            <li>Klart! Du får nu uppdateringar om evenemang automatiskt</li>
          </ol>
        </div>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <p>Data från Stockholm Live</p>
          <a href="#" className="back-link">Tillbaka till evenemang</a>
        </div>
        <p className="footer-arenas">Avicii Arena, 3Arena, Hovet & Annexet</p>
        <p className="footer-made">Made with ❤️ in Stockholm | {pageViews.toLocaleString('sv-SE')}</p>
      </footer>
    </div>
  );
}

export default RssPage;
