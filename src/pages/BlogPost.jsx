import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function BlogPost({ user, onLogout, onOpenAuth, onOpenModal }) {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const q = query(collection(db, 'posts'), where('slug', '==', slug));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          setPost(querySnapshot.docs[0].data());
        } else {
          setPost(null);
        }
      } catch (err) {
        console.error("Błąd podczas pobierania wpisu:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  // Pomocnik do opisu w Meta Tagach (SEO)
  const getMetaDescription = () => {
    if (post?.excerpt) return post.excerpt;
    if (post?.content) return post.content.substring(0, 160);
    if (post?.blocks) {
      const firstParagraph = post.blocks.find(b => b.type === 'paragraph' || b.type === 'h2');
      return firstParagraph ? firstParagraph.value.substring(0, 160) : post.title;
    }
    return post?.title || '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#0B0F17' }}>
      <Navbar user={user} onLogout={onLogout} onOpenAuth={onOpenAuth} />

      <main style={{ flex: 1, maxWidth: 850, width: '100%', margin: '0 auto', padding: '40px 20px', color: '#FFF' }}>
        {/* ⬅️ Przycisk "Wróć do bloga" */}
        <Link 
          to="/blog" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 8, 
            color: '#FF2E93', 
            textDecoration: 'none', 
            fontWeight: 'bold',
            marginBottom: 30,
            padding: '8px 16px',
            background: 'rgba(255, 46, 147, 0.1)',
            borderRadius: 20,
            transition: 'background 0.2s'
          }}
        >
          ← Wróć do artykułów
        </Link>

        {loading && <p style={{ textAlign: 'center', color: '#9CA3AF' }}>⌛ Ładowanie artykułu...</p>}

        {!loading && !post && (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <h2 style={{ fontSize: 28, marginBottom: 10 }}>404 - Nie znaleziono posta</h2>
            <p style={{ color: '#9CA3AF' }}>Artykuł nie istnieje lub został usunięty.</p>
          </div>
        )}

        {post && (
          <>
            <Helmet>
              <title>{post.title} | Blog</title>
              <meta name="description" content={getMetaDescription()} />
            </Helmet>

            <article style={{ background: '#111827', border: '1px solid #1F2937', padding: '35px', borderRadius: 20 }}>
              <h1 style={{ fontSize: '2.3rem', fontWeight: 800, marginBottom: 20, lineHeight: 1.3 }}>{post.title}</h1>

              {/* Zdjęcie okładkowe (obsługuje zarówno nową nazwę coverImage, jak i starą imageUrl) */}
              {(post.coverImage || post.imageUrl) && (
                <img 
                  src={post.coverImage || post.imageUrl} 
                  alt={post.title} 
                  style={{ width: '100%', maxHeight: 420, objectFit: 'cover', borderRadius: 12, marginBottom: 30, border: '1px solid #1F2937' }} 
                />
              )}

              {/* Renderowanie treści w zależności od struktury wpisu */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {post.blocks && post.blocks.length > 0 ? (
                  // Nowe wpisy blokowe
                  post.blocks.map((block) => <RenderBlock key={block.id} block={block} />)
                ) : (
                  // Stare wpisy jako zwykły HTML / tekst
                  <div 
                    style={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#D1D5DB', whiteSpace: 'pre-line' }}
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                )}
              </div>
            </article>
          </>
        )}
      </main>

      <Footer onOpenModal={onOpenModal} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Komponent renderujący pojedyncze bloki wpisu
// ─────────────────────────────────────────────────────────────
function RenderBlock({ block }) {
  switch (block.type) {
    case 'h2':
      return (
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#FFF', marginTop: 15, marginBottom: 5 }}>
          {block.value}
        </h2>
      );

    case 'h3':
      return (
        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#FFF', marginTop: 10, marginBottom: 5 }}>
          {block.value}
        </h3>
      );

    case 'paragraph':
      return (
        <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#D1D5DB', margin: 0, whiteSpace: 'pre-wrap' }}>
          {block.value}
        </p>
      );

    case 'quote':
      return (
        <blockquote style={{
          margin: '10px 0',
          padding: '16px 20px',
          borderLeft: '4px solid #FF2E93',
          backgroundColor: '#1F2937',
          borderRadius: '0 12px 12px 0',
          fontSize: '1.1rem',
          fontStyle: 'italic',
          color: '#F3F4F6'
        }}>
          „{block.value}”
        </blockquote>
      );

    case 'callout':
      return (
        <div style={{
          margin: '10px 0',
          padding: '16px 20px',
          backgroundColor: 'rgba(255, 46, 147, 0.08)',
          border: '1px solid rgba(255, 46, 147, 0.3)',
          borderRadius: 12,
          fontSize: '1.05rem',
          lineHeight: 1.7,
          color: '#FF75B5',
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start'
        }}>
          <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>💡</span>
          <div>{block.value}</div>
        </div>
      );

    case 'image':
      if (!block.value) return null;
      return (
        <figure style={{
          margin: '15px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: block.align === 'flex-start' ? 'flex-start' : block.align === 'flex-end' ? 'flex-end' : 'center'
        }}>
          <img
            src={block.value}
            alt={block.caption || 'Zdjęcie w wpisie'}
            style={{
              width: block.width || '100%',
              borderRadius: 12,
              border: '1px solid #1F2937',
              maxHeight: 550,
              objectFit: 'cover'
            }}
          />
          {block.caption && (
            <figcaption style={{ marginTop: 8, fontSize: '0.88rem', color: '#9CA3AF', textAlign: 'center', fontStyle: 'italic' }}>
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    default:
      return null;
  }
}