import { useState, useEffect } from 'react';
import { InfoIcon } from './components/Icons';
import { usePageViews } from './hooks/usePageViews';
import './App.css';

function DashboardPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pageViews = usePageViews();

  useEffect(() => {
    loadStatus();
    // Uppdatera var 30:e sekund
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const response = await fetch(import.meta.env.BASE_URL + 'status.json');
      if (!response.ok) {
        throw new Error('Kunde inte hämta status');
      }
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError('Kunde inte ladda status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Okänt';
    const date = new Date(dateString);
    return date.toLocaleString('sv-SE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'Okänt';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins} min ${secs} sek`;
    }
    return `${secs} sek`;
  };

  const getNextRun = (lastRun) => {
    if (!lastRun) return 'Okänt';
    const date = new Date(lastRun);
    // Lägg till 4 timmar (var 4:e timme)
    date.setHours(date.getHours() + 4);
    // Runda ner till närmaste timme
    date.setMinutes(0);
    date.setSeconds(0);
    return formatDate(date.toISOString());
  };

  const getStatusBadge = (statusType) => {
    if (statusType === 'success') {
      return (
        <span className="status-badge success">
          <span className="status-dot"></span>
          Lyckades
        </span>
      );
    } else if (statusType === 'error') {
      return (
        <span className="status-badge error">
          <span className="status-dot"></span>
          Fel
        </span>
      );
    } else {
      return (
        <span className="status-badge warning">
          <span className="status-dot"></span>
          Varning
        </span>
      );
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
              <h1>Cron Dashboard</h1>
              <span className="header-subtitle">Synkroniseringsstatus</span>
            </div>
          </div>
          <a href="#" className="back-btn" title="Tillbaka">
            <span>&#x2190;</span>
          </a>
        </div>
      </header>

      <main className="main">
        {loading && (
          <div className="loading">
            <p>Laddar status...</p>
          </div>
        )}

        {error && (
          <div className="error">
            <p>{error}</p>
            <button onClick={loadStatus}>Försök igen</button>
          </div>
        )}

        {status && !loading && (
          <>
            {/* Status Card */}
            <div className="status-card">
              <div className="status-header">
                <h2 className="status-title">Senaste körning</h2>
                {getStatusBadge(status.status || 'success')}
              </div>
              <div className="status-info">
                <div className="status-row">
                  <span className="status-label">Tidpunkt</span>
                  <span className="status-value">{formatDate(status.lastRun)}</span>
                </div>
                {status.duration && (
                  <div className="status-row">
                    <span className="status-label">Varaktighet</span>
                    <span className="status-value">{formatDuration(status.duration)}</span>
                  </div>
                )}
                <div className="status-row">
                  <span className="status-label">Nästa körning</span>
                  <span className="status-value">{getNextRun(status.lastRun)}</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{status.eventCount || 0}</div>
                <div className="stat-label">Totalt events</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{status.arenaCount || 0}</div>
                <div className="stat-label">Arenor</div>
              </div>
              {status.changes && (
                <>
                  <div className="stat-card">
                    <div className="stat-number">{status.changes.added || 0}</div>
                    <div className="stat-label">Nya events</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{status.changes.updated || 0}</div>
                    <div className="stat-label">Uppdaterade</div>
                  </div>
                </>
              )}
            </div>

            {/* Changes Section */}
            {status.changes && (status.changes.added > 0 || status.changes.updated > 0 || status.changes.removed > 0) && (
              <div className="changes-section">
                <h2 className="section-title">Vad ändrades</h2>
                {status.changesDetails && status.changesDetails.length > 0 ? (
                  status.changesDetails.map((change, index) => (
                    <div key={index} className="change-item">
                      <div className={`change-icon ${change.type}`}>
                        {change.type === 'added' ? '+' : change.type === 'updated' ? '↻' : '−'}
                      </div>
                      <div className="change-content">
                        <div className="change-title">{change.title}</div>
                        <div className="change-meta">
                          {change.arena} • {change.date ? formatDate(change.date) : 'Datum ej angivet'}
                          {change.details && ` • ${change.details}`}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    Inga ändringar under senaste körningen
                  </div>
                )}
              </div>
            )}

            {/* Errors Section */}
            <div className="errors-section">
              <h2 className="section-title">Fel & varningar</h2>
              {status.errors && status.errors.length > 0 ? (
                status.errors.map((err, index) => (
                  <div key={index} className="error-item">
                    <div className="error-title">{err.title || 'Fel'}</div>
                    <div className="error-message">{err.message || err}</div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  Inga fel under senaste körningen
                </div>
              )}
            </div>
          </>
        )}
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

export default DashboardPage;

