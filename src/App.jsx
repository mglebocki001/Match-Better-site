import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Blog from './pages/Blog';
import Admin from './pages/Admin.jsx';
import BlogPost from './pages/BlogPost.jsx';

const API_URL = "https://ai-profile-auditor.onrender.com";

const LOADING_MESSAGES = [
  "⌛ Odczytywanie zrzutów ekranu...",
  "🔍 Analizowanie kompozycji zdjęć i wizerunku...",
  "📝 Sprawdzanie opisu pod kątem błędów i czytelności...",
  "✍️ Generowanie proponowanych nowych opisów...",
  "💡 Przygotowywanie sugerowanych openerów..."
];

export default function App() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Stan uwierzytelniania i modali
  const [user, setUser] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'login' | 'register' | 'terms' | 'privacy' | null
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Zgody
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState(false);

  // 1. Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. LocalStorage wczytywanie
  useEffect(() => {
    const savedResult = localStorage.getItem('last_audit_result');
    if (savedResult) {
      try {
        setResult(JSON.parse(savedResult));
      } catch (e) {
        console.error("Błąd odczytu z localStorage", e);
      }
    }
  }, []);

  // 3. LocalStorage zapisywanie
  useEffect(() => {
    if (result) {
      localStorage.setItem('last_audit_result', JSON.stringify(result));
    }
  }, [result]);

  // 4. Komunikaty ładowania
  useEffect(() => {
    let interval = null;
    if (loading) {
      setLoadingMsgIndex(0);
      interval = setInterval(() => {
        setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 5000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // 5. Podgląd podsyłanych zdjęć
  useEffect(() => {
    if (files.length === 0) {
      setPreviews([]);
      return;
    }

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviews);

    return () => {
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const handleGoogleLogin = async () => {
    try {
      setAuthError(null);
      await signInWithPopup(auth, googleProvider);
      setActiveModal(null);
    } catch (err) {
      console.error("Błąd logowania Google:", err);
      setAuthError("Nie udało się zalogować przez Google.");
    }
  };

  const handleResetPassword = async () => {
    if (!emailInput) {
      setAuthError("Wpisz swój adres e-mail w polu poniżej, aby zresetować hasło.");
      return;
    }
    try {
      setAuthError(null);
      await sendPasswordResetEmail(auth, emailInput);
      setResetSuccess(true);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setAuthError("Nie znaleziono konta z tym adresem e-mail.");
      } else {
        setAuthError("Błąd podczas wysyłania linku resetującego: " + err.message);
      }
    }
  };

  const handleEmailAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);

    try {
      if (activeModal === 'register') {
        await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
      } else {
        await signInWithEmailAndPassword(auth, emailInput, passwordInput);
      }
      setActiveModal(null);
      setEmailInput('');
      setPasswordInput('');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setAuthError("Błędny email lub hasło.");
      } else if (err.code === 'auth/email-already-in-use') {
        setAuthError("Konto z tym adresem email już istnieje.");
      } else if (err.code === 'auth/weak-password') {
        setAuthError("Hasło powinno mieć minimum 6 znaków.");
      } else {
        setAuthError("Wystąpił błąd podczas logowania: " + err.message);
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setResult(null);
    localStorage.removeItem('last_audit_result');
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      
      const validFiles = selectedFiles.filter(file => {
        const isImage = file.type.startsWith('image/');
        const isValidSize = file.size <= 10 * 1024 * 1024;
        
        if (!isImage) alert(`Plik "${file.name}" nie jest obrazem.`);
        if (!isValidSize) alert(`Plik "${file.name}" przekracza maksymalny rozmiar 10MB.`);
        
        return isImage && isValidSize;
      });

      // ZMIANA: Zwiększono limit z 4 do 6 zdjęć
      setFiles((prev) => [...prev, ...validFiles].slice(0, 6));
    }
  };

  const removeFile = (indexToRemove) => {
    if (previews[indexToRemove]) {
      URL.revokeObjectURL(previews[indexToRemove]);
    }
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleAudit = async () => {
    if (files.length === 0) return alert("Wybierz przynajmniej jedno zdjęcie!");

    if (!termsAccepted) {
      setTermsError(true);
      return;
    }
    setTermsError(false);

    if (!user) {
      setActiveModal('register');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const token = await user.getIdToken();

      const response = await axios.post(`${API_URL}/analyze-profile`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });
      
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        "Nie udało się połączyć z serwerem. Spróbuj ponownie za chwilę."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadDemoReport = () => {
    setResult({
      overall_action_plan_summary: "Profil prezentuje się bardzo dobrze. Zdjęcia są wyraziste i pokazałeś swoje pasje, jednak Twój opis jest zbyt krótki i brakuje mu punktu zaczepienia do rozpoczęcia rozmowy.",
      one_great_thing: "Świetna jakość pierwszego zdjęcia z naturalnym uśmiechem oraz ujęcie dynamiczne ze ścianki wspinaczkowej.",
      top_5_improvements: [
        {
          title: "Opis nie zachęca do kontaktu",
          why_it_matters: "Opis na profilu jest sztampowy i nie daje drugiej stronie łatwego powodu do napisania wiadomości.",
          quick_fix: "Dodaj luźne pytanie na końcu opisu (np. o ulubioną kawę/pizzę)."
        },
        {
          title: "Trzecie zdjęcie jest zbyt ciemne",
          why_it_matters: "Słaba ostrość i brak światła sprawiają, że profil wygląda mało profesjonalnie.",
          quick_fix: "Zastąp je zdjęciem w dobrym oświetleniu dziennym."
        }
      ]
    });
  };

  const handleResetAudit = () => {
    setResult(null);
    setFiles([]);
    setPreviews([]);
    localStorage.removeItem('last_audit_result');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#0B0F17', color: '#FFF' }}>
      <Routes>
        {/* 1. Trasa dla Admina */}
        <Route 
          path="/admin" 
          element={<Admin user={user} />} 
        />

        {/* 2. Trasa dla Strony Główny (Home) */}
        <Route 
          path="/" 
          element={
            <>
              <Navbar user={user} onLogout={handleLogout} onOpenAuth={(modal) => setActiveModal(modal)} />
              <Home 
                user={user}
                files={files}
                previews={previews}
                loading={loading}
                loadingMsgIndex={loadingMsgIndex}
                loadingMessages={LOADING_MESSAGES}
                result={result}
                error={error}
                termsAccepted={termsAccepted}
                setTermsAccepted={setTermsAccepted}
                termsError={termsError}
                onFileChange={handleFileChange}
                onRemoveFile={removeFile}
                onAudit={handleAudit}
                onLoadDemo={loadDemoReport}
                onResetAudit={handleResetAudit}
                onOpenModal={(modal) => setActiveModal(modal)}
              />
              <Footer onOpenModal={(modal) => setActiveModal(modal)} />
            </>
          } 
        />
        {/* 🚀 POJEDYNCZY WPIS NA BLOGU (Podstrona SEO) */}
        <Route path="/blog/:slug" element={<BlogPost />} />
        {/* 3. Trasa dla Bloga */}
        <Route 
          path="/blog" 
          element={
            <Blog 
              user={user} 
              onLogout={handleLogout} 
              onOpenAuth={(modal) => setActiveModal(modal)} 
              onOpenModal={(modal) => setActiveModal(modal)} 
            />
          } 
        />
      </Routes>

      {/* MODALE (Auth, Regulamin, Polityka Prywatności) */}
      {activeModal && (
        <div style={modalStyles.modalOverlay}>
          <div style={modalStyles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20 }}>
                {activeModal === 'login' && 'Zaloguj się'}
                {activeModal === 'register' && 'Utwórz konto'}
                {activeModal === 'terms' && 'Regulamin Serwisu'}
                {activeModal === 'privacy' && 'Polityka Prywatności'}
              </h3>
              <button 
                onClick={() => setActiveModal(null)} 
                style={{ background: 'none', border: 'none', color: '#FFF', fontSize: 20, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {(activeModal === 'login' || activeModal === 'register') && (
              <>
                <button onClick={handleGoogleLogin} style={modalStyles.googleBtn}>
                  Kontynuuj przez Google
                </button>

                <div style={modalStyles.divider}>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#374151' }} />
                  <span style={{ padding: '0 10px', color: '#9CA3AF', fontSize: 12 }}>lub przez e-mail</span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#374151' }} />
                </div>

                <form onSubmit={handleEmailAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                  <input 
                    type="email" 
                    required 
                    placeholder="twój@email.com" 
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      setResetSuccess(false);
                    }}
                    style={modalStyles.inputField} 
                  />
                  
                  <input 
                    type="password" 
                    required 
                    placeholder="••••••••" 
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    style={modalStyles.inputField} 
                  />

                  {activeModal === 'login' && (
                    <div style={{ textAlign: 'right', marginTop: -5 }}>
                      <button 
                        type="button" 
                        onClick={handleResetPassword}
                        style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Zapomniałeś hasła?
                      </button>
                    </div>
                  )}

                  {resetSuccess && (
                    <div style={{ color: '#10B981', fontSize: 13, backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 10, borderRadius: 6 }}>
                      ✉️ Link do zresetowania hasła został wysłany na Twój e-mail!
                    </div>
                  )}

                  {authError && <div style={{ color: '#EF4444', fontSize: 12 }}>⚠️ {authError}</div>}

                  <button type="submit" style={modalStyles.submitBtn}>
                    {activeModal === 'login' ? 'Zaloguj się' : 'Załóż konto i przejdź do audytu'}
                  </button>
                </form>
              </>
            )}

            {activeModal === 'terms' && (
  <div style={modalStyles.modalTextScroll}>
    <h4 style={{ color: '#FF2E93', marginTop: 0 }}>REGULAMIN ŚWIADCZENIA USŁUG DROGĄ ELEKTRONICZNĄ (MatchBetter)</h4>
    <p style={{ fontSize: 12, color: '#9CA3AF' }}>Ostatnia aktualizacja: 11 sierpnia 2026 r.</p>
    
    <p><strong>§ 1. Postanowienia ogólne</strong><br />
    1. Niniejszy Regulamin określa zasady korzystania z serwisu internetowego MatchBetter, zwanego dalej „Serwisem”, oraz zasady świadczenia usług drogą elektroniczną za pośrednictwem Serwisu.<br />
    2. Usługodawcą i sprzedawcą jest Mateusz Głębocki, prowadzący działalność na zasadach zgodnych z obowiązującymi przepisami prawa, adres: Bzów 5C/4, 41-700 Ruda Śląska, Polska.<br />
    3. Dane identyfikacyjne Usługodawcy są zgodne z danymi konta zarejestrowanego w HotPay.<br />
    4. Kontakt z Usługodawcą odbywa się za pośrednictwem adresu e-mail używanego w Serwisie lub dostępnego w formularzu kontaktowym Serwisu.<br />
    5. Serwis świadczy usługi drogą elektroniczną zgodnie z przepisami prawa Rzeczypospolitej Polskiej oraz Unii Europejskiej.<br />
    6. Rozpoczęcie korzystania z płatnej usługi wymaga zaakceptowania niniejszego Regulaminu.</p>

    <p><strong>§ 2. Rodzaj i zakres świadczonych usług</strong><br />
    1. MatchBetter świadczy usługę polegającą na automatycznym generowaniu raportów analizy profilu użytkownika, w szczególności zdjęć, opisów oraz innych informacji przekazanych przez Użytkownika w celu przeprowadzenia analizy.<br />
    2. Analiza wykonywana jest z wykorzystaniem algorytmów oraz narzędzi sztucznej inteligencji (AI).<br />
    3. Raport ma charakter informacyjny, edukacyjny i doradczy. Wyniki analizy nie stanowią gwarancji uzyskania określonych rezultatów w aplikacjach randkowych ani gwarancji zwiększenia liczby dopasowań, wiadomości, spotkań lub innych rezultatów.<br />
    4. Usługa jest świadczona w formie cyfrowej i nie obejmuje dostawy fizycznych towarów.<br />
    5. Do korzystania z Serwisu wymagane są: urządzenie z dostępem do Internetu, aktualna przeglądarka internetowa oraz, w przypadku korzystania z konta, aktywny adres e-mail.</p>

    <p><strong>§ 3. Konto Użytkownika</strong><br />
    1. Korzystanie z pełnej funkcjonalności Serwisu może wymagać utworzenia Konta Użytkownika.<br />
    2. Użytkownik zobowiązany jest do podawania prawdziwych i aktualnych danych oraz do zabezpieczenia danych umożliwiających dostęp do jego Konta.<br />
    3. Użytkownik ponosi odpowiedzialność za działania wykonywane z wykorzystaniem jego Konta, z zastrzeżeniem przypadków wynikających z obowiązujących przepisów prawa.</p>

    <p><strong>§ 4. Zasady korzystania z materiałów przesyłanych do Serwisu</strong><br />
    1. Użytkownik oświadcza, że posiada prawo do korzystania z materiałów, w tym zdjęć i opisów, które przesyła do Serwisu, w zakresie niezbędnym do wykonania usługi.<br />
    2. Użytkownik nie może przesyłać materiałów, których wykorzystanie lub przetwarzanie byłoby sprzeczne z prawem.<br />
    3. Zabronione jest przesyłanie treści pornograficznych, treści przedstawiających osoby małoletnie w kontekście seksualnym, treści nawołujących do nienawiści, przemocy lub popełnienia przestępstwa, a także materiałów naruszających prawa lub dobra osobiste osób trzecich.<br />
    4. Użytkownik ponosi odpowiedzialność za zgodność przesyłanych materiałów z prawem oraz za posiadanie odpowiednich praw do ich wykorzystania.</p>

    <p><strong>§ 5. Cena i płatności</strong><br />
    1. Cena każdej płatnej usługi prezentowana jest Użytkownikowi przed dokonaniem płatności.<br />
    2. Płatność za usługę dokonywana jest z góry w formie płatności online.<br />
    3. Dostępne metody płatności są prezentowane Użytkownikowi podczas procesu składania zamówienia i mogą zależeć od aktualnej oferty operatora płatności.<br />
    4. Rozliczenia transakcji e-przelewem i innych płatności online są przeprowadzane za pośrednictwem HotPay.<br />
    5. Przed dokonaniem płatności Użytkownik otrzymuje informację o cenie usługi oraz całkowitej kwocie do zapłaty.<br />
    6. O ile przy konkretnej usłudze nie wskazano inaczej, cena obejmuje wszystkie koszty związane z wykonaniem usługi. Usługa nie wiąże się z kosztami dostawy fizycznej.</p>

    <p><strong>§ 6. Realizacja zamówienia i dostawa</strong><br />
    1. Usługi świadczone przez MatchBetter są usługami cyfrowymi i są realizowane drogą elektroniczną.<br />
    2. Dostawa fizycznych towarów nie jest dostępna.<br />
    3. Realizacja płatnej analizy rozpoczyna się po otrzymaniu potwierdzenia prawidłowego dokonania płatności oraz przekazaniu przez Użytkownika wymaganych materiałów.<br />
    4. Raport jest generowany automatycznie lub przy wykorzystaniu zautomatyzowanych systemów AI, bez konieczności wysyłki fizycznego produktu.<br />
    5. W przypadku wystąpienia przejściowych problemów technicznych uniemożliwiających wykonanie usługi, Usługodawca podejmie działania w celu usunięcia problemu i realizacji zamówienia.</p>

    <p><strong>§ 7. Prawo odstąpienia od umowy</strong><br />
    1. Konsumentowi co do zasady przysługuje prawo odstąpienia od umowy zawartej na odległość w terminie 14 dni, z zastrzeżeniem wyjątków przewidzianych przez przepisy prawa.<br />
    2. W przypadku usługi polegającej na dostarczeniu treści cyfrowych niedostarczanych na nośniku materialnym prawo odstąpienia od umowy może zostać wyłączone, jeżeli spełnianie świadczenia rozpoczęło się za wyraźną i uprzednią zgodą konsumenta przed upływem terminu do odstąpienia od umowy, a konsument został poinformowany przed rozpoczęciem świadczenia, że po jego spełnieniu utraci prawo odstąpienia od umowy i przyjął to do wiadomości.<br />
    3. W przypadku MatchBetter wykonanie analizy może rozpocząć się niezwłocznie po dokonaniu płatności i przesłaniu przez Użytkownika wymaganych materiałów.<br />
    4. Jeżeli przed rozpoczęciem świadczenia Użytkownik wyraził wymaganą prawem zgodę na rozpoczęcie wykonywania usługi przed upływem terminu do odstąpienia od umowy oraz został poinformowany o skutkach tej zgody, po pełnym wykonaniu usługi prawo odstąpienia od umowy może nie przysługiwać zgodnie z obowiązującymi przepisami.</p>

    <p><strong>§ 8. Reklamacje</strong><br />
    1. Użytkownik może składać reklamacje dotyczące działania Serwisu, wykonania usługi lub zgodności usługi z umową.<br />
    2. Reklamację można złożyć drogą elektroniczną za pośrednictwem adresu e-mail używanego w Serwisie lub formularza kontaktowego.<br />
    3. Reklamacja powinna, w miarę możliwości, zawierać opis problemu, dane pozwalające zidentyfikować zamówienie oraz adres e-mail przypisany do Konta Użytkownika.<br />
    4. Reklamacje są rozpatrywane bez zbędnej zwłoki, nie później niż w terminie 14 dni od ich otrzymania, chyba że przepisy prawa przewidują inny termin.<br />
    5. W przypadku uznania reklamacji Usługodawca podejmie działania odpowiednie do charakteru niezgodności, zgodnie z obowiązującymi przepisami prawa.</p>

    <p><strong>§ 9. Zgodność usługi, gwarancja i odpowiedzialność</strong><br />
    1. Usługodawca odpowiada za zgodność świadczonej usługi z umową na zasadach określonych w obowiązujących przepisach prawa.<br />
    2. Jeżeli dla konkretnej usługi nie została udzielona odrębna gwarancja, usługa nie jest objęta dodatkową gwarancją umowną.<br />
    3. Przepisy dotyczące odpowiedzialności Usługodawcy nie wyłączają ani nie ograniczają praw konsumenta wynikających z bezwzględnie obowiązujących przepisów prawa.<br />
    4. Raporty generowane przez AI nie stanowią profesjonalnej porady psychologicznej, medycznej, prawnej ani innej porady wymagającej uprawnień zawodowych.</p>

    <p><strong>§ 10. Warunki zawierania i rozwiązywania umów drogą elektroniczną</strong><br />
    1. Umowa o świadczenie usługi zostaje zawarta w momencie prawidłowego złożenia zamówienia i dokonania płatności, jeżeli dla danej usługi wymagana jest płatność.<br />
    2. Użytkownik może zakończyć korzystanie z Serwisu w dowolnym momencie, z zastrzeżeniem praw i obowiązków wynikających z wcześniej zawartych umów.<br />
    3. Użytkownik może wystąpić o usunięcie Konta na zasadach określonych w Polityce Prywatności.<br />
    4. Usługodawca może ograniczyć lub zablokować dostęp do Serwisu w przypadku korzystania z niego w sposób bezprawny lub naruszający niniejszy Regulamin, z uwzględnieniem obowiązujących przepisów prawa.</p>

    <p><strong>§ 11. Ograniczenia w świadczeniu usług</strong><br />
    1. Usługi są przeznaczone dla osób, które mogą zgodnie z prawem zawierać umowy na odległość.<br />
    2. Usługodawca może odmówić wykonania usługi lub usunąć materiały, których wykorzystanie byłoby sprzeczne z prawem lub niniejszym Regulaminem.<br />
    3. Serwis nie realizuje dostawy produktów fizycznych.</p>

    <p><strong>§ 12. Dane osobowe i prywatność</strong><br />
    1. Zasady przetwarzania danych osobowych określa Polityka Prywatności dostępna w Serwisie.<br />
    2. Użytkownik powinien zapoznać się z Polityką Prywatności przed rozpoczęciem korzystania z usług wymagających przetwarzania danych osobowych.</p>

    <p><strong>§ 13. Prawa autorskie</strong><br />
    1. Prawa do elementów Serwisu, w tym jego oprogramowania, układu, oznaczeń, grafik i materiałów należą do Usługodawcy lub odpowiednich podmiotów uprawnionych.<br />
    2. Bez zgody uprawnionego zabronione jest kopiowanie, rozpowszechnianie lub wykorzystywanie elementów Serwisu w zakresie wykraczającym poza dozwolony użytek wynikający z przepisów prawa.</p>

    <p><strong>§ 14. Zmiany Regulaminu</strong><br />
    1. Usługodawca może zmienić Regulamin z ważnych przyczyn, w szczególności w przypadku zmiany przepisów prawa, sposobu działania Serwisu lub zakresu świadczonych usług.<br />
    2. Zmiany Regulaminu nie naruszają praw nabytych przez Użytkowników przed wejściem zmian w życie.<br />
    3. Aktualna wersja Regulaminu jest dostępna w Serwisie w sposób umożliwiający zapoznanie się z jego treścią.</p>

    <p><strong>§ 15. Postanowienia końcowe</strong><br />
    1. W sprawach nieuregulowanych Regulaminem zastosowanie mają przepisy prawa polskiego, w szczególności przepisy Kodeksu cywilnego, ustawy o prawach konsumenta oraz ustawy o świadczeniu usług drogą elektroniczną.<br />
    2. Postanowienia Regulaminu nie mają na celu ograniczenia praw konsumentów wynikających z bezwzględnie obowiązujących przepisów prawa.</p>
  </div>
)}

{activeModal === 'privacy' && (
  <div style={modalStyles.modalTextScroll}>
    <h4 style={{ color: '#FF2E93', marginTop: 0 }}>POLITYKA PRYWATNOŚCI I KLAUZULA RODO (MatchBetter)</h4>
    <p style={{ fontSize: 12, color: '#9CA3AF' }}>Ostatnia aktualizacja: 11 sierpnia 2026 r.</p>
    
    <p><strong>1. Administrator danych osobowych</strong><br />
    Administratorem danych osobowych przetwarzanych w związku z korzystaniem z Serwisu MatchBetter jest Mateusz Głębocki, adres: Bzów 5C/4, 41-700 Ruda Śląska, Polska.<br /><br />
    Kontakt w sprawach dotyczących danych osobowych możliwy jest za pośrednictwem adresu e-mail używanego w Serwisie lub formularza kontaktowego dostępnego w Serwisie.</p>

    <p><strong>2. Jakie dane przetwarzamy</strong><br />
    W zależności od sposobu korzystania z Serwisu możemy przetwarzać:<br />
    a) adres e-mail oraz identyfikator konta Użytkownika;<br />
    b) informacje związane z logowaniem, w tym dane przekazane przez zewnętrznego dostawcę uwierzytelniania, jeżeli Użytkownik korzysta z logowania zewnętrznego;<br />
    c) zdjęcia, zrzuty ekranu, opisy profilu oraz inne materiały przesłane dobrowolnie przez Użytkownika w celu wykonania analizy;<br />
    d) informacje dotyczące zamówień i płatności, niezbędne do obsługi transakcji i rozliczeń;<br />
    e) dane techniczne związane z korzystaniem z Serwisu, takie jak informacje o urządzeniu, przeglądarce, adresie IP oraz informacje dotyczące bezpieczeństwa i działania Serwisu.</p>

    <p><strong>3. Cele i podstawy prawne przetwarzania danych</strong><br />
    Dane osobowe przetwarzamy w następujących celach:<br />
    a) utworzenie i obsługa Konta Użytkownika – na podstawie art. 6 ust. 1 lit. b RODO, jeżeli przetwarzanie jest niezbędne do wykonania umowy;<br />
    b) wykonanie zamówionej analizy AI – na podstawie art. 6 ust. 1 lit. b RODO, w zakresie niezbędnym do wykonania usługi, oraz odpowiednio na podstawie zgody, jeżeli jej uzyskanie jest wymagane dla konkretnego sposobu przetwarzania;<br />
    c) obsługa płatności i rozliczeń – na podstawie art. 6 ust. 1 lit. b oraz lit. c RODO, w zależności od rodzaju obowiązku prawnego;<br />
    d) obsługa reklamacji i kontakt z Użytkownikiem – na podstawie art. 6 ust. 1 lit. b, lit. c lub lit. f RODO, zależnie od charakteru sprawy;<br />
    e) zapewnienie bezpieczeństwa Serwisu i zapobieganie nadużyciom – na podstawie art. 6 ust. 1 lit. f RODO;<br />
    f) ustalenie, dochodzenie lub obrona przed roszczeniami – na podstawie art. 6 ust. 1 lit. f RODO.</p>

    <p><strong>4. Przetwarzanie zdjęć i materiałów przesyłanych do analizy</strong><br />
    1. Materiały przesłane przez Użytkownika są wykorzystywane w celu wykonania zamówionej analizy.<br />
    2. Materiały mogą być przekazywane dostawcom technologii niezbędnej do wykonania analizy AI, zgodnie z zasadami opisanymi w niniejszej Polityce Prywatności.<br />
    3. Zdjęcia i inne materiały wykorzystywane do analizy nie są wykorzystywane przez MatchBetter do trenowania publicznie dostępnych modeli AI.<br />
    4. Materiały mogą być przechowywane przez okres niezbędny do wykonania usługi oraz przez okres konieczny do zapewnienia bezpieczeństwa, rozpatrywania reklamacji lub obrony przed roszczeniami.<br />
    5. Jeżeli konkretne dane nie są już niezbędne do realizacji celu, zostaną usunięte lub zanonimizowane zgodnie z obowiązującymi procedurami i przepisami prawa.</p>

    <p><strong>5. Podmioty, którym mogą być przekazywane dane</strong><br />
    W celu prawidłowego działania Serwisu dane mogą być przekazywane zaufanym dostawcom usług technologicznych, w szczególności:<br />
    - Google Firebase / Google Cloud – uwierzytelnianie, przechowywanie danych i infrastruktura techniczna;<br />
    - Render lub inni dostawcy hostingu – utrzymanie infrastruktury aplikacji;<br />
    - dostawcy modeli i usług AI – przetwarzanie materiałów w celu wykonania analizy;<br />
    - HotPay – obsługa płatności online i rozliczeń transakcji.<br /><br />
    Zakres przekazywanych danych jest ograniczany do danych niezbędnych do wykonania konkretnej usługi. Dostawcy przetwarzają dane zgodnie z obowiązującymi przepisami oraz, w odpowiednich przypadkach, na podstawie umów powierzenia przetwarzania danych.</p>

    <p><strong>6. Przekazywanie danych poza Europejski Obszar Gospodarczym</strong><br />
    Niektórzy dostawcy technologii mogą przetwarzać dane poza Europejskim Obszarem Gospodarczym. Jeżeli w związku z korzystaniem z danego dostawcy dojdzie do takiego przekazania, Administrator podejmuje działania wymagane przez RODO w celu zapewnienia odpowiedniego poziomu ochrony danych, w szczególności poprzez zastosowanie odpowiednich mechanizmów prawnych przewidzianych w RODO.</p>

    <p><strong>7. Okres przechowywania danych</strong><br />
    1. Dane Konta przechowujemy przez okres posiadania aktywnego Konta, a następnie przez okres niezbędny do realizacji obowiązków prawnych lub ochrony przed roszczeniami.<br />
    2. Dane dotyczące płatności i transakcji mogą być przechowywane przez okres wymagany przepisami podatkowymi i rachunkowymi.<br />
    3. Dane związane z reklamacjami mogą być przechowywane przez okres niezbędny do jej rozpatrzenia, a następnie przez okres wymagany do ochrony przed ewentualnymi roszczeniami.<br />
    4. Materiały przesłane do analizy są przechowywane nie dłużej niż jest to niezbędne do wykonania usługi oraz realizacji uzasadnionych celów technicznych i prawnych.</p>

    <p><strong>8. Prawa Użytkownika</strong><br />
    W zakresie przewidzianym przez RODO Użytkownik ma prawo do:<br />
    - dostępu do swoich danych osobowych;<br />
    - uzyskania kopii danych;<br />
    - sprostowania nieprawidłowych lub niekompletnych danych;<br />
    - usunięcia danych („prawo do bycia zapomnianym”);<br />
    - ograniczenia przetwarzania danych;<br />
    - przenoszenia danych, jeżeli ma zastosowanie;<br />
    - wniesienia sprzeciwu wobec przetwarzania opartego na prawnie uzasadnionym interesie Administratora;<br />
    - cofnięcia zgody w dowolnym momencie, jeżeli przetwarzanie odbywa się na podstawie zgody.<br /><br />
    Cofnięcie zgody nie wpływa na zgodność z prawem przetwarzania dokonanego przed jej cofnięciem.</p>

    <p><strong>9. Prawo wniesienia skargi</strong><br />
    Użytkownik ma prawo wniesienia skargi do właściwego organu nadzorczego, w szczególności do Prezesa Urzędu Ochrony Danych Osobowych, jeżeli uzna, że przetwarzanie jego danych osobowych narusza przepisy RODO.</p>

    <p><strong>10. Pliki cookies i Local Storage</strong><br />
    1. Serwis może wykorzystywać niezbędne pliki cookies oraz mechanizmy lokalnego przechowywania danych, takie jak Local Storage, w celu zapewnienia prawidłowego działania Serwisu, utrzymania sesji użytkownika oraz zapewnienia bezpieczeństwa.<br />
    2. Jeżeli w Serwisie zostaną zastosowane dodatkowe pliki cookies, w szczególności analityczne lub marketingowe, użytkownik zostanie poinformowany o ich stosowaniu zgodnie z obowiązującymi przepisami.</p>

    <p><strong>11. Bezpieczeństwo danych</strong><br />
    Administrator stosuje odpowiednie środki techniczne i organizacyjne mające na celu ochronę danych osobowych przed nieuprawnionym dostępem, utratą, zniszczeniem, zmianą lub nieuprawnionym ujawnieniem.</p>

    <p><strong>12. Dobrowolność podania danych</strong><br />
    Podanie danych niezbędnych do założenia Konta, realizacji zamówienia lub obsługi płatności jest wymagane do korzystania z odpowiednich funkcjonalności Serwisu. Podanie pozostałych danych może być dobrowolne, o ile nie wynika inaczej z przepisów prawa lub charakteru usługi.</p>

    <p><strong>13. Zmiany Polityki Prywatności</strong><br />
    Administrator może aktualizować niniejszą Politykę Prywatności, w szczególności w przypadku zmian przepisów prawa, sposobu działania Serwisu lub wykorzystywanych usług technologicznych. Aktualna wersja Polityki Prywatności jest dostępna w Serwisie.</p>
  </div>
)}
          </div>
        </div>
      )}
    </div>
  );
}

const modalStyles = {
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modalContent: { backgroundColor: '#111827', border: '1px solid #1F2937', padding: 30, borderRadius: 20, width: '100%', maxWidth: 450, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' },
  modalTextScroll: { overflowY: 'auto', color: '#D1D5DB', fontSize: 14, lineHeight: 1.6, paddingRight: 10 },
  inputField: { width: '100%', backgroundColor: '#1F2937', border: '1px solid #374151', color: '#FFF', padding: '12px', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
  googleBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', color: '#1F2937', border: 'none', padding: '12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, width: '100%' },
  divider: { display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '20px 0' },
  submitBtn: { width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: 'linear-gradient(90deg, #FF2E93, #8A2BE2)', color: '#FFF', fontSize: 15, fontWeight: 'bold', cursor: 'pointer' }
};