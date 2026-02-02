import { useState, useEffect } from 'react';
import { RssIcon, CalendarIcon, JsonIcon } from './components/Icons';
import { usePageViews } from './hooks/usePageViews';
import { trackFeedCopy, trackFeedView, trackNavClick } from './hooks/useMatomo';
import './App.css';

const FEED_PERIODS = [
  {
    id: 'today',
    name: 'Idag',
    description: 'Evenemang som händer idag'
  },
  {
    id: 'tomorrow',
    name: 'Imorgon',
    description: 'Evenemang som händer imorgon'
  },
  {
    id: 'week',
    name: 'Denna vecka',
    description: 'Evenemang de närmaste 7 dagarna'
  },
  {
    id: 'upcoming',
    name: 'Kommande',
    description: 'Alla kommande evenemang'
  }
];

const FEED_TYPES = [
  {
    id: 'rss',
    name: 'RSS',
    description: 'Klassisk RSS-feed för RSS-läsare',
    icon: RssIcon,
    getFileName: (period) => `rss-${period}.xml`,
    getViewText: () => 'Visa XML-kod',
    color: '#f97316'
  },
  {
    id: 'ical',
    name: 'Kalender',
    description: 'iCal-format för kalenderappar (Google Calendar, Outlook, Apple Calendar)',
    icon: CalendarIcon,
    getFileName: (period) => `calendar-${period}.ics`,
    getViewText: () => 'Ladda ner .ics-fil',
    color: '#3b82f6'
  },
  {
    id: 'json',
    name: 'JSON Feed',
    description: 'Modern JSON Feed för utvecklare och moderna appar',
    icon: JsonIcon,
    getFileName: (period) => `feed-${period}.json`,
    getViewText: () => 'Visa JSON',
    color: '#10b981'
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

  const copyToClipboard = async (feedId, url, feedType, period) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(feedId);
      trackFeedCopy(feedType, period);
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
              <h1>Prenumerationsflöden</h1>
              <span className="header-subtitle">RSS, Kalender & JSON Feed</span>
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
            Prenumerera på evenemang i Globenområdet via RSS, kalender eller JSON Feed.
            Välj det format som passar bäst för ditt behov.
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

        {FEED_TYPES.map(feedType => {
          const IconComponent = feedType.icon;
          return (
            <div key={feedType.id} className="feed-type-section">
              <div className="feed-type-header">
                <div className="feed-type-icon" style={{ backgroundColor: `${feedType.color}15`, color: feedType.color }}>
                  <IconComponent size={24} />
                </div>
                <div>
                  <h2>{feedType.name}</h2>
                  <p className="feed-type-description">{feedType.description}</p>
                </div>
              </div>
              <div className="rss-feeds">
                {FEED_PERIODS.map(period => {
                  const fileName = feedType.getFileName(period.id);
                  const feedUrl = `${baseUrl}/${fileName}`;
                  const feedId = `${feedType.id}-${period.id}`;
                  return (
                    <div key={feedId} className="rss-feed-card">
                      <div className="rss-feed-icon" style={{ backgroundColor: `${feedType.color}15`, color: feedType.color }}>
                        <IconComponent size={24} />
                      </div>
                      <div className="rss-feed-content">
                        <h3>{period.name}</h3>
                        <p>{period.description}</p>
                        <div className="rss-feed-url">
                          <input
                            type="text"
                            value={feedUrl}
                            readOnly
                            onClick={(e) => e.target.select()}
                          />
                          <button
                            onClick={() => copyToClipboard(feedId, feedUrl, feedType.id, period.id)}
                            className={copied === feedId ? 'copied' : ''}
                            style={{ backgroundColor: feedType.color }}
                          >
                            {copied === feedId ? 'Kopierad!' : 'Kopiera'}
                          </button>
                        </div>
                        <a
                          href={feedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rss-view-link"
                          style={{ color: feedType.color }}
                          onClick={() => trackFeedView(feedType.id, period.id)}
                        >
                          {feedType.getViewText()}
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="rss-help">
          <h3>Hur använder jag flödena?</h3>
          <div className="help-sections">
            <div className="help-section">
              <h4>RSS</h4>
              <ol>
                <li>Kopiera länken till det flöde du vill prenumerera på</li>
                <li>Öppna din RSS-läsare (t.ex. Feedly, Inoreader, NetNewsWire)</li>
                <li>Lägg till ett nytt flöde och klistra in länken</li>
                <li>Klart! Du får nu uppdateringar om evenemang automatiskt</li>
              </ol>
            </div>
            <div className="help-section">
              <h4>Kalender (iCal)</h4>
              <ol>
                <li>Klicka på länken eller kopiera URL:en</li>
                <li><strong>Google Calendar:</strong> Gå till "Lägg till kalender" → "Från URL" och klistra in länken</li>
                <li><strong>Outlook:</strong> Gå till "Lägg till kalender" → "Prenumerera på kalender" och klistra in länken</li>
                <li><strong>Apple Calendar:</strong> Gå till "Arkiv" → "Ny kalenderprenumeration" och klistra in länken</li>
                <li>Evenemangen synkroniseras automatiskt och uppdateras regelbundet</li>
              </ol>
            </div>
            <div className="help-section">
              <h4>JSON Feed</h4>
              <ol>
                <li>Kopiera URL:en till JSON Feed-flödet</li>
                <li>Använd i din applikation eller utvecklingsprojekt</li>
                <li>Parsa JSON-data direkt utan XML-parsing</li>
                <li>Perfekt för moderna webbappar och mobilappar</li>
              </ol>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <p>Data från Stockholm Live</p>
          <a href="#" className="back-link" onClick={() => trackNavClick('home')}>Tillbaka till evenemang</a>
        </div>
        <p className="footer-arenas">Avicii Arena, 3Arena, Hovet & Annexet</p>
        <p className="footer-made">Made with ❤️ in Stockholm | {pageViews.toLocaleString('sv-SE')}</p>
      </footer>
    </div>
  );
}

export default RssPage;
