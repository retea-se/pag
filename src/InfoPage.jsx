import { InfoIcon, RssIcon } from './components/Icons';
import { usePageViews } from './hooks/usePageViews';
import { trackNavClick } from './hooks/useMatomo';
import './App.css';

function InfoPage() {
  const pageViews = usePageViews();
  const baseUrl = window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <div className="header-brand">
            <div className="logo">
              <span className="logo-text">På G</span>
            </div>
            <div className="header-title">
              <h1>Information</h1>
              <span className="header-subtitle">Om På G i Globenområdet</span>
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
            På G i Globenområdet samlar alla evenemang från arenorna i Globenområdet på ett ställe.
            Här hittar du konserter, hockeymatcher, shower och andra evenemang på Avicii Arena, 3Arena, Hovet och Annexet.
          </p>
        </div>

        <div className="rss-feeds">
          <a href="#rss" className="rss-feed-card" style={{ textDecoration: 'none', color: 'inherit' }} onClick={() => trackNavClick('rss')}>
            <div className="rss-feed-icon">
              <RssIcon size={24} />
            </div>
            <div className="rss-feed-content">
              <h2>RSS-flöden</h2>
              <p>Prenumerera på evenemang via RSS för att få uppdateringar direkt i din RSS-läsare.</p>
            </div>
          </a>

          <a href="#dashboard" className="rss-feed-card" style={{ textDecoration: 'none', color: 'inherit' }} onClick={() => trackNavClick('dashboard')}>
            <div className="rss-feed-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent)' }}>
              <InfoIcon size={24} />
            </div>
            <div className="rss-feed-content">
              <h2>Cron Dashboard</h2>
              <p>Se status för automatiska uppdateringar och vad som ändrats senast.</p>
            </div>
          </a>
        </div>

        <div className="rss-help">
          <h3>Vanliga frågor</h3>
          <ol>
            <li>
              <strong>Hur ofta uppdateras evenemangen?</strong><br />
              Evenemangen uppdateras automatiskt var 4:e timme (00:00, 04:00, 08:00, 12:00, 16:00, 20:00).
              Du kan också uppdatera manuellt genom att klicka på uppdateringsknappen i headern.
            </li>
            <li>
              <strong>Var kommer datan ifrån?</strong><br />
              All data kommer från Stockholm Live och arenornas officiella webbplatser:
              Avicii Arena, 3Arena, Hovet och Annexet.
            </li>
            <li>
              <strong>Hur fungerar RSS-flödena?</strong><br />
              RSS-flödena låter dig prenumerera på evenemang i din RSS-läsare. Du kan välja mellan
              flöden för idag, imorgon, denna vecka eller alla kommande evenemang.
            </li>
            <li>
              <strong>Vilka arenor ingår?</strong><br />
              Avicii Arena (tidigare Globen), 3Arena, Hovet och Annexet - alla i Globenområdet i Stockholm.
            </li>
            <li>
              <strong>Vad är Cron Dashboard?</strong><br />
              Cron Dashboard visar status för de automatiska uppdateringarna, när senaste synkroniseringen
              kördes och vad som ändrades. Detta är öppet för alla att se och innehåller inga känsliga uppgifter.
            </li>
            <li>
              <strong>Hur kan jag kontakta er?</strong><br />
              Projektet är öppet källkod och finns på GitHub. Se länken i sidfoten för mer information.
            </li>
          </ol>
        </div>

        <div className="rss-help" style={{ marginTop: '1.5rem' }}>
          <h3>Om projektet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.6', marginTop: '0.5rem' }}>
            På G i Globenområdet är ett öppet källkodsprojekt som samlar evenemang från arenorna i Globenområdet
            på ett enkelt och överskådligt sätt. Projektet är byggt med React och Vite, och använder data från
            Stockholm Live och arenornas officiella webbplatser.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.6', marginTop: '0.5rem' }}>
            All data uppdateras automatiskt via cron-jobb och är tillgänglig via webbplatsen, RSS-flöden och
            ett öppet API. Projektet är designat för att vara snabbt, tillgängligt och SEO-optimerat.
          </p>
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

export default InfoPage;



