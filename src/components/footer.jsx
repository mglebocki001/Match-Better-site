import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Footer({ onOpenModal }) {
  const navigate = useNavigate();

  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        
        {/* LEWA STRONA: Logo, Opis, Copyright */}
        <div style={styles.leftSection}>
          <img 
            src="/NAZWA.png" 
            alt="MatchBetter" 
            style={styles.logo} 
          />
          <p style={styles.desc}>
            Inteligentna analiza Twojego profilu w aplikacjach randkowych. Przestań zgadywać, zacznij randkować lepiej.
          </p>
          <span style={styles.copyright}>
            © 2026 MatchBetter. Wszelkie prawa zastrzeżone.
          </span>
        </div>

        {/* PRAWA STRONA: 2 Kolumny obok siebie */}
        <div style={styles.rightSection}>
          {/* Kolumna: Narzędzia i zasoby */}
          <div style={styles.linksCol}>
            <h4 style={styles.heading}>Narzędzia i zasoby</h4>
            <button onClick={() => navigate('/blog')} style={styles.linkBtn}>Blog</button>
            <button
              onClick={() => {
                navigate('/');
                setTimeout(() => window.scrollTo({ top: 0, behavior: 'auto' }), 0);
              }}
              style={styles.linkBtn}
            >
              Strona Główna
            </button>
            <button 
              onClick={() => { 
                navigate('/'); 
                setTimeout(() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }), 100); 
              }} 
              style={styles.linkBtn}
            >
              FAQ
            </button>
          </div>

          {/* Kolumna: Prawne */}
          <div style={styles.linksCol}>
            <h4 style={styles.heading}>Prawne</h4>
            <button onClick={() => onOpenModal('terms')} style={styles.linkBtn}>Regulamin</button>
            <button onClick={() => onOpenModal('privacy')} style={styles.linkBtn}>Polityka prywatności</button>
          </div>
        </div>

      </div>
    </footer>
  );
}

const styles = {
  footer: {
    backgroundColor: '#070A0F', // Zachowujemy Twój ciemny motyw serwisu
    borderTop: '1px solid #1F2937',
    padding: '60px 24px 60px 24px',
    marginTop: 'auto'
  },
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '60px',
    flexWrap: 'wrap', // Zapewnia responsywność na telefonach
    alignItems: 'flex-start'
  },
  leftSection: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '480px',
    flex: '1 1 350px'
  },
  logo: {
    width: '180px',
    height: 'auto',
    display: 'block',
    marginBottom: '20px'
  },
  desc: {
    color: '#9CA3AF',
    fontSize: '14px',
    lineHeight: 1.6,
    margin: '0 0 24px 0'
  },
  copyright: {
    color: '#6B7280',
    fontSize: '13px'
  },
  rightSection: {
    display: 'flex',
    gap: '80px', // Odstęp między dwiema kolumnami po prawej stronie
    flexWrap: 'wrap'
  },
  linksCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '12px'
  },
  heading: {
    color: '#FFF',
    fontSize: '15px',
    fontWeight: '600',
    margin: '0 0 4px 0'
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#9CA3AF',
    textAlign: 'left',
    fontSize: '14px',
    cursor: 'pointer',
    padding: 0,
    transition: 'color 0.2s ease'
  }
};