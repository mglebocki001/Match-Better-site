import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Blog({ user, onLogout, onOpenAuth, onOpenModal }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedPosts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPosts(fetchedPosts);
      } catch (err) {
        console.error("Błąd pobierania postów:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#0B0F17' }}>
      <Navbar user={user} onLogout={onLogout} onOpenAuth={onOpenAuth} />

      <main style={{ flex: 1, maxWidth: 1200, width: '100%', margin: '0 auto', padding: '60px 20px' }}>
        {/* Nagłówek Bloga */}
        <div style={{ textAlign: 'center', marginBottom: 50 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#FFF', marginBottom: 10 }}>
            Nasz <span style={{ background: 'linear-gradient(90deg, #FF2E93, #8A2BE2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Blog</span>
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '1.1rem' }}>Odkryj porady, wskazówki i wiedzę o budowaniu skuteczne profilu.</p>
        </div>

        {loading && <p style={{ textAlign: 'center', color: '#9CA3AF' }}>⌛ Ładowanie artykułów...</p>}

        {!loading && posts.length === 0 && (
          <p style={{ textAlign: 'center', color: '#9CA3AF' }}>Brak opublikowanych wpisów.</p>
        )}

        {/* Siatka 3 postów w rzędzie */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '30px'
        }}>
          {posts.map(post => (
            <article 
              key={post.id} 
              style={{ 
                background: 'rgba(17, 24, 39, 0.7)', 
                border: '1px solid #1F2937', 
                borderRadius: 16, 
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.borderColor = '#FF2E93';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#1F2937';
              }}
            >
              {post.imageUrl && (
                <Link to={`/blog/${post.slug}`}>
                  <img 
                    src={post.imageUrl} 
                    alt={post.title} 
                    style={{ width: '100%', height: 200, objectFit: 'cover' }} 
                  />
                </Link>
              )}

              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, lineHeight: 1.3 }}>
                  <Link to={`/blog/${post.slug}`} style={{ color: '#FFF', textDecoration: 'none' }}>
                    {post.title}
                  </Link>
                </h2>

                <p style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1.6, flex: 1, marginBottom: 20 }}>
                  {post.excerpt ? (post.excerpt.length > 100 ? post.excerpt.substring(0, 100) + '...' : post.excerpt) : ''}
                </p>

                <Link 
                  to={`/blog/${post.slug}`} 
                  style={{ 
                    color: '#FF2E93', 
                    fontWeight: 'bold', 
                    fontSize: 14, 
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  Czytaj więcej →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>

      <Footer onOpenModal={onOpenModal} />
    </div>
  );
}