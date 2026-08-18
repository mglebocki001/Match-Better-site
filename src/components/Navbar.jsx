import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar({ user, onLogout, onOpenAuth }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (sectionId) => {
    setMobileOpen(false);
    if (location.pathname !== '/') {
      navigate('/#' + sectionId);
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleBlogClick = () => {
    setMobileOpen(false);
    navigate('/blog');
  };

  return (
    <header style={styles.header}>
      <div style={styles.navContainer}>
        {/* LOGO */}
        <div style={styles.logoWrapper} onClick={() => { window.location.href = '/'; }}>
          <img
            src="/NAZWA.png"
            alt="MatchBetter"
            style={styles.logoImg}
          />
        </div>

        {/* NAWIGACJA DESKTOP */}
        <nav style={styles.desktopNav}>
          {/* LINKI SEKCJI - PO LEWEJ STRONIE NAWIGACJI */}
          <div style={styles.leftNavGroup}>
            <button onClick={() => handleNavClick('jak-dziala')} style={styles.navLink}>Jak to działa</button>
            <button onClick={() => handleNavClick('korzysci')} style={styles.navLink}>Korzyści</button>
            <button onClick={() => handleNavClick('cennik')} style={styles.navLink}>Cennik</button>
            <button onClick={() => handleNavClick('faq')} style={styles.navLink}>FAQ</button>
          </div>

          {/* BLOG - PO PRAWEJ STRONIE NAWIGACJI */}
          <button onClick={handleBlogClick} style={{...styles.navLink, color: '#FF2E93', fontWeight: 'bold'}}>Blog</button>
        </nav>

        {/* LOGOWANIE / UŻYTKOWNIK */}
        <div style={styles.authWrapper}>
          {user ? (
            <div style={styles.userMenu}>
              {user.photoURL && (
                <img src={user.photoURL} alt="Avatar" style={styles.avatar} />
              )}
              <span style={styles.userName}>
                {user.displayName || user.email?.split('@')[0]}
              </span>
              <button onClick={onLogout} style={styles.secBtn}>Wyloguj</button>
            </div>
          ) : (
            <div style={styles.authBtns}>
              <button onClick={() => onOpenAuth('login')} style={styles.secBtn}>Zaloguj się</button>
              <button onClick={() => onOpenAuth('register')} style={styles.priBtn}>Utwórz konto</button>
            </div>
          )}

          {/* HAMBURGER BUTTON */}
          <button onClick={() => setMobileOpen(!mobileOpen)} style={styles.hamburgerBtn} aria-label="Menu">
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {mobileOpen && (
        <div style={styles.mobileDropdown} className="fade-in">
          <button onClick={() => handleNavClick('jak-dziala')} style={styles.mobileNavLink}>Jak to działa</button>
          <button onClick={() => handleNavClick('korzysci')} style={styles.mobileNavLink}>Korzyści</button>
          <button onClick={() => handleNavClick('cennik')} style={styles.mobileNavLink}>Cennik</button>
          <button onClick={() => handleNavClick('faq')} style={styles.mobileNavLink}>FAQ</button>
          <button onClick={handleBlogClick} style={{...styles.mobileNavLink, color: '#FF2E93'}}>Blog</button>
          <div style={styles.mobileAuthRow}>
            {user ? (
              <button onClick={onLogout} style={{...styles.secBtn, width: '100%'}}>Wyloguj się</button>
            ) : (
              <>
                <button onClick={() => { setMobileOpen(false); onOpenAuth('login'); }} style={{...styles.secBtn, width: '100%'}}>Zaloguj się</button>
                <button onClick={() => { setMobileOpen(false); onOpenAuth('register'); }} style={{...styles.priBtn, width: '100%'}}>Utwórz konto</button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

const styles = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: 'rgba(11, 15, 23, 0.85)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid #1F2937'
  },
  navContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '14px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '32px'
  },
  logoWrapper: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  },
  logoImg: {
    height: '38px',
    width: 'auto',
    maxWidth: '200px',
    objectFit: 'contain'
  },
  desktopNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1, // Rozciąga nawigację na całą dostępną przestrzeń
    margin: '0 20px'
  },
  leftNavGroup: {
    display: 'flex',
    gap: '24px',
    alignItems: 'center'
  },
  navLink: {
    background: 'none',
    border: 'none',
    color: '#D1D5DB',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'color 0.2s ease',
    padding: '6px 0'
  },
  authWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '1px solid #FF2E93'
  },
  userName: {
    fontSize: '14px',
    color: '#E5E7EB',
    maxWidth: '120px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  authBtns: {
    display: 'flex',
    gap: '10px'
  },
  secBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #374151',
    color: '#FFF',
    padding: '8px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px'
  },
  priBtn: {
    background: 'linear-gradient(90deg, #FF2E93, #8A2BE2)',
    border: 'none',
    color: '#FFF',
    padding: '8px 18px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
    boxShadow: '0 4px 14px rgba(255, 46, 147, 0.35)'
  },
  hamburgerBtn: {
    display: 'none',
    background: 'none',
    border: 'none',
    color: '#FFF',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '4px'
  },
  mobileDropdown: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#111827',
    padding: '20px 24px',
    borderBottom: '1px solid #1F2937',
    gap: '16px'
  },
  mobileNavLink: {
    background: 'none',
    border: 'none',
    color: '#FFF',
    textAlign: 'left',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  mobileAuthRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '10px'
  }
};