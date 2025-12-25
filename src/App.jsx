import { useState, useEffect, useMemo } from 'react';
import { fetchAllEvents, filterEventsByPeriod, groupEventsByDate, ARENAS } from './api/stockholmLive';
import { RefreshIcon, getCategoryIcon, RssIcon, GitHubIcon, ArenaDot, InfoIcon } from './components/Icons';
import { usePageViews } from './hooks/usePageViews';
import './App.css';

// Datumfilter-knappar
const DATE_FILTERS = [
  { id: 'yesterday', label: 'Igår' },
  { id: 'today', label: 'Idag' },
  { id: 'tomorrow', label: 'Imorgon' },
  { id: 'week', label: 'Veckan' },
  { id: 'upcoming', label: 'Kommande' }
];

// Formatera datum på svenska
function formatEventDate(date) {
  if (!date) return null;
  const d = new Date(date);
  return d.toLocaleDateString('sv-SE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dateFilter, setDateFilter] = useState('today');
  const [loadingProgress, setLoadingProgress] = useState('');
  const pageViews = usePageViews();

  const loadEvents = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    setLoadingProgress('Hämtar evenemang...');

    try {
      const data = await fetchAllEvents(forceRefresh, true);
      // Återställ eventDate från serialiserad form
      const restored = data.map(e => ({
        ...e,
        eventDate: e.eventDate ? new Date(e.eventDate) : null
      }));
      setEvents(restored);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Kunde inte hämta evenemang');
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingProgress('');
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Filtrera events baserat på valt datumfilter
  const filteredEvents = useMemo(() => {
    return filterEventsByPeriod(events, dateFilter);
  }, [events, dateFilter]);

  // Gruppera events - efter datum för "kommande", annars efter tid på dagen
  const groupedEvents = useMemo(() => {
    return groupEventsByDate(filteredEvents, dateFilter === 'upcoming' || dateFilter === 'week');
  }, [filteredEvents, dateFilter]);

  // Räkna events per filter
  const filterCounts = useMemo(() => {
    const counts = {};
    DATE_FILTERS.forEach(f => {
      counts[f.id] = filterEventsByPeriod(events, f.id).length;
    });
    return counts;
  }, [events]);


  const today = new Date().toLocaleDateString('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <div className="header-brand">
            <div className="logo">
              <span className="logo-text">På G</span>
            </div>
            <div className="header-title">
              <h1>Globenområdet</h1>
              <span className="header-subtitle">Evenemang i Stockholm</span>
            </div>
          </div>
          <button
            onClick={() => loadEvents(true)}
            disabled={loading}
            className={`refresh-btn ${loading ? 'loading' : ''}`}
            aria-label="Uppdatera"
            title="Uppdatera"
          >
            <span className="refresh-icon">&#x21bb;</span>
          </button>
        </div>
        <div className="header-meta">
          <span className="header-date">{today}</span>
          {lastUpdated && (
            <span className="header-updated">
              Uppdaterad {lastUpdated.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </header>

      {/* Datumfilter */}
      <nav className="date-filter">
        {DATE_FILTERS.map(filter => (
          <button
            key={filter.id}
            className={dateFilter === filter.id ? 'active' : ''}
            onClick={() => setDateFilter(filter.id)}
          >
            {filter.label}
            <span className="filter-count">{filterCounts[filter.id]}</span>
          </button>
        ))}
      </nav>

      <main className="main">
        {loading && events.length === 0 && (
          <div className="loading">
            <RefreshIcon size={32} className="spinning" />
            <p>{loadingProgress || 'Laddar...'}</p>
          </div>
        )}

        {error && (
          <div className="error">
            <p>{error}</p>
            <button onClick={() => loadEvents(true)}>Försök igen</button>
          </div>
        )}

        {!loading && filteredEvents.length === 0 && !error && (
          <div className="empty">
            <p>Inga evenemang {dateFilter === 'yesterday' ? 'igår' : dateFilter === 'today' ? 'idag' : dateFilter === 'tomorrow' ? 'imorgon' : 'denna period'}</p>
          </div>
        )}

        {filteredEvents.length > 0 && (
          <div className="timeline">
            {groupedEvents.map((group, groupIndex) => (
              <div key={groupIndex} className="time-group">
                <div className="time-label">
                  <span className="time-dot" />
                  {group.label}
                </div>
                {group.events.map(event => (
                  <a
                    key={event.id}
                    href={event.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="event-card"
                  >
                    <div className="event-icon">
                      {getCategoryIcon(event.categoryIcon, 22)}
                    </div>
                    <div className="event-content">
                      <div className="event-title">
                        {event.title}
                        {event.opponent && (
                          <span className="event-opponent"> vs {event.opponent}</span>
                        )}
                      </div>
                      <div className="event-meta">
                        {event.eventDate && (dateFilter === 'upcoming' || dateFilter === 'week') && (
                          <span className="event-date">{formatEventDate(event.eventDate)}</span>
                        )}
                        {event.eventTime ? (
                          <span className="event-time">{event.eventTime}</span>
                        ) : event.eventDate && (
                          <span className="event-time event-time-unconfirmed">Tid ej bekr.</span>
                        )}
                        <span className="event-arena">
                          <ArenaDot color={event.arenaColor} size={6} />
                          {event.arena}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="footer">
        <div className="footer-content">
          <p>Data från Stockholm Live</p>
          <div className="footer-links">
            <a href="#rss" className="rss-link">
              <RssIcon size={14} />
              RSS-flöden
            </a>
            <a href="#info" className="info-link" title="Information och FAQ">
              <InfoIcon size={14} />
            </a>
            <a href="https://github.com/retea-se/pag" target="_blank" rel="noopener noreferrer" className="github-link" title="GitHub">
              <GitHubIcon size={14} />
            </a>
          </div>
        </div>
        <p className="footer-arenas">Avicii Arena, 3Arena, Hovet & Annexet</p>
        <p className="footer-made">Made with ❤️ in Stockholm | {pageViews.toLocaleString('sv-SE')}</p>
      </footer>
    </div>
  );
}

export default App;
