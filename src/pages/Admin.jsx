import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const ADMIN_EMAIL = "mglebocki001@gmail.com";

const BLOCK_TYPES = {
  PARAGRAPH: 'paragraph',
  HEADING_2: 'h2',
  HEADING_3: 'h3',
  IMAGE: 'image',
  QUOTE: 'quote',
  CALLOUT: 'callout'
};

export default function Admin({ user }) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  
  // Przełącznik trybu w prawej kolumnie: 'editor' lub 'preview'
  const [activeTab, setActiveTab] = useState('editor');

  // Architektura blokowa
  const [blocks, setBlocks] = useState([
    { id: '1', type: BLOCK_TYPES.PARAGRAPH, value: '' }
  ]);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  if (!user) {
    return (
      <div style={styles.centeredState}>
        <h2>🔒 Zaloguj się</h2>
        <p>Musisz być zalogowany, aby uzyskać dostęp do panelu admina.</p>
      </div>
    );
  }

  if (user.email !== ADMIN_EMAIL) {
    return (
      <div style={styles.centeredState}>
        <h2>⛔ Brak dostępu</h2>
        <p>Jesteś zalogowany jako: <strong>{user.email}</strong></p>
        <p>Ten e-mail nie ma uprawnień administratora.</p>
      </div>
    );
  }

  // Zarządzanie blokami
  const addBlock = (type) => {
    const newBlock = {
      id: Date.now().toString(),
      type,
      value: '',
      ...(type === BLOCK_TYPES.IMAGE ? { caption: '', align: 'center', width: '100%' } : {})
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id, key, value) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, [key]: value } : b));
  };

  const removeBlock = (id) => {
    if (blocks.length === 1) return;
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const moveBlock = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const updated = [...blocks];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setBlocks(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    try {
      await addDoc(collection(db, 'posts'), {
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        excerpt,
        coverImage,
        blocks,
        createdAt: serverTimestamp()
      });

      setMsg('✅ Post został pomyślnie opublikowany!');
      setTitle('');
      setSlug('');
      setExcerpt('');
      setCoverImage('');
      setBlocks([{ id: Date.now().toString(), type: BLOCK_TYPES.PARAGRAPH, value: '' }]);
    } catch (err) {
      console.error(err);
      setMsg('❌ Błąd podczas zapisywania postu: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.heading}>🛠️ Kreator Postów</h1>
          <p style={styles.subheading}>Twórz i podglądaj angażujące wpisy w czasie rzeczywistym</p>
        </div>
        <button onClick={handleSubmit} disabled={saving} style={styles.publishBtn}>
          {saving ? 'Zapisywanie...' : '🚀 Opublikuj wpis'}
        </button>
      </header>

      {msg && <div style={styles.msgBox}>{msg}</div>}

      <div style={styles.layout}>
        {/* Lewa kolumna: Ustawienia wpisu */}
        <aside style={styles.sidebar}>
          <h3 style={styles.sectionTitle}>Ustawienia Wpisu</h3>
          
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Tytuł wpisu *</label>
            <input
              type="text"
              required
              placeholder="np. Jak napisać idealne bio?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>URL Slug (opcjonalnie)</label>
            <input
              type="text"
              placeholder="np. idealne-bio-tinder"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Zdjęcie okładkowe (URL)</label>
            <input
              type="url"
              placeholder="https://..."
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              style={styles.input}
            />
            {coverImage && <img src={coverImage} alt="Okładka" style={styles.coverPreview} />}
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Krótki wstęp (Excerpt)</label>
            <textarea
              rows="3"
              placeholder="Krótki opis widoczny na liście artykułów..."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              style={styles.textarea}
            />
          </div>
        </aside>

        {/* Prawa kolumna: Edytor / Podgląd */}
        <main style={styles.editorMain}>
          <div style={styles.tabContainer}>
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              style={{
                ...styles.tabBtn,
                ...(activeTab === 'editor' ? styles.activeTabBtn : {})
              }}
            >
              ✏️ Edytor bloków
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              style={{
                ...styles.tabBtn,
                ...(activeTab === 'preview' ? styles.activeTabBtn : {})
              }}
            >
              👁️ Podgląd na żywo
            </button>
          </div>

          {activeTab === 'editor' ? (
            /* Tryb Edycji */
            <div>
              <div style={styles.blockList}>
                {blocks.map((block, index) => (
                  <div key={block.id} style={styles.blockCard}>
                    <div style={styles.blockControls}>
                      <span style={styles.blockTag}>{block.type.toUpperCase()}</span>
                      <div style={styles.blockActions}>
                        <button type="button" onClick={() => moveBlock(index, -1)} disabled={index === 0} style={styles.iconBtn}>↑</button>
                        <button type="button" onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1} style={styles.iconBtn}>↓</button>
                        <button type="button" onClick={() => removeBlock(block.id)} style={{ ...styles.iconBtn, color: '#F5455C' }}>✕</button>
                      </div>
                    </div>

                    {block.type === BLOCK_TYPES.PARAGRAPH && (
                      <textarea
                        rows="3"
                        placeholder="Wpisz treść akapitu..."
                        value={block.value}
                        onChange={(e) => updateBlock(block.id, 'value', e.target.value)}
                        style={styles.textarea}
                      />
                    )}

                    {(block.type === BLOCK_TYPES.HEADING_2 || block.type === BLOCK_TYPES.HEADING_3) && (
                      <input
                        type="text"
                        placeholder={block.type === BLOCK_TYPES.HEADING_2 ? "Nagłówek H2..." : "Podnagłówek H3..."}
                        value={block.value}
                        onChange={(e) => updateBlock(block.id, 'value', e.target.value)}
                        style={{ ...styles.input, fontSize: block.type === BLOCK_TYPES.HEADING_2 ? '18px' : '15px', fontWeight: 'bold' }}
                      />
                    )}

                    {block.type === BLOCK_TYPES.QUOTE && (
                      <textarea
                        rows="2"
                        placeholder="Wpisz treść cytatu..."
                        value={block.value}
                        onChange={(e) => updateBlock(block.id, 'value', e.target.value)}
                        style={{ ...styles.textarea, fontStyle: 'italic', borderLeft: '3px solid #FF2E93' }}
                      />
                    )}

                    {block.type === BLOCK_TYPES.CALLOUT && (
                      <textarea
                        rows="2"
                        placeholder="Ważna informacja / ramka wyróżniona..."
                        value={block.value}
                        onChange={(e) => updateBlock(block.id, 'value', e.target.value)}
                        style={{ ...styles.textarea, backgroundColor: 'rgba(255, 46, 147, 0.08)', borderColor: 'rgba(255, 46, 147, 0.3)' }}
                      />
                    )}

                    {block.type === BLOCK_TYPES.IMAGE && (
                      <div style={styles.imageBlockConfig}>
                        <input
                          type="url"
                          placeholder="Adres URL zdjęcia (https://...)"
                          value={block.value}
                          onChange={(e) => updateBlock(block.id, 'value', e.target.value)}
                          style={styles.input}
                        />
                        <input
                          type="text"
                          placeholder="Podpis pod zdjęciem (opcjonalnie)"
                          value={block.caption || ''}
                          onChange={(e) => updateBlock(block.id, 'caption', e.target.value)}
                          style={styles.input}
                        />
                        <div style={styles.imageOptionsRow}>
                          <select
                            value={block.width || '100%'}
                            onChange={(e) => updateBlock(block.id, 'width', e.target.value)}
                            style={styles.select}
                          >
                            <option value="100%">Szerokość: 100%</option>
                            <option value="75%">Szerokość: 75%</option>
                            <option value="50%">Szerokość: 50%</option>
                          </select>
                          <select
                            value={block.align || 'center'}
                            onChange={(e) => updateBlock(block.id, 'align', e.target.value)}
                            style={styles.select}
                          >
                            <option value="center">Wyrównanie: Środek</option>
                            <option value="flex-start">Wyrównanie: Lewa</option>
                            <option value="flex-end">Wyrównanie: Prawa</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pasek dodawania nowych bloków */}
              <div style={styles.addBar}>
                <span style={styles.addBarLabel}>+ Dodaj blok:</span>
                <div style={styles.addBarButtons}>
                  <button type="button" onClick={() => addBlock(BLOCK_TYPES.PARAGRAPH)} style={styles.addBtn}>Akapit</button>
                  <button type="button" onClick={() => addBlock(BLOCK_TYPES.HEADING_2)} style={styles.addBtn}>Nagłówek H2</button>
                  <button type="button" onClick={() => addBlock(BLOCK_TYPES.HEADING_3)} style={styles.addBtn}>Nagłówek H3</button>
                  <button type="button" onClick={() => addBlock(BLOCK_TYPES.IMAGE)} style={{ ...styles.addBtn, borderColor: '#FF2E93', color: '#FF75B5' }}>📷 Zdjęcie</button>
                  <button type="button" onClick={() => addBlock(BLOCK_TYPES.QUOTE)} style={styles.addBtn}>Cytat</button>
                  <button type="button" onClick={() => addBlock(BLOCK_TYPES.CALLOUT)} style={styles.addBtn}>Wyróżnienie</button>
                </div>
              </div>
            </div>
          ) : (
            /* Tryb Podglądu na Żywo (1:1 z widokiem BlogPost) */
            <div style={styles.previewContainer}>
              <article style={{ background: '#111827', border: '1px solid #1F2937', padding: '30px', borderRadius: '16px' }}>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 20, lineHeight: 1.3 }}>
                  {title || 'Tytuł artykułu...'}
                </h1>

                {coverImage && (
                  <img 
                    src={coverImage} 
                    alt="Okładka" 
                    style={{ width: '100%', maxHeight: 380, objectFit: 'cover', borderRadius: 12, marginBottom: 25, border: '1px solid #1F2937' }} 
                  />
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {blocks.map((block) => (
                    <PreviewBlock key={block.id} block={block} />
                  ))}
                </div>
              </article>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Komponent renderujący bloki w podglądzie
// ─────────────────────────────────────────────────────────────
function PreviewBlock({ block }) {
  switch (block.type) {
    case 'h2':
      return <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#FFF', marginTop: 12, marginBottom: 4 }}>{block.value || 'Nagłówek H2...'}</h2>;
    case 'h3':
      return <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFF', marginTop: 8, marginBottom: 4 }}>{block.value || 'Nagłówek H3...'}</h3>;
    case 'paragraph':
      return <p style={{ fontSize: '1rem', lineHeight: 1.7, color: '#D1D5DB', margin: 0, whiteSpace: 'pre-wrap' }}>{block.value || 'Treść akapitu...'}</p>;
    case 'quote':
      return (
        <blockquote style={{ margin: '8px 0', padding: '12px 18px', borderLeft: '4px solid #FF2E93', backgroundColor: '#1F2937', borderRadius: '0 10px 10px 0', fontSize: '1rem', fontStyle: 'italic', color: '#F3F4F6' }}>
          „{block.value || 'Treść cytatu...'}`
        </blockquote>
      );
    case 'callout':
      return (
        <div style={{ margin: '8px 0', padding: '14px 18px', backgroundColor: 'rgba(255, 46, 147, 0.08)', border: '1px solid rgba(255, 46, 147, 0.3)', borderRadius: 10, fontSize: '1rem', color: '#FF75B5', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span>💡</span>
          <div>{block.value || 'Treść wyróżnienia...'}</div>
        </div>
      );
    case 'image':
      if (!block.value) return <div style={{ padding: 20, border: '1px dashed #374151', borderRadius: 8, textAlign: 'center', color: '#6B7280' }}>📷 Błędem lub brak URL zdjęcia</div>;
      return (
        <figure style={{ margin: '12px 0', display: 'flex', flexDirection: 'column', alignItems: block.align === 'flex-start' ? 'flex-start' : block.align === 'flex-end' ? 'flex-end' : 'center' }}>
          <img src={block.value} alt={block.caption || 'Zdjęcie'} style={{ width: block.width || '100%', borderRadius: 10, border: '1px solid #1F2937', maxHeight: 450, objectFit: 'cover' }} />
          {block.caption && <figcaption style={{ marginTop: 6, fontSize: '0.85rem', color: '#9CA3AF', fontStyle: 'italic' }}>{block.caption}</figcaption>}
        </figure>
      );
    default:
      return null;
  }
}

// Stylizacja
const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '30px 20px', color: '#F7F7FA', fontFamily: "'Inter', sans-serif" },
  centeredState: { color: '#FFF', padding: 80, textAlign: 'center' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '20px' },
  heading: { fontSize: '28px', margin: 0, fontWeight: 800 },
  subheading: { fontSize: '14px', color: '#72727E', margin: '4px 0 0 0' },
  layout: { display: 'grid', gridTemplateColumns: '320px 1fr', gap: '30px', alignItems: 'start' },
  sidebar: { backgroundColor: '#16161E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' },
  editorMain: { backgroundColor: '#16161E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' },
  tabContainer: { display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' },
  tabBtn: { background: 'none', border: 'none', color: '#9CA3AF', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' },
  activeTabBtn: { backgroundColor: 'rgba(255, 46, 147, 0.15)', color: '#FF2E93' },
  sectionTitle: { fontSize: '16px', fontWeight: 700, margin: '0 0 18px 0', color: '#FF75B5' },
  fieldGroup: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '13px', color: '#A5A5B2', marginBottom: '6px', fontWeight: 600 },
  input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', backgroundColor: '#111118', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', backgroundColor: '#111118', color: '#FFF', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' },
  select: { padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', backgroundColor: '#111118', color: '#FFF', fontSize: '13px' },
  coverPreview: { width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginTop: '10px' },
  publishBtn: { background: 'linear-gradient(90deg, #FF2E93 0%, #8A2BE2 100%)', color: '#FFF', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 700, fontSize: '15px', cursor: 'pointer' },
  msgBox: { padding: '14px', backgroundColor: '#111118', border: '1px solid #FF2E93', borderRadius: '10px', marginBottom: '20px' },
  blockList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  blockCard: { backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' },
  blockControls: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  blockTag: { fontSize: '11px', color: '#72727E', fontWeight: 700, letterSpacing: '0.5px' },
  blockActions: { display: 'flex', gap: '6px' },
  iconBtn: { background: 'rgba(255,255,255,0.05)', border: 'none', color: '#A5A5B2', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' },
  imageBlockConfig: { display: 'flex', flexDirection: 'column', gap: '10px' },
  imageOptionsRow: { display: 'flex', gap: '10px' },
  addBar: { marginTop: '24px', paddingTop: '20px', borderTop: '1px dashed rgba(255,255,255,0.12)', display: 'flex', flexDirection: 'column', gap: '10px' },
  addBarLabel: { fontSize: '13px', color: '#A5A5B2', fontWeight: 600 },
  addBarButtons: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  addBtn: { backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 },
  previewContainer: { padding: '10px 0' }
};