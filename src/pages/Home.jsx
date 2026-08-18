import React, { useState } from 'react';

// ─────────────────────────────────────────────────────────────
// Design tokens (MatchBetter - dark, premium SaaS)
// ─────────────────────────────────────────────────────────────
const c = {
  bg: '#0B0B10',
  bgAlt: '#111118',
  card: '#16161E',
  cardHi: '#1A1A23',
  text: '#F7F7FA',
  textSec: '#A5A5B2',
  textMuted: '#72727E',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.12)',
  gradient: 'linear-gradient(90deg, #7C3AED 0%, #C026D3 55%, #FF3D8D 100%)',
  green: '#22C55E',
  orange: '#F5A524',
  red: '#F5455C',
};

const FONT = "'Manrope', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export default function Home({
  user,
  files,
  previews,
  loading,
  loadingMsgIndex,
  loadingMessages,
  result,
  error,
  termsAccepted,
  setTermsAccepted,
  termsError,
  onFileChange,
  onRemoveFile,
  onAudit,
  onLoadDemo,
  onResetAudit,
  onOpenModal
}) {
  // Stan rozwijanego FAQ (Accordion)
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // Stan rozwijanych kart w raporcie (zdjęcia i poprawki) — domyślnie
  // zwinięte, żeby raport był zwięzły; pełne dane dostępne jednym klikiem.
  const [openPhotoTags, setOpenPhotoTags] = useState(() => new Set());
  const [openImprovements, setOpenImprovements] = useState(() => new Set());

  const togglePhotoTags = (photoIndex) => {
    setOpenPhotoTags((prev) => {
      const next = new Set(prev);
      next.has(photoIndex) ? next.delete(photoIndex) : next.add(photoIndex);
      return next;
    });
  };

  const toggleImprovement = (index) => {
    setOpenImprovements((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const scrollToAudit = () => {
    document.getElementById('audit-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Obsługuje zarówno nowy, zagnieżdżony kształt raportu
  // ({ overview: {...}, photo_by_photo: [...], bio: {...} }),
  // jak i starszy, płaski kształt — dla wstecznej kompatybilności.
  const reportData = result?.data || result || {};
  const overview = reportData.overview || reportData;
  const summary = overview.overall_action_plan_summary || reportData.summary || reportData.podsumowanie;
  const greatThing = overview.one_great_thing || reportData.zalety;
  const improvements = overview.top_5_improvements || reportData.improvements || [];
  const photoByPhoto = Array.isArray(reportData.photo_by_photo) ? reportData.photo_by_photo : [];
  const bioResult = reportData.bio || null;
  const overallScore = typeof reportData.overall_score === 'number' ? reportData.overall_score : null;

  const scoreColor = (score) => {
    if (score === null) return c.textMuted;
    if (score >= 70) return c.green;
    if (score >= 45) return c.orange;
    return c.red;
  };

  const faqItems = [
    {
      q: 'Czy MatchBetter naprawdę może pomóc mi zdobywać więcej matchy?',
      a: 'Nie obiecujemy magii. Pokazujemy konkretne błędy w Twoim profilu - złą kolejność zdjęć, słabe bio, brakujące kadry - i mówimy, co z tym zrobić. Lepsza prezentacja realnie zwiększa Twoje szanse.'
    },
    {
      q: 'A co jeśli problemem nie jest mój profil, tylko mój wygląd?',
      a: 'W większości przypadków to nie wygląd jest problemem, tylko sposób jego pokazania. Złe światło, przypadkowa kolejność czy brak kontekstu potrafią zaniżyć nawet dobre zdjęcia. Sprawdzimy, co da się poprawić bez zmieniania Ciebie.'
    },
    {
      q: 'Mam prawie zero matchy. Czy analiza ma w ogóle sens?',
      a: 'Tak - to właśnie wtedy analiza daje najwięcej. Zamiast zgadywać co jest nie tak, dostajesz konkretną listę rzeczy do poprawy w kolejności ważności.'
    },
    {
      q: 'Skąd mam wiedzieć, że nie dostanę takich samych porad jak każdy?',
      a: 'Analiza opiera się na Twoich zdjęciach i Twoim bio, nie na gotowym szablonie. Rekomendacje dotyczą konkretnie tego, co przesłałeś.'
    },

    {
      q: 'Czy muszę robić profesjonalną sesję zdjęciową?',
      a: 'Nie. Najpierw sprawdzamy to, co już masz. Sesja zdjęciowa to opcja, nie wymóg - i warto ją rozważyć dopiero, gdy wiesz, jakich zdjęć konkretnie potrzebujesz.'
    },
    {
      q: 'Czy moje zdjęcia są bezpieczne?',
      a: 'Tak. Twoje zdjęcia są wykorzystywane wyłącznie do przeprowadzenia analizy profilu. Wszystkie przesłane pliki są automatycznie usuwane po zakończeniu analizy i nie są publicznie udostępniane ani pokazywane innym użytkownikom.'
    },

  ];

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

        .mb-hero-grid { display: grid; grid-template-columns: 1fr; gap: 48px; align-items: center; }
        .mb-split-grid { display: grid; grid-template-columns: 1fr; gap: 40px; align-items: center; }
        .mb-compare-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; align-items: stretch; }
        .mb-bio-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
        .mb-authenticity-grid { display: grid; grid-template-columns: 1fr; gap: 32px; }
        @media (min-width: 900px) {
          .mb-hero-grid { grid-template-columns: 55% 45%; gap: 40px; }
          .mb-split-grid { grid-template-columns: 1fr 1fr; gap: 56px; }
          .mb-bio-grid { grid-template-columns: 1fr 1fr; }
          .mb-authenticity-grid { grid-template-columns: 1fr 1fr; gap: 60px; }
        }
        .mb-btn:focus-visible, .mb-link:focus-visible, .mb-faq-q:focus-visible {
          outline: 2px solid #C026D3;
          outline-offset: 2px;
        }
        .mb-btn { transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease, border-color 0.2s ease; }
        .mb-btn:hover { transform: translateY(-1px); }
        .mb-card-hover { transition: border-color 0.25s ease, transform 0.25s ease; }
        .mb-card-hover:hover { border-color: ${c.borderStrong}; }
        @media (prefers-reduced-motion: reduce) {
          .mb-btn, .mb-card-hover { transition: none !important; }
          .mb-btn:hover { transform: none !important; }
        }
      `}</style>

      {/* 1. HERO */}
      <section style={styles.hero}>
        <div className="mb-hero-grid">
          <div>
            <div style={styles.badge}>✦ AI do analizy Twojego profilu randkowego</div>
            <h1 style={styles.heroTitle}>
              Tinder potrafi być naprawdę <span style={styles.gradientText}>ciężki</span>.
            </h1>
            <p style={styles.heroLead}>
              Zwłaszcza kiedy jesteś zwykłym młodym facetem i próbujesz po prostu kogoś poznać.
            </p>
            <p style={styles.heroSubtitle}>
              Dostajesz mało matchy, nie wiesz co poprawić, więc zaczynasz zgadywać. MatchBetter analizuje Twój profil i pokazuje Ci konkretne rzeczy, które możesz zmienić.
            </p>
            <div style={styles.heroCtaRow}>
              <button className="mb-btn" onClick={scrollToAudit} style={styles.primaryCta}>
                Sprawdź mój profil →
              </button>
            </div>
            <p style={styles.finePrint}>Tinder • Badoo • Bumble • Hinge</p>
          </div>

          <div style={styles.heroVisual} aria-hidden="true">
            {/* Kontener ramki telefonu ogranicza rozmiar zdjęcia */}
            <div style={styles.phoneMockup}>
              <div style={styles.phoneScreen}>
                <img
                  src="/przykład.png"
                  alt="Przykładowy profil"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain', // Skalowanie zdjęcia, by było mniejsze i w całości widoczne
                    display: 'block'
                  }}
                />
              </div>
            </div>
            <div style={{ ...styles.floatCard, top: '4%', left: '-6%' }}>
              <span style={styles.floatLabel}>Pierwsze zdjęcie</span>
              <span style={styles.floatScore(c.green)}>82/100</span>
            </div>

            <div style={{ ...styles.floatCard, top: '40%', right: '-8%' }}>
              <span style={styles.floatLabel}>Bio</span>
              <span style={styles.floatScore(c.orange)}>54/100</span>
            </div>

            <div style={{ ...styles.floatCard, bottom: '20%', left: '-4%' }}>
              <span style={styles.floatLabel}>Najlepsze zdjęcie na #1</span>
            </div>

            <div style={{ ...styles.floatCard, bottom: '-6%', right: '2%' }}>
              <span style={styles.floatLabel}>Profil</span>
              <span style={styles.floatScore(c.orange)}>71/100</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROBLEM */}
      <section
        style={{
          ...styles.section,
          textAlign: 'center',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <div style={{ maxWidth: '760px', width: '100%' }}>
          <h2 style={styles.h2}>
            Jeśli masz mało matchy, nie musi to oznaczać, że coś jest z Tobą nie tak.
          </h2>
          <p style={styles.bodyText}>
            Aplikacja nie pokazuje od razu Twojego charakteru, humoru ani tego, jaki jesteś na żywo.
            Na początku druga osoba widzi tylko kilka zdjęć, kilka informacji i krótkie bio.
            Dlatego dobry facet może mieć profil, który po prostu słabo go prezentuje.
          </p>
        </div>
      </section>

      {/* 3. STATYSTYKI */}
      <section style={{ ...styles.section, backgroundColor: c.bgAlt }}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.h2}>I tak facetom na aplikacjach często jest trudniej.</h2>
        </div>
        <p style={{ ...styles.bodyText, textAlign: 'center', maxWidth: '640px', margin: '32px auto 0' }}>
          Nie możesz zmienić konkurencji. Możesz zmienić to, co zobaczy osoba trafiająca na Twój profil.
        </p>
        <div style={{ textAlign: 'center', marginTop: '28px' }}>
          <button className="mb-btn" onClick={scrollToAudit} style={styles.primaryCta}>
            Zobacz, co możesz poprawić
          </button>
        </div>
      </section>

      {/* 4. KOJARZYSZ TO? */}
      <section style={styles.section}>
        <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={styles.h2}>Kojarzysz to?</h2>

          <div
            style={{
              ...styles.bubbleStack,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '12px 24px',
              marginTop: '28px',
              alignItems: 'stretch'
            }}
          >
            <div
              style={{
                ...styles.bubble,
                width: '100%',
                justifySelf: 'stretch',
                alignSelf: 'stretch',
                maxWidth: '100%'
              }}
            >
              „Może zmienię pierwsze zdjęcie…”
            </div>

            <div
              style={{
                ...styles.bubble,
                width: '100%',
                justifySelf: 'stretch',
                alignSelf: 'stretch',
                maxWidth: '100%'
              }}
            >
              „Może usunę bio…”
            </div>

            <div
              style={{
                ...styles.bubble,
                width: '100%',
                justifySelf: 'stretch',
                alignSelf: 'stretch',
                maxWidth: '100%'
              }}
            >
              „Może kupię Boosta…”
            </div>

            <div
              style={{
                ...styles.bubble,
                width: '100%',
                justifySelf: 'stretch',
                alignSelf: 'stretch',
                maxWidth: '100%'
              }}
            >
              „Może algorytm mnie nie pokazuje…”
            </div>
          </div>

          <p
            style={{
              ...styles.bodyText,
              fontSize: '20px',
              fontWeight: 700,
              color: c.text,
              marginTop: '36px'
            }}
          >
            Problem w tym, że nadal <span style={styles.gradientText}>zgadujesz</span>.
          </p>

          <p style={styles.bodyText}>
            MatchBetter ma dać Ci konkretną odpowiedź.
          </p>
        </div>
      </section>

      {/* 5. SEKCJA AUDYTU (LOGIKA I INTERFEJS WGRYWANIA ZDJĘĆ) */}
      <section id="audit-section" style={styles.section}>
        <div className="glass-card" style={styles.appBox}>
          <h2 style={styles.h3}>Wgraj swoje materiały</h2>
          <p style={styles.bodyTextMuted}>Wybierz od 1 do 6 zrzutów ekranu ze swojego profilu (max 10MB na plik).</p>

          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onFileChange}
            id="fileInput"
            style={{ display: 'none' }}
          />

          <label htmlFor="fileInput" style={styles.uploadArea}>
            <span style={styles.uploadIcon}>＋</span>
            <p style={styles.uploadText}>Kliknij lub przeciągnij zdjęcia tutaj (max 6)</p>
          </label>

          {/* PODGLĄD ZDJĘĆ */}
          {previews.length > 0 && (
            <div style={styles.previewGrid}>
              {previews.map((src, index) => (
                <div key={index} style={styles.previewCard}>
                  <img src={src} alt={`Podgląd ${index + 1}`} style={styles.previewImg} />
                  <button
                    onClick={() => onRemoveFile(index)}
                    style={styles.removeImgBtn}
                    title="Usuń zdjęcie"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Checkbox Zgody RODO / Regulamin */}
          <div style={styles.consentBlock}>
            <label style={styles.consentLabel}>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                style={styles.checkbox}
              />
              <span>
                Akceptuję <button onClick={() => onOpenModal('terms')} style={styles.inlineLink}>Regulamin</button> oraz{' '}
                <button onClick={() => onOpenModal('privacy')} style={styles.inlineLink}>Politykę Prywatności</button>. Wyrażam zgodę na przetwarzanie wgranych zdjęć w celu wykonania analizy AI.
              </span>
            </label>

            {termsError && (
              <span style={styles.termsErrorText}>
                Musisz zaakceptować regulamin i politykę prywatności, aby kontynuować.
              </span>
            )}

            <span style={styles.privacyNote}>
              Twoje zdjęcia są przetwarzane w sposób bezpieczny i automatycznie usuwane po zakończeniu analizy.
            </span>
          </div>

          {/* PRZYCISK URUCHOMIENIA AUDYTU */}
          <button
            className="mb-btn"
            onClick={onAudit}
            disabled={loading || files.length === 0}
            style={{
              ...styles.submitBtn,
              opacity: loading || files.length === 0 ? 0.5 : 1,
              cursor: loading || files.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            {loading
              ? 'Przetwarzanie…'
              : user
                ? 'Rozpocznij audyt'
                : 'Zaloguj się, aby przeanalizować profil'}
          </button>

          {/* DEMO REPORT BUTTON */}
          {!result && !loading && (
            <button
              onClick={onLoadDemo}
              style={{ ...styles.secondaryBtn, width: '100%', marginTop: 10, fontSize: 13 }}
            >
              Zobacz przykładowy raport (demo)
            </button>
          )}

          {error && <div style={styles.errorBox}>{error}</div>}

          {/* ANIMOWANY EKRAN ŁADOWANIA DLA AI */}
          {loading && (
            <div style={styles.loadingContainer}>
              <div className="spinner" />
              <p key={loadingMsgIndex} className="fade-in" style={styles.loadingText}>
                {loadingMessages[loadingMsgIndex]}
              </p>
            </div>
          )}

          {/* WYNIK AUDYTU */}
          {result && !loading && (
            <div style={styles.resultContainer} className="fade-in">
              <div style={styles.reportHeader}>
                <div>
                  <h3 style={styles.resultTitle}>Raport audytu profilu</h3>
                  <p style={styles.resultSubtitle}>Wnioski i rekomendacje wygenerowane przez AI.</p>
                </div>
                {overallScore !== null && (
                  <div style={{ ...styles.scoreBadge, borderColor: scoreColor(overallScore) }}>
                    <span style={{ ...styles.scoreBadgeValue, color: scoreColor(overallScore) }}>
                      {Math.round(overallScore)}
                    </span>
                    <span style={styles.scoreBadgeMax}>/100</span>
                  </div>
                )}
              </div>

              {/* OCENA POSZCZEGÓLNYCH ZDJĘĆ — jak w sekcji marketingowej wyżej,
                  ale to już PRAWDZIWE zdjęcia i prawdziwa ocena użytkownika. */}
              {photoByPhoto.length > 0 && (
                <div style={{ marginBottom: 26 }}>
                  <h4 style={styles.improvementsTitle}>Ocena zdjęć</h4>
                  <div style={styles.analysisPhotoRow}>
                    {photoByPhoto.map((photo) => {
                      const color = photo.action === 'Usuń' ? c.red : photo.action === 'Zostaw' ? c.green : c.orange;
                      const tags = Array.isArray(photo.tags) ? photo.tags : [];
                      // Pierwszy pokazany tag musi być spójny z akcją:
                      // „Usuń” -> zawsze pokazujemy wadę (⚠, czerwony),
                      // „Zostaw” -> zawsze pokazujemy zaletę (✓, zielony),
                      // „Podobne” -> priorytet dla wady, tak jak dotychczas.
                      const topTag =
                        photo.action === 'Zostaw'
                          ? tags.find((t) => t.is_positive) || tags[0] || null
                          : tags.find((t) => !t.is_positive) || tags[0] || null;
                      const restTags = topTag ? tags.filter((t) => t !== topTag) : [];
                      const isOpen = openPhotoTags.has(photo.photo_index);
                      const previewSrc = previews[photo.photo_index - 1];

                      return (
                        <div key={photo.photo_index} style={styles.analysisPhotoCell}>
                          {previewSrc ? (
                            <img
                              src={previewSrc}
                              alt={`Zdjęcie ${photo.photo_index}`}
                              style={{ ...styles.analysisPhotoBox, objectFit: 'cover', display: 'block' }}
                            />
                          ) : (
                            <div style={styles.analysisPhotoBox} />
                          )}

                          <span style={{ ...styles.analysisStatus, color }}>{photo.action}</span>

                          {topTag && (
                            <span
                              style={{
                                fontSize: '11px',
                                // Kolor tagu zależy WYŁĄCZNIE od tego, czy jest
                                // to zaleta czy wada — nigdy od koloru akcji.
                                // Dzięki temu ⚠ jest zawsze czerwony, a ✓ zawsze zielony.
                                color: topTag.is_positive ? c.green : c.red,
                                textAlign: 'center',
                                fontWeight: 600,
                                lineHeight: 1.4
                              }}
                            >
                              {topTag.is_positive ? '✓' : '⚠'} {topTag.label}
                            </span>
                          )}

                          {restTags.length > 0 && (
                            <button
                              type="button"
                              onClick={() => togglePhotoTags(photo.photo_index)}
                              style={styles.moreTagsBtn}
                            >
                              {isOpen ? 'Zwiń' : `+${restTags.length} więcej`}
                            </button>
                          )}

                          {isOpen && (
                            <div style={styles.tagsExpanded}>
                              {restTags.map((t, ti) => (
                                <span
                                  key={ti}
                                  style={{ fontSize: '11px', color: t.is_positive ? c.green : c.red, lineHeight: 1.4 }}
                                >
                                  {t.is_positive ? '✓' : '⚠'} {t.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(summary || greatThing) && (
                <div style={styles.overviewGrid}>
                  {summary && (
                    <div style={styles.summaryBox}>
                      <h4 style={styles.summaryTitle}>Plan działania</h4>
                      <p style={styles.summaryText}>{summary}</p>
                    </div>
                  )}

                  {greatThing && (
                    <div style={{ ...styles.summaryBox, borderLeft: `4px solid ${c.green}` }}>
                      <h4 style={{ ...styles.summaryTitle, color: c.green }}>Największy atut</h4>
                      <p style={styles.summaryText}>{greatThing}</p>
                    </div>
                  )}
                </div>
              )}

              {/* PROPOZYCJA POPRAWIONEGO BIO */}
              {bioResult && (bioResult.original_bio || bioResult.improved_bio) && (
                <div style={{ marginTop: 26 }}>
                  <h4 style={styles.improvementsTitle}>Propozycja bio</h4>
                  <div style={styles.bioResultGrid}>
                    <div style={styles.bioCard}>
                      <span style={styles.bioLabel}>Twoje obecne bio</span>
                      <p style={styles.bioText}>{bioResult.original_bio || 'Profil nie zawierał opisu.'}</p>
                    </div>
                    <div style={{ ...styles.bioCard, ...styles.bioCardHighlight }}>
                      <span style={{ ...styles.bioLabel, color: '#E9A6FF' }}>Propozycja MatchBetter</span>
                      <p style={styles.bioText}>{bioResult.improved_bio}</p>
                      {bioResult.why_better && (
                        <p style={styles.bioWhyBetter}>{bioResult.why_better}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* KLUCZOWE POPRAWKI — zwinięte domyślnie, rozwijane pojedynczym
                  kliknięciem: zwięzły widok, pełna treść na żądanie. */}
              {Array.isArray(improvements) && improvements.length > 0 && (
                <div style={{ marginTop: 26 }}>
                  <h4 style={styles.improvementsTitle}>Kluczowe rzeczy do poprawy</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {improvements.map((item, index) => {
                      const isOpen = openImprovements.has(index);
                      const title = typeof item === 'object' ? item.title || '' : item;
                      return (
                        <div
                          key={index}
                          style={styles.improvementCard}
                          onClick={() => toggleImprovement(index)}
                        >
                          <div style={styles.improvementRow}>
                            <h5 style={styles.improvementHeading}>
                              <span style={styles.improvementBadge}>{index + 1}</span>
                              {title}
                            </h5>
                            <span style={styles.chevron}>{isOpen ? '–' : '+'}</span>
                          </div>

                          {isOpen && (
                            <div style={{ marginTop: 10 }}>
                              {item.why_it_matters && (
                                <p style={styles.improvementBody}>{item.why_it_matters}</p>
                              )}
                              {item.quick_fix && (
                                <p style={{ ...styles.improvementBody, color: '#A7F3D0', marginBottom: 0 }}>
                                  💡 {item.quick_fix}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                className="mb-btn"
                onClick={onResetAudit}
                style={{ ...styles.primaryCta, marginTop: 26, width: '100%' }}
              >
                Przeanalizuj inny profil
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 6. ZOBACZ SWÓJ PROFIL OCZAMI DRUGIEJ OSOBY */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.h2}>Zobacz swój profil oczami drugiej osoby.</h2>
          <p style={styles.sectionSub}>Nie dostajesz tylko oceny. Dostajesz informację, co zmienić i dlaczego.</p>
        </div>

        <div className="glass-card mb-card-hover" style={styles.analysisMockup}>
          <div style={styles.analysisPhotoRow}>
            {['Zostaw', 'Usuń', 'Zostaw', 'Podobne', 'Usuń'].map((status, i) => {
              const observations = [
                { text: '✓ Wyraźnie widoczna twarz' },
                { text: '⚠ Słabe światło' },
                { text: '✓ Pokazuje pełną sylwetkę' },
                { text: '⚠ Za dużo podobnych zdjęć' },
                { text: '⚠ Zasłonięta twarz' }
              ];
              
              return (
                <div key={i} style={styles.analysisPhotoCell}>
                  <img 
                    src={`/${i + 1}.png`} 
                    alt={`Zdjęcie ${i + 1}`} 
                    style={{...styles.analysisPhotoBox, width: '100%', height: 'auto', display: 'block'}}
                  />
                  <span style={{
                    ...styles.analysisStatus,
                    color: status === 'Usuń' ? c.red : (status === 'Brak: sylwetka' || status === 'Podobne') ? c.orange : c.green
                  }}>
                    {status}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    color: status === 'Usuń' ? c.red : (status === 'Brak: sylwetka' || status === 'Podobne') ? c.orange : c.green,
                    textAlign: 'center',
                    marginTop: '4px',
                    fontWeight: 600
                  }}>
                    {observations[i].text}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={styles.observationsRow}>
            <span style={styles.observationGood}>✓ Wyraźnie widoczna twarz</span>
            <span style={styles.observationWarn}>⚠ Słabe światło</span>
            <span style={styles.observationGood}>✓ Pokazuje zainteresowania</span>
            <span style={styles.observationWarn}>⚠ Za dużo podobnych zdjęć</span>
          </div>

          <div style={styles.scorePill}>
            <span style={styles.scorePillLabel}>Ocena jakości profilu</span>
            <span style={styles.scorePillValue}>71<span style={{ color: c.textMuted, fontSize: 16 }}>/100</span></span>
          </div>
        </div>
      </section>

      {/* 7. BIO PRZED / PO */}
      <section style={{ ...styles.section, backgroundColor: c.bgAlt }}>
        <div className="mb-bio-grid">
          <div className="glass-card" style={styles.bioCard}>
            <span style={styles.bioLabel}>Przed</span>
            <p style={styles.bioText}>Lubię podróże, muzykę i dobre jedzenie.</p>
            <span style={{ ...styles.bioScore, color: c.orange }}>Bio 38/100</span>
          </div>
          <div className="glass-card" style={{ ...styles.bioCard, ...styles.bioCardHighlight }}>
            <span style={{ ...styles.bioLabel, color: '#E9A6FF' }}>Po MatchBetter</span>
            <p style={styles.bioText}>
              Student informatyki, nocny kawosz i fan spontanicznych wypadów w góry. Gram w siatkówkę i podobno robię całkiem dobrą carbonarę. Szukam kogoś, z kim można zarówno gdzieś pojechać, jak i śmiać się z totalnych głupot.
            </p>
            <span style={{ ...styles.bioScore, color: c.green }}>Bio 81/100</span>
          </div>
        </div>
        <p style={styles.captionTextCenter}>Bio tworzone jest na podstawie informacji o Tobie - nie z gotowego szablonu.</p>
      </section>

      {/* 8. JAK DZIAŁA MATCHBETTER */}
      <section id="jak-dziala" style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.h2}>Jak działa MatchBetter?</h2>
        </div>

        <div style={styles.cardsGrid4}>
          <div className="glass-card mb-card-hover" style={styles.stepCard}>
            <span style={styles.stepNum}>01</span>
            <h3 style={styles.cardHeader}>Dodaj swój profil</h3>
            <p style={styles.cardDesc}>Prześlij screeny profilu i dodatkowe zdjęcia.</p>
          </div>
          <div className="glass-card mb-card-hover" style={styles.stepCard}>
            <span style={styles.stepNum}>02</span>
            <h3 style={styles.cardHeader}>Powiedz nam trochę o sobie</h3>
            <p style={styles.cardDesc}>Kilka krótkich pytań pomaga lepiej dopasować rekomendacje.</p>
          </div>
          <div className="glass-card mb-card-hover" style={styles.stepCard}>
            <span style={styles.stepNum}>03</span>
            <h3 style={styles.cardHeader}>AI analizuje profil</h3>
            <p style={styles.cardDesc}>Zdjęcia, kolejność, bio i pierwsze wrażenie.</p>
          </div>
          <div className="glass-card mb-card-hover" style={styles.stepCard}>
            <span style={styles.stepNum}>04</span>
            <h3 style={styles.cardHeader}>Dostajesz konkretny plan</h3>
            <p style={styles.cardDesc}>Wiesz, co zostawić, usunąć, zmienić i czego Ci brakuje.</p>
          </div>
        </div>
      </section>

      {/* 9. JAK DZIAŁA AI */}
      <section style={{ ...styles.section, backgroundColor: c.bgAlt }}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.h2}>Analiza oparta na czymś więcej niż zgadywanie.</h2>
          <p style={styles.sectionSub}>
            System rekomendacji MatchBetter wykorzystuje wiedzę z publicznie dostępnych materiałów edukacyjnych oraz badań psychologicznych dotyczących m.in. pierwszego wrażenia, atrakcyjności i autoprezentacji.
          </p>
        </div>

        <div style={styles.diagramWrap}>
          <div style={styles.diagramInputsRow}>
            <div style={styles.diagramBox}>Badania psychologiczne</div>
            <div style={styles.diagramBox}>Wiedza o pierwszym wrażeniu</div>
            <div style={styles.diagramBox}>Materiały o profilach randkowych</div>
          </div>
          <span style={styles.diagramArrow}>↓</span>
          <div style={styles.diagramBoxCenter}>AI MatchBetter</div>
          <span style={styles.diagramArrow}>↓</span>
          <div style={styles.diagramBoxFinal}>Analiza Twojego profilu</div>
        </div>
      </section>

      {/* 10. AUTENTYCZNOŚĆ */}
      <section style={styles.section}>
        <div className="mb-authenticity-grid">
          <div style={styles.authenticityLines}>
            <p style={styles.authenticityMuted}>Nie potrzebujesz Lamborghini.</p>
            <p style={styles.authenticityMuted}>Nie potrzebujesz zdjęcia z Bali.</p>
            <p style={styles.authenticityMuted}>Nie potrzebujesz udawać kogoś, kim nie jesteś.</p>
          </div>
          <div>
            <h2 style={styles.authenticityStatement}>
              Potrzebujesz profilu, który <span style={styles.gradientText}>pokazuje Ciebie</span>.
            </h2>
            <p style={styles.bodyText}>
              MatchBetter nie tworzy fikcyjnej wersji Ciebie. Pomaga lepiej wykorzystać to, co już masz - i wskazuje, co warto poprawić.
            </p>
          </div>
        </div>
      </section>

      {/* 12. PORÓWNANIE OPCJI (KORZYŚCI) */}
      <section id="korzysci" style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.h2}>Możesz zgadywać. Możesz zapytać innych. Albo możesz dostać konkretną analizę.</h2>
        </div>

        <div className="mb-compare-grid">
          <div className="glass-card" style={styles.compareCard}>
            <h3 style={styles.compareTitle}>Znajomi</h3>
            <span style={styles.comparePrice}>0 zł</span>
            <p style={styles.compareQuote}>„Stary, to zdjęcie jest spoko.”</p>
            <ul style={styles.compareList}>
              <li style={styles.compareBad}>✕ subiektywna opinia</li>
              <li style={styles.compareBad}>✕ znają Cię osobiście</li>
              <li style={styles.compareBad}>✕ brak konkretnego planu</li>
            </ul>
          </div>

          <div className="glass-card" style={styles.compareCard}>
            <h3 style={styles.compareTitle}>Coach randkowy</h3>
            <span style={styles.comparePrice}>500–1000+ zł</span>
            <ul style={styles.compareList}>
              <li style={styles.compareGood}>✓ indywidualna pomoc</li>
              <li style={styles.compareGood}>✓ doświadczenie</li>
              <li style={styles.compareBad}>✕ wysoka cena</li>
              <li style={styles.compareBad}>✕ jakość zależy od osoby</li>
            </ul>
          </div>

          <div style={styles.compareHighlightWrap}>
            <div className="glass-card" style={{ ...styles.compareCard, ...styles.compareCardHighlight }}>
              <h3 style={styles.compareTitle}>MatchBetter</h3>
              <span style={{ ...styles.comparePrice, color: c.text }}>39 zł</span>
              <ul style={styles.compareList}>
                <li style={styles.compareGood}>✓ analiza całego profilu</li>
                <li style={styles.compareGood}>✓ zdjęcia + bio + kolejność</li>
                <li style={styles.compareGood}>✓ konkretne rekomendacje</li>
                <li style={styles.compareGood}>✓ jasny plan zmian</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 13. CENNIK */}
      <section id="cennik" style={{ ...styles.section, backgroundColor: c.bgAlt }}>
        <div style={{ maxWidth: '460px', margin: '0 auto' }}>
          <div className="glass-card" style={styles.pricingCard}>
            <h3 style={styles.h3}>Pełna analiza profilu</h3>
            <p style={styles.bodyTextMuted}>Jednorazowa płatność</p>

            {/* Cena - placeholder do podmiany po ustaleniu ostatecznego cennika */}
            <div style={styles.priceRow}>
              <span style={styles.priceValue}>39 zł</span>
            </div>

            <ul style={styles.pricingList}>
              <li>✓ analiza wszystkich zdjęć</li>
              <li>✓ wybór najlepszego pierwszego zdjęcia</li>
              <li>✓ rekomendowana kolejność</li>
              <li>✓ analiza całego zestawu</li>
              <li>✓ analiza bio</li>
              <li>✓ nowe propozycje bio</li>
              <li>✓ informacja, jakich zdjęć brakuje</li>
              <li>✓ konkretny plan zmian</li>
            </ul>

            <button className="mb-btn" onClick={scrollToAudit} style={{ ...styles.primaryCta, width: '100%', marginTop: '24px' }}>
              Przeanalizuj mój profil
            </button>
          </div>
        </div>
      </section>

      {/* 14. FAQ */}
      <section id="faq" style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.h2}>Często zadawane pytania</h2>
        </div>

        <div style={styles.faqContainer}>
          {faqItems.map((item, idx) => (
            <div key={idx} style={styles.faqItem}>
              <button className="mb-faq-q" onClick={() => toggleFaq(idx)} style={styles.faqQuestion}>
                <span>{item.q}</span>
                <span style={styles.faqChevron}>{openFaqIndex === idx ? '−' : '+'}</span>
              </button>
              {openFaqIndex === idx && (
                <div style={styles.faqAnswer} className="fade-in">
                  <p style={{ margin: 0 }}>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 15. FINAL CTA */}
      <section style={styles.finalCta}>
        <div style={styles.finalCtaGlow} aria-hidden="true" />
        <h2 style={styles.finalCtaTitle}>Przestań zgadywać.</h2>
        <p style={styles.finalCtaSub}>Sprawdź swój profil i zobacz, co naprawdę możesz poprawić.</p>
        <button className="mb-btn" onClick={scrollToAudit} style={styles.primaryCta}>
          Sprawdź mój profil →
        </button>
        <p style={styles.finePrint}>Tinder • Badoo • Bumble • Hinge</p>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const styles = {
  page: {
    fontFamily: FONT,
    color: c.text,
    backgroundColor: c.bg
  },

  section: {
    padding: '110px 24px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '48px',
    maxWidth: '720px',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  sectionSub: {
    color: c.textSec,
    fontSize: '17px',
    lineHeight: 1.6,
    marginTop: '12px'
  },
  h2: {
    fontSize: 'clamp(28px, 4vw, 44px)',
    fontWeight: 800,
    lineHeight: 1.2,
    letterSpacing: '-0.5px',
    margin: 0
  },
  h3: {
    fontSize: '26px',
    fontWeight: 700,
    marginTop: 0,
    marginBottom: '8px'
  },
  bodyText: {
    color: c.textSec,
    fontSize: '16px',
    lineHeight: 1.7
  },
  bodyTextMuted: {
    color: c.textMuted,
    fontSize: '15px',
    lineHeight: 1.6,
    marginBottom: '20px'
  },
  captionText: {
    color: c.textMuted,
    fontSize: '13px',
    marginTop: '12px'
  },
  captionTextCenter: {
    color: c.textMuted,
    fontSize: '13px',
    textAlign: 'center',
    marginTop: '24px'
  },
  gradientText: {
    background: c.gradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  finePrint: {
    marginTop: '16px',
    color: c.textMuted,
    fontSize: '13px'
  },

  // Hero
  hero: {
    padding: '150px 24px 110px 24px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  badge: {
    display: 'inline-block',
    backgroundColor: 'rgba(192,38,211,0.10)',
    color: '#E19CFB',
    border: '1px solid rgba(192,38,211,0.28)',
    padding: '7px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '24px'
  },
  heroTitle: {
    fontSize: 'clamp(40px, 6vw, 68px)',
    fontWeight: 800,
    lineHeight: 1.1,
    letterSpacing: '-1.5px',
    margin: '0 0 20px 0'
  },
  heroLead: {
    color: c.text,
    fontSize: '19px',
    fontWeight: 600,
    lineHeight: 1.5,
    margin: '0 0 12px 0'
  },
  heroSubtitle: {
    color: c.textSec,
    fontSize: '17px',
    lineHeight: 1.7,
    marginBottom: '32px',
    maxWidth: '520px'
  },
  heroCtaRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px'
  },
  primaryCta: {
    background: c.gradient,
    color: '#FFF',
    border: 'none',
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: 700,
    borderRadius: '12px',
    cursor: 'pointer',
    boxShadow: '0 10px 30px rgba(192,38,211,0.28)',
    fontFamily: FONT
  },
  secondaryGradientBtn: {
    background: 'transparent',
    color: c.text,
    border: `1px solid ${c.borderStrong}`,
    padding: '14px 28px',
    fontSize: '15px',
    fontWeight: 600,
    borderRadius: '12px',
    cursor: 'pointer',
    fontFamily: FONT
  },
  heroVisual: {
    position: 'relative',
    minHeight: '320px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  phoneMockup: {
    width: '300px',
    height: '600px',
    borderRadius: '28px',
    border: `1px solid ${c.borderStrong}`,
    backgroundColor: c.card,
    padding: '12px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.45)'
  },
  phoneScreen: {
    width: '100%',
    height: '100%',
    borderRadius: '20px',
    backgroundColor: c.bgAlt,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    border: `1px solid ${c.border}`
  },
  phonePhotoPlaceholder: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: c.textMuted,
    fontSize: '13px',
    background: 'linear-gradient(180deg, rgba(124,58,237,0.08), rgba(255,61,141,0.05))'
  },
  phoneNameBar: {
    padding: '14px 16px',
    fontWeight: 700,
    fontSize: '16px',
    color: c.text,
    backgroundColor: 'rgba(0,0,0,0.35)'
  },
  floatCard: {
    position: 'absolute',
    backgroundColor: c.cardHi,
    border: `1px solid ${c.borderStrong}`,
    borderRadius: '12px',
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
    minWidth: '130px'
  },
  floatLabel: {
    fontSize: '11px',
    color: c.textSec,
    fontWeight: 600
  },
  floatScore: (color) => ({
    fontSize: '16px',
    fontWeight: 800,
    color
  }),

  // Problem section mockup
  problemMockup: {
    backgroundColor: c.card,
    border: `1px solid ${c.border}`,
    borderRadius: '20px',
    padding: '24px'
  },
  mockupPhotoRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginBottom: '16px'
  },
  mockupPhotoBox: {
    aspectRatio: '3 / 4',
    borderRadius: '10px',
    backgroundColor: c.bgAlt,
    border: `1px solid ${c.border}`
  },
  mockupBioLine: {
    height: '10px',
    borderRadius: '6px',
    backgroundColor: c.bgAlt,
    marginTop: '8px'
  },

  // Stats
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '24px',
    maxWidth: '760px',
    margin: '0 auto'
  },
  statBox: {
    textAlign: 'center',
    padding: '28px 16px',
    borderRadius: '16px',
    border: `1px solid ${c.border}`,
    backgroundColor: c.card
  },
  statNumber: {
    background: c.gradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    display: 'block',
    fontSize: '35px',
    fontWeight: 800,
    letterSpacing: '-1px'
  },
  statLabel: {
    display: 'block',
    marginTop: '6px',
    color: c.textSec,
    fontSize: '14px'
  },
  sourceText: {
    textAlign: 'center',
    color: c.textMuted,
    fontSize: '12px',
    marginTop: '16px'
  },

  // Kojarzysz to
  bubbleStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '32px'
  },
  bubble: {
    backgroundColor: c.card,
    border: `1px solid ${c.border}`,
    borderRadius: '16px',
    padding: '12px 18px',
    fontSize: '14px',
    color: c.textSec,
    maxWidth: '80%'
  },

  // Audit app box
  appBox: {
    width: '100%',
    maxWidth: '750px',
    margin: '0 auto',
    backgroundColor: c.card,
    border: `1px solid ${c.border}`,
    borderRadius: '24px',
    padding: '40px 32px',
    textAlign: 'center',
    boxShadow: '0 20px 50px rgba(0,0,0,0.4)'
  },
  uploadArea: {
    border: `1px dashed ${c.borderStrong}`,
    borderRadius: '16px',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    backgroundColor: c.bgAlt,
    marginTop: '18px'
  },
  uploadIcon: {
    fontSize: '28px',
    color: c.textSec,
    fontWeight: 300
  },
  uploadText: {
    marginTop: '10px',
    fontWeight: 600,
    fontSize: '14px',
    color: c.textSec
  },
  previewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '16px',
    marginTop: '25px'
  },
  previewCard: {
    position: 'relative',
    aspectRatio: '9 / 16',
    borderRadius: '12px',
    overflow: 'hidden',
    border: `1px solid ${c.border}`,
    backgroundColor: '#000'
  },
  previewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  removeImgBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    color: '#FFF',
    border: 'none',
    borderRadius: '50%',
    width: 24,
    height: 24,
    cursor: 'pointer'
  },
  consentBlock: {
    marginTop: '25px',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  consentLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    color: c.textSec,
    lineHeight: 1.5
  },
  checkbox: {
    marginTop: 3,
    accentColor: '#C026D3'
  },
  inlineLink: {
    background: 'none',
    border: 'none',
    color: '#E19CFB',
    textDecoration: 'underline',
    cursor: 'pointer',
    padding: 0,
    fontSize: 'inherit',
    fontFamily: FONT
  },
  termsErrorText: {
    color: c.red,
    fontSize: '12px',
    marginLeft: '24px'
  },
  privacyNote: {
    fontSize: '12px',
    color: c.textMuted,
    marginLeft: '24px'
  },
  submitBtn: {
    width: '100%',
    padding: '16px',
    borderRadius: '12px',
    border: 'none',
    background: c.gradient,
    color: '#FFF',
    fontSize: '16px',
    fontWeight: 700,
    boxShadow: '0 10px 26px rgba(192,38,211,0.25)',
    marginTop: '24px',
    fontFamily: FONT
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    border: `1px solid ${c.borderStrong}`,
    color: c.text,
    padding: '10px 18px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 600,
    fontFamily: FONT
  },
  errorBox: {
    backgroundColor: 'rgba(245,69,92,0.08)',
    border: `1px solid ${c.red}`,
    color: '#FCA5A5',
    padding: '14px',
    borderRadius: '10px',
    marginTop: '20px',
    textAlign: 'left',
    fontSize: '14px'
  },
  loadingContainer: {
    marginTop: '25px',
    padding: '24px',
    backgroundColor: c.bgAlt,
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px'
  },
  loadingText: {
    fontSize: '15px',
    color: '#E19CFB',
    fontWeight: 600,
    margin: 0
  },

  // Result
  resultContainer: {
    backgroundColor: c.bg,
    border: `1px solid ${c.border}`,
    borderRadius: '16px',
    padding: '28px',
    marginTop: '30px',
    textAlign: 'left'
  },
  scoreHeader: {
    borderBottom: `1px solid ${c.border}`,
    paddingBottom: '20px',
    marginBottom: '20px'
  },
  reportHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
    borderBottom: `1px solid ${c.border}`,
    paddingBottom: '20px',
    marginBottom: '24px'
  },
  scoreBadge: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '2px',
    padding: '10px 18px',
    borderRadius: '14px',
    backgroundColor: c.cardHi,
    border: `1px solid ${c.borderStrong}`,
    flexShrink: 0
  },
  scoreBadgeValue: { fontSize: '26px', fontWeight: 800 },
  scoreBadgeMax: { fontSize: '14px', color: c.textMuted, fontWeight: 600 },
  resultTitle: { margin: 0, fontSize: '22px', color: c.text, fontWeight: 800 },
  resultSubtitle: { margin: '6px 0 0 0', color: c.textMuted, fontSize: '14px' },
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '14px',
    marginBottom: '6px'
  },
  summaryBox: {
    backgroundColor: c.card,
    padding: '16px',
    borderRadius: '10px',
    borderLeft: '4px solid #C026D3'
  },
  summaryTitle: { margin: '0 0 8px 0', color: '#E19CFB', fontSize: '15px', fontWeight: 700 },
  summaryText: { margin: 0, fontSize: '14px', lineHeight: 1.6, color: c.textSec },
  improvementsTitle: { margin: '0 0 15px 0', color: c.text, fontSize: '17px', fontWeight: 700 },
  improvementCard: {
    backgroundColor: c.card,
    border: `1px solid ${c.border}`,
    borderRadius: '12px',
    padding: '14px 16px',
    cursor: 'pointer'
  },
  improvementRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px'
  },
  improvementHeading: {
    margin: 0,
    color: c.text,
    fontSize: '14px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  improvementBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: c.cardHi,
    color: '#F5A0AC',
    fontSize: '12px',
    fontWeight: 800,
    flexShrink: 0
  },
  chevron: { color: c.textMuted, fontSize: '18px', fontWeight: 700, flexShrink: 0 },
  improvementBody: { margin: '0 0 8px 0', fontSize: '13px', color: c.textSec, lineHeight: 1.5 },
  moreTagsBtn: {
    background: 'none',
    border: 'none',
    color: c.textMuted,
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    padding: '2px 0',
    textDecoration: 'underline'
  },
  tagsExpanded: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: '2px',
    textAlign: 'center'
  },
  bioResultGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '14px'
  },
  bioWhyBetter: {
    margin: 0,
    fontSize: '13px',
    color: '#E9A6FF',
    lineHeight: 1.5,
    borderTop: `1px solid ${c.border}`,
    paddingTop: '12px'
  },

  // Product analysis mockup
  analysisMockup: {
    backgroundColor: c.card,
    border: `1px solid ${c.border}`,
    borderRadius: '20px',
    padding: '32px'
  },
  analysisPhotoRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
    gap: '14px'
  },
  analysisPhotoCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  analysisPhotoBox: {
    width: '100%',
    aspectRatio: '3 / 4',
    borderRadius: '10px',
    backgroundColor: c.bgAlt,
    border: `1px solid ${c.border}`
  },
  analysisStatus: {
    fontSize: '12px',
    fontWeight: 700,
    textAlign: 'center'
  },
  observationsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px 24px',
    marginTop: '28px',
    paddingTop: '24px',
    borderTop: `1px solid ${c.border}`
  },
  observationGood: { color: c.green, fontSize: '14px' },
  observationWarn: { color: c.orange, fontSize: '14px' },
  scorePill: {
    marginTop: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderRadius: '14px',
    backgroundColor: c.cardHi,
    border: `1px solid ${c.borderStrong}`
  },
  scorePillLabel: { color: c.textSec, fontSize: '14px', fontWeight: 600 },
  scorePillValue: { fontSize: '26px', fontWeight: 800 },

  // Bio before/after
  bioCard: {
    backgroundColor: c.card,
    border: `1px solid ${c.border}`,
    borderRadius: '18px',
    padding: '28px'
  },
  bioCardHighlight: {
    backgroundColor: c.cardHi,
    border: '1px solid rgba(192,38,211,0.35)'
  },
  bioLabel: {
    fontSize: '13px',
    fontWeight: 700,
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  bioText: {
    color: c.textSec,
    fontSize: '15px',
    lineHeight: 1.7,
    margin: '14px 0 18px 0'
  },
  bioScore: {
    fontSize: '13px',
    fontWeight: 700
  },

  // How it works
  cardsGrid4: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    gap: '20px'
  },
  stepCard: {
    backgroundColor: c.card,
    border: `1px solid ${c.border}`,
    borderRadius: '16px',
    padding: '28px 24px'
  },
  stepNum: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#8B5CF6',
    opacity: 0.9,
    display: 'block',
    marginBottom: '14px'
  },
  cardHeader: {
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '8px',
    color: c.text
  },
  cardDesc: {
    color: c.textSec,
    fontSize: '14px',
    lineHeight: 1.6
  },

  // AI diagram
  diagramWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    maxWidth: '760px',
    margin: '0 auto'
  },
  diagramInputsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '12px'
  },
  diagramBox: {
    padding: '12px 18px',
    borderRadius: '10px',
    border: `1px solid ${c.border}`,
    backgroundColor: c.card,
    color: c.textSec,
    fontSize: '13px',
    fontWeight: 600
  },
  diagramArrow: {
    color: c.textMuted,
    fontSize: '18px'
  },
  diagramBoxCenter: {
    padding: '14px 28px',
    borderRadius: '12px',
    background: c.gradient,
    color: '#FFF',
    fontSize: '15px',
    fontWeight: 700
  },
  diagramBoxFinal: {
    padding: '12px 22px',
    borderRadius: '10px',
    border: `1px solid ${c.borderStrong}`,
    backgroundColor: c.cardHi,
    color: c.text,
    fontSize: '14px',
    fontWeight: 700
  },

  // Authenticity
  authenticityLines: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    justifyContent: 'center'
  },
  authenticityMuted: {
    color: c.textMuted,
    fontSize: '20px',
    fontWeight: 600,
    margin: 0
  },
  authenticityStatement: {
    fontSize: 'clamp(26px, 3.5vw, 38px)',
    fontWeight: 800,
    lineHeight: 1.25,
    margin: '0 0 16px 0'
  },

  // Professional photos
  photoSectionWrap: {
    display: 'flex',
    gap: '18px',
    maxWidth: '760px',
    margin: '0 auto'
  },

  // Comparison
  compareCard: {
    backgroundColor: c.card,
    border: `1px solid ${c.border}`,
    borderRadius: '18px',
    padding: '28px 24px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  compareHighlightWrap: {
    borderRadius: '19px',
    background: c.gradient,
    padding: '1px'
  },
  compareCardHighlight: {
    backgroundColor: c.cardHi,
    borderRadius: '18px',
    border: 'none',
    height: '100%'
  },
  compareTitle: {
    fontSize: '18px',
    fontWeight: 700,
    margin: '0 0 6px 0'
  },
  comparePrice: {
    fontSize: '22px',
    fontWeight: 800,
    color: c.textSec,
    marginBottom: '16px',
    display: 'block'
  },
  compareQuote: {
    fontStyle: 'italic',
    color: c.textMuted,
    fontSize: '14px',
    marginBottom: '16px'
  },
  compareList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    fontSize: '14px'
  },
  compareGood: { color: c.green },
  compareBad: { color: c.textMuted },

  // Pricing
  pricingCard: {
    padding: '40px 32px',
    textAlign: 'center',
    backgroundColor: c.card,
    border: '1px solid rgba(192,38,211,0.35)',
    borderRadius: '20px'
  },
  priceRow: {
    margin: '22px 0',
    display: 'flex',
    justifyContent: 'center'
  },
  priceValue: {
    fontSize: '46px',
    fontWeight: 800,
    color: c.text
  },
  pricingList: {
    listStyle: 'none',
    padding: 0,
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    color: c.textSec,
    fontSize: '14px'
  },

  // FAQ
  faqContainer: {
    maxWidth: '800px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  faqItem: {
    backgroundColor: c.card,
    border: `1px solid ${c.border}`,
    borderRadius: '14px',
    overflow: 'hidden'
  },
  faqQuestion: {
    width: '100%',
    padding: '20px 22px',
    background: 'none',
    border: 'none',
    color: c.text,
    fontSize: '15px',
    fontWeight: 600,
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    fontFamily: FONT
  },
  faqChevron: {
    color: c.textMuted,
    fontSize: '20px',
    flexShrink: 0
  },
  faqAnswer: {
    padding: '0 22px 20px 22px',
    color: c.textSec,
    fontSize: '14px',
    lineHeight: 1.6
  },

  // Final CTA
  finalCta: {
    position: 'relative',
    textAlign: 'center',
    padding: '130px 24px',
    maxWidth: '1200px',
    margin: '0 auto',
    overflow: 'hidden'
  },
  finalCtaGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '520px',
    height: '260px',
    background: 'radial-gradient(ellipse at center, rgba(192,38,211,0.16), transparent 70%)',
    pointerEvents: 'none'
  },
  finalCtaTitle: {
    position: 'relative',
    fontSize: 'clamp(32px, 5vw, 52px)',
    fontWeight: 800,
    letterSpacing: '-1px',
    margin: '0 0 14px 0'
  },
  finalCtaSub: {
    position: 'relative',
    color: c.textSec,
    fontSize: '17px',
    marginBottom: '32px'
  }
};