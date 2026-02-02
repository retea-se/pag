import { useState, useEffect } from 'react';
import { InfoIcon, RefreshIcon } from './components/Icons';
import { usePageViews } from './hooks/usePageViews';
import { trackManualUpdate, trackNavClick, trackError } from './hooks/useMatomo';
import './App.css';

function DashboardPage() {
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState(null);
  const pageViews = usePageViews();

  useEffect(() => {
    loadStatus();
    loadHistory();
    // Uppdatera var 30:e sekund
    const interval = setInterval(() => {
      loadStatus();
      loadHistory();
    }, 30000);
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

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch(import.meta.env.BASE_URL + 'history.json');
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      } else {
        // History kan saknas första gången, det är okej
        setHistory(null);
      }
    } catch (err) {
      // History kan saknas, det är okej
      setHistory(null);
    } finally {
      setHistoryLoading(false);
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

  // Beräkna nästa körning baserat på nuvarande tid (inte senaste körning)
  const getNextRun = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Cron kör var 4:e timme: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
    const scheduledHours = [0, 4, 8, 12, 16, 20];

    // Hitta nästa schemalagda timme (måste vara STÖRRE än currentHour, eller om vi är exakt på timmen och minuter är 0)
    // Om vi är kl 12:00 exakt, nästa är 16:00 (inte 12:00 igen)
    // Om vi är kl 12:30, nästa är 16:00
    let nextHour = scheduledHours.find(h => h > currentHour);

    const nextRun = new Date(now);
    if (nextHour === undefined) {
      // Om vi är efter 20:00, nästa körning är 00:00 nästa dag
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(0);
    } else {
      nextRun.setHours(nextHour);
    }
    nextRun.setMinutes(0);
    nextRun.setSeconds(0);
    nextRun.setMilliseconds(0);

    return {
      date: nextRun,
      formatted: formatDate(nextRun.toISOString()),
      relative: getRelativeTime(nextRun)
    };
  };

  // Beräkna relativ tid (t.ex. "om 2 timmar")
  const getRelativeTime = (targetDate) => {
    const now = new Date();
    const diff = targetDate - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `om ${hours} ${hours === 1 ? 'timme' : 'timmar'}`;
    } else if (minutes > 0) {
      return `om ${minutes} ${minutes === 1 ? 'minut' : 'minuter'}`;
    } else {
      return 'nu';
    }
  };

  // Beräkna tid sedan senaste körning
  const getTimeSinceLastRun = (lastRun) => {
    if (!lastRun) return null;
    const now = new Date();
    const lastRunDate = new Date(lastRun);
    const diff = now - lastRunDate;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `för ${hours} ${hours === 1 ? 'timme' : 'timmar'} sedan`;
    } else if (minutes > 0) {
      return `för ${minutes} ${minutes === 1 ? 'minut' : 'minuter'} sedan`;
    } else {
      return 'just nu';
    }
  };

  // Kontrollera om senaste körning är för gammal (mer än 5 timmar = varning)
  const isLastRunTooOld = (lastRun) => {
    if (!lastRun) return true;
    const now = new Date();
    const lastRunDate = new Date(lastRun);
    const diff = now - lastRunDate;
    const hours = diff / (1000 * 60 * 60);
    return hours > 5; // Mer än 5 timmar = varning (cron kör var 4:e timme)
  };

  const getScheduledTimes = () => {
    // Cron kör var 4:e timme: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
    return ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
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

  const triggerManualUpdate = async () => {
    setUpdating(true);
    setUpdateMessage(null);

    try {
      const response = await fetch(import.meta.env.BASE_URL + 'api/trigger-update.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setUpdateMessage({ type: 'success', text: 'Uppdatering startad. Det kan ta 1-2 minuter...' });
        trackManualUpdate(true);

        // Vänta lite och uppdatera status
        setTimeout(() => {
          loadStatus();
          loadHistory();
        }, 2000);

        // Uppdatera status var 5:e sekund tills vi ser en ny körning
        const checkInterval = setInterval(() => {
          loadStatus();
          loadHistory();
        }, 5000);

        // Stoppa efter 2 minuter
        setTimeout(() => {
          clearInterval(checkInterval);
          setUpdating(false);
        }, 120000);
      } else {
        setUpdateMessage({ type: 'error', text: data.error || 'Kunde inte starta uppdatering' });
        trackManualUpdate(false);
        setUpdating(false);
      }
    } catch (err) {
      setUpdateMessage({ type: 'error', text: 'Fel vid anrop till servern' });
      trackManualUpdate(false);
      trackError('manual_update');
      console.error(err);
      setUpdating(false);
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {getStatusBadge(status.status || 'success')}
                  <button
                    className="manual-update-btn"
                    onClick={triggerManualUpdate}
                    disabled={updating}
                    title="Uppdatera manuellt"
                    aria-label="Uppdatera events manuellt"
                  >
                    <RefreshIcon size={14} className={updating ? 'spinning' : ''} />
                  </button>
                </div>
              </div>
              {updateMessage && (
                <div className={`update-message ${updateMessage.type}`}>
                  {updateMessage.text}
                </div>
              )}
              <div className="status-info">
                <div className="status-row">
                  <span className="status-label">Starttid</span>
                  <span className="status-value">
                    {status.startTime ? formatDate(status.startTime) : formatDate(status.lastRun)}
                    {status.startTime && (
                      <span className="status-meta" style={{ marginLeft: '8px', fontSize: '0.9em', opacity: 0.7 }}>
                        ({getTimeSinceLastRun(status.startTime)})
                      </span>
                    )}
                  </span>
                </div>
                {status.endTime && status.startTime && (
                  <div className="status-row">
                    <span className="status-label">Sluttid</span>
                    <span className="status-value">{formatDate(status.endTime)}</span>
                  </div>
                )}
                {!status.endTime && status.lastRun && (
                  <div className="status-row">
                    <span className="status-label">Sluttid</span>
                    <span className="status-value">
                      {formatDate(status.lastRun)}
                      <span className="status-meta" style={{ marginLeft: '8px', fontSize: '0.9em', opacity: 0.7 }}>
                        ({getTimeSinceLastRun(status.lastRun)})
                      </span>
                    </span>
                  </div>
                )}
                {isLastRunTooOld(status.startTime || status.lastRun) && (
                  <div className="status-row" style={{ color: '#f59e0b' }}>
                    <span className="status-label">⚠ Varning</span>
                    <span className="status-value">Senaste körning är för gammal - kontrollera cron-jobb</span>
                  </div>
                )}
                {status.duration && (
                  <div className="status-row">
                    <span className="status-label">Varaktighet</span>
                    <span className="status-value">{formatDuration(status.duration)}</span>
                  </div>
                )}
                <div className="status-row">
                  <span className="status-label">Status</span>
                  <span className="status-value">
                    {status.status === 'success' && '✓ Lyckades utan fel'}
                    {status.status === 'warning' && '⚠ Lyckades med varningar'}
                    {status.status === 'error' && '✗ Misslyckades'}
                    {!status.status && 'Okänt'}
                  </span>
                </div>
              </div>
            </div>

            {/* Next Run Card */}
            <div className="status-card">
              <div className="status-header">
                <h2 className="status-title">Nästa körning</h2>
              </div>
              <div className="status-info">
                <div className="status-row">
                  <span className="status-label">Tidpunkt</span>
                  <span className="status-value">
                    {(() => {
                      const nextRun = getNextRun();
                      return (
                        <>
                          {nextRun.formatted}
                          <span className="status-meta" style={{ marginLeft: '8px', fontSize: '0.9em', opacity: 0.7 }}>
                            ({nextRun.relative})
                          </span>
                        </>
                      );
                    })()}
                  </span>
                </div>
                <div className="status-row">
                  <span className="status-label">Schemalagda tider</span>
                  <span className="status-value">{getScheduledTimes().join(', ')}</span>
                </div>
                <div className="status-row">
                  <span className="status-label">Cron-schema</span>
                  <span className="status-value" style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>0 */4 * * *</span>
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
              <div className="errors-timestamp">
                Senaste körning: {formatDate(status.lastRun)}
              </div>
              {status.errors && status.errors.length > 0 ? (
                status.errors.map((err, index) => (
                  <div key={index} className="error-item">
                    <div className="error-title">{err.title || 'Fel'}</div>
                    <div className="error-message">{err.message || err}</div>
                  </div>
                ))
              ) : (
                <div className="empty-state success">
                  ✓ Körningen lyckades utan fel eller varningar
                </div>
              )}
            </div>

            {/* Detailed Information Section */}
            {status.details && (
              <div className="changes-section">
                <h2 className="section-title">Detaljerad information</h2>
                <div className="status-info" style={{ marginTop: '1rem' }}>
                  {status.details.performance && (
                    <>
                      <div className="status-row">
                        <span className="status-label">Körtid</span>
                        <span className="status-value">{status.details.performance.durationFormatted}</span>
                      </div>
                      {status.details.performance.eventsPerSecond > 0 && (
                        <div className="status-row">
                          <span className="status-label">Hastighet</span>
                          <span className="status-value">{status.details.performance.eventsPerSecond} events/sekund</span>
                        </div>
                      )}
                    </>
                  )}
                  {status.details.scrapingStats && (
                    <>
                      <div className="status-row">
                        <span className="status-label">Totalt scrapade</span>
                        <span className="status-value">{status.details.scrapingStats.totalScraped} events</span>
                      </div>
                      <div className="status-row">
                        <span className="status-label">Efter deduplicering</span>
                        <span className="status-value">{status.details.scrapingStats.uniqueAfterDedup} events</span>
                      </div>
                      {status.details.scrapingStats.duplicatesRemoved > 0 && (
                        <div className="status-row">
                          <span className="status-label">Dubbletter borttagna</span>
                          <span className="status-value">{status.details.scrapingStats.duplicatesRemoved}</span>
                        </div>
                      )}
                    </>
                  )}
                  {status.details.arenaBreakdown && Object.keys(status.details.arenaBreakdown).length > 0 && (
                    <div className="status-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span className="status-label">Events per arena</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%' }}>
                        {Object.entries(status.details.arenaBreakdown).map(([arena, count]) => (
                          <div key={arena} style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <span>{arena}</span>
                            <span>{count} events</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* History Section */}
            <div className="changes-section">
              <h2 className="section-title">
                Körningshistorik
                {history && history.totalRuns && (
                  <span style={{ fontSize: '0.9em', fontWeight: 'normal', marginLeft: '0.5rem', opacity: 0.7 }}>
                    ({history.totalRuns} körningar)
                  </span>
                )}
              </h2>
              {historyLoading && (
                <div className="empty-state">Laddar historik...</div>
              )}
              {!historyLoading && history && history.runs && history.runs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {history.runs.slice().reverse().slice(0, 10).map((run, index) => (
                    <div key={run.id || index} className="change-item" style={{
                      borderLeft: `4px solid ${
                        run.status === 'success' ? '#10b981' :
                        run.status === 'warning' ? '#f59e0b' :
                        '#ef4444'
                      }`,
                      padding: '1rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '4px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                            {formatDate(run.startTime)}
                          </div>
                          <div style={{ fontSize: '0.85em', opacity: 0.7 }}>
                            {getTimeSinceLastRun(run.startTime)}
                          </div>
                        </div>
                        {getStatusBadge(run.status)}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.9em' }}>
                        <div>
                          <span style={{ opacity: 0.7 }}>Varaktighet: </span>
                          <span>{formatDuration(run.duration)}</span>
                        </div>
                        <div>
                          <span style={{ opacity: 0.7 }}>Events: </span>
                          <span>{run.eventCount}</span>
                        </div>
                        <div>
                          <span style={{ opacity: 0.7 }}>Arenor: </span>
                          <span>{run.arenaCount}</span>
                        </div>
                        {run.changes && (
                          <>
                            {run.changes.added > 0 && (
                              <div>
                                <span style={{ opacity: 0.7 }}>Nya: </span>
                                <span style={{ color: '#10b981' }}>+{run.changes.added}</span>
                              </div>
                            )}
                            {run.changes.updated > 0 && (
                              <div>
                                <span style={{ opacity: 0.7 }}>Uppdaterade: </span>
                                <span style={{ color: '#3b82f6' }}>↻{run.changes.updated}</span>
                              </div>
                            )}
                            {run.changes.removed > 0 && (
                              <div>
                                <span style={{ opacity: 0.7 }}>Borttagna: </span>
                                <span style={{ color: '#ef4444' }}>−{run.changes.removed}</span>
                              </div>
                            )}
                          </>
                        )}
                        {run.errorCount > 0 && (
                          <div>
                            <span style={{ opacity: 0.7 }}>Fel: </span>
                            <span style={{ color: '#ef4444' }}>{run.errorCount}</span>
                          </div>
                        )}
                      </div>
                      {run.errors && run.errors.length > 0 && (
                        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          {run.errors.slice(0, 3).map((err, errIndex) => (
                            <div key={errIndex} style={{ fontSize: '0.85em', marginTop: '0.25rem', opacity: 0.8 }}>
                              <strong>{err.title || 'Fel'}:</strong> {err.message || err}
                            </div>
                          ))}
                          {run.errors.length > 3 && (
                            <div style={{ fontSize: '0.85em', marginTop: '0.25rem', opacity: 0.6 }}>
                              +{run.errors.length - 3} fler fel
                            </div>
                          )}
                        </div>
                      )}
                      {run.details && run.details.performance && (
                        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.85em', opacity: 0.7 }}>
                          {run.details.performance.durationFormatted} • {run.details.performance.eventsPerSecond} events/sek
                        </div>
                      )}
                    </div>
                  ))}
                  {history.runs.length > 10 && (
                    <div style={{ textAlign: 'center', marginTop: '1rem', opacity: 0.6, fontSize: '0.9em' }}>
                      Visar 10 senaste körningarna av {history.runs.length} totalt
                    </div>
                  )}
                </div>
              ) : !historyLoading && (
                <div className="empty-state">
                  Ingen körningshistorik tillgänglig ännu
                </div>
              )}
            </div>
          </>
        )}
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

export default DashboardPage;


