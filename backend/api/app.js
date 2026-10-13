require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const crypto = require('crypto');
const multer = require('multer');
const upload = multer();
const setupEmailRoute = require('./EMAIL_BACKEND_READY.js');
const app = express();

// --- Konfiguracja HotPay (dane z .env, nigdy nie na sztywno w kodzie) ---
const HOTPAY_SEKRET = process.env.HOTPAY_SEKRET;
const HOTPAY_HASLO_NOTYFIKACJI = process.env.HOTPAY_HASLO_NOTYFIKACJI;
const HOTPAY_KWOTA = process.env.HOTPAY_KWOTA || '39.00';
const HOTPAY_NAZWA_USLUGI = process.env.HOTPAY_NAZWA_USLUGI || 'Analiza profilu MatchBetter';
const HOTPAY_RETURN_URL = process.env.HOTPAY_RETURN_URL || 'https://matchbetter.com.pl/platnosc-potwierdzenie';
const HOTPAY_PAYMENT_URL = 'https://platnosc.hotpay.pl/';

// --- Bezpieczeństwo: nagłówki HTTP (helmet) ---
// CSP wyłączone, bo strona ładuje zewnętrzne fonty/skrypty które trzeba by osobno wypisać;
// żeby nie zablokować działającej strony, zostawiamy to wyłączone na razie.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.disable('x-powered-by');

// Konfiguracja CORS - whitelist zamiast '*', żeby API nie mogło być
// wywoływane z dowolnej strony trzeciej.
// Domeny "na sztywno" + dodatkowe z .env (ALLOWED_ORIGINS, oddzielone przecinkiem) -
// przydatne np. dla tymczasowej domeny hostingu (typu *.usermd.net) zanim
// wpięta zostanie docelowa domena matchbetter.com.pl.
const extraOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = [
  'https://matchbetter.com.pl',
  'https://www.matchbetter.com.pl',
  'https://matchbetter.usermd.net',
  'http://localhost:5173',
  'http://localhost:3000',
  // Aplikacja mobilna z Capacitor (Android) wysyła zapytania z origin "https://localhost"
  'https://localhost',
  'capacitor://localhost',
  ...extraOrigins,
];

app.use(cors({
  origin: (origin, callback) => {
    // brak origin = zapytania server-to-server (np. notyfikacja HotPay) - dopuszczamy
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('⚠️ CORS zablokował żądanie z origin:', origin);
      // Ważne: callback(null, false) zamiast callback(new Error(...)) -
      // dzięki temu przeglądarka dostaje normalną odpowiedź bez CORS-headerów
      // (i widzi to jako błąd CORS), zamiast że serwer wywala 500 przez
      // nieobsłużony wyjątek w cors().
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting - ochrona przed nadużyciami/DDoS na endpointach /api/*
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 300,
  message: 'Zbyt wiele żądań, spróbuj ponownie później',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development',
});
app.use('/api/', apiLimiter);

// Limit podniesiony do 25mb - endpoint /api/send-report-email dostaje zdjęcia
// zakodowane w base64 w treści żądania, które łatwo przekraczają domyślne 100kb.
app.use(express.json({ limit: '50mb' }));
// HotPay może wysyłać notyfikację jako zwykły formularz (application/x-www-form-urlencoded),
// a nie multipart/form-data - bez tego req.body byłby undefined dla takich żądań.
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Połączenie z bazą danych PostgreSQL (dane z .env, nie na sztywno w kodzie)
const db = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
db.on('error', (err) => {
  console.error('Nieoczekiwany błąd puli połączeń PostgreSQL:', err);
});

// Tworzymy tabele, jeśli jeszcze nie istnieją (odpowiednik CREATE TABLE IF NOT EXISTS z MySQL)
async function ensureSchema() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      firebase_uid VARCHAR(128) UNIQUE,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      password_hash VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // Zgoda marketingowa jest DOBROWOLNA - domyślnie false, użytkownik może ją
  // zaznaczyć opcjonalnie obok akceptacji regulaminu. Zapisujemy też moment
  // wyrażenia zgody (wymóg RODO - trzeba umieć wykazać kiedy i czy zgoda była dana).
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_consent_at TIMESTAMP`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS reports (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      overall_score INTEGER,
      profile_name VARCHAR(255),
      report_data JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // Od wersji bez logowania: raport nie musi już być powiązany z wierszem w
  // tabeli `users` (user_id może być NULL) - zamiast tego zapisujemy e-mail
  // podany przy zamówieniu oraz wybrany cel ("długoterminowo"/"na szybko"),
  // żeby raport dało się odnaleźć/zidentyfikować bez konta.
  await db.query(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS email VARCHAR(255)`);
  await db.query(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS relationship_goal VARCHAR(32)`);
  // Wyniki ankiety z kroków 2 i 3 kreatora (do 3 wybranych cech każda) -
  // przechowywane jako JSON, żeby nie zakładać sztywnej liczby kolumn.
  await db.query(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS attract_traits JSONB`);
  await db.query(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS self_traits JSONB`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      order_id VARCHAR(64) UNIQUE NOT NULL,
      uid VARCHAR(128),
      email VARCHAR(255),
      amount VARCHAR(20),
      status VARCHAR(20) DEFAULT 'PENDING',
      id_platnosci VARCHAR(64),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // Kod rabatowy zastosowany do danej płatności (jeśli w ogóle) - do raportowania/audytu,
  // żeby zawsze było wiadomo ile faktycznie zapłacił klient i z jakiego kodu skorzystał.
  await db.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(64)`);
  await db.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0`);
  // Od wersji bez logowania: zgoda marketingowa jest zbierana razem z zamówieniem
  // (nie ma już konta/tabeli users powiązanej z tym klientem), więc zapisujemy ją
  // bezpośrednio na wierszu płatności.
  await db.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false`);
  await db.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS marketing_consent_at TIMESTAMP`);

  // Kody rabatowe: prosty procentowy rabat od ceny bazowej (HOTPAY_KWOTA).
  // "active" pozwala wyłączyć kod bez usuwania go (zachowuje historię użycia w payments).
  await db.query(`
    CREATE TABLE IF NOT EXISTS coupons (
      code VARCHAR(64) PRIMARY KEY,
      discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // Kolumny używane przez jednorazowe kody -15% wysyłane mailem po dostarczeniu
  // raportu (patrz EMAIL_BACKEND_READY.js) - osobna funkcja niż ręcznie zakładane
  // kody promocyjne typu RABAT10, ale współdzielą tę samą tabelę.
  await db.query(`ALTER TABLE coupons ADD COLUMN IF NOT EXISTS usage_limit INTEGER DEFAULT 1`);
  await db.query(`ALTER TABLE coupons ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0`);
  await db.query(`ALTER TABLE coupons ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP`);
  await db.query(`ALTER TABLE coupons ADD COLUMN IF NOT EXISTS recipient_email VARCHAR(255)`);
  // Domyślny kod startowy -10%. Żeby dodać kolejne kody, wystarczy zwykły INSERT, np.:
  //   INSERT INTO coupons (code, discount_percent) VALUES ('LATO20', 20);
  // Żeby wyłączyć kod bez usuwania:
  //   UPDATE coupons SET active = false WHERE code = 'RABAT10';
  await db.query(`
    INSERT INTO coupons (code, discount_percent) VALUES ('RABAT10', 10)
    ON CONFLICT (code) DO NOTHING
  `);
}
const schemaReady = ensureSchema().catch((err) => {
  console.error('Błąd tworzenia schematu PostgreSQL:', err);
});

// Rejestracja endpointu POST /api/send-report-email - MUSI być po utworzeniu
// `db` i przekazywać je dalej, inaczej środek endpointu dostaje `db=undefined`
// i wywala się przy próbie zapisania kodu promocyjnego w bazie.
setupEmailRoute(app, db, schemaReady);

// Synchronizacja użytkownika Firebase -> tabela `users`.
// UWAGA: ten sam człowiek może logować się różnymi metodami (Google, e-mail/hasło),
// co w Firebase czasem oznacza RÓŻNE firebase_uid dla tego samego adresu e-mail.
// Traktujemy e-mail jako "tożsamość" użytkownika: jeśli już istnieje wiersz z tym
// e-mailem (ale innym firebase_uid, bo zalogował się inną metodą), aktualizujemy
// go zamiast wywalać błąd unikalności - dzięki temu jego historia (raporty,
// płatności) zostaje widoczna niezależnie od tego, jak akurat się zalogował.
app.post('/api/sync-user', async (req, res) => {
  const { uid, email, name } = req.body;

  if (!uid || !email) {
    return res.status(400).json({ error: 'Brak wymaganych pól uid/email' });
  }

  try {
    // 1) Może już istnieć wiersz z tym samym firebase_uid (najczęstszy przypadek -
    //    ten sam użytkownik loguje się ponownie tą samą metodą).
    const byUid = await db.query(
      `UPDATE users SET email = $2, name = $3 WHERE firebase_uid = $1 RETURNING id`,
      [uid, email, name || 'Użytkownik']
    );

    if (byUid.rows.length > 0) {
      return res.json({ success: true, uid });
    }

    // 2) Brak wiersza z tym firebase_uid - ale może istnieć wiersz z tym samym
    //    e-mailem, założony wcześniej przy logowaniu INNĄ metodą. W takim
    //    wypadku "przepinamy" ten wiersz na nowy firebase_uid, zamiast zakładać
    //    duplikat (co i tak wywaliłoby się na UNIQUE(email)).
    const byEmail = await db.query(
      `UPDATE users SET firebase_uid = $1, name = $3 WHERE email = $2 RETURNING id`,
      [uid, email, name || 'Użytkownik']
    );

    if (byEmail.rows.length > 0) {
      return res.json({ success: true, uid });
    }

    // 3) Naprawdę nowy użytkownik - ani po uid, ani po e-mailu nic nie znaleziono.
    await db.query(
      `INSERT INTO users (firebase_uid, email, name) VALUES ($1, $2, $3)`,
      [uid, email, name || 'Użytkownik']
    );
    res.json({ success: true, uid });
  } catch (err) {
    console.error("Błąd PostgreSQL (sync-user):", err);
    res.status(500).json({
      error: 'Błąd zapisu do bazy SQL'
    });
  }
});

// Zapis dobrowolnej zgody marketingowej (checkbox obok akceptacji regulaminu).
// Zgoda NIE jest wymagana do skorzystania z usługi - ten endpoint tylko
// odnotowuje wybór użytkownika (true/false) razem z datą, żeby móc to
// wykazać zgodnie z RODO.
app.post('/api/consent', async (req, res) => {
  const { uid, marketingConsent } = req.body;

  if (!uid) {
    return res.status(400).json({ error: 'Brak uid użytkownika' });
  }

  try {
    const consent = !!marketingConsent;
    await db.query(
      `UPDATE users
       SET marketing_consent = $1,
           marketing_consent_at = CASE WHEN $1 THEN NOW() ELSE NULL END
       WHERE firebase_uid = $2`,
      [consent, uid]
    );
    res.json({ success: true, marketingConsent: consent });
  } catch (err) {
    console.error('Błąd zapisu zgody marketingowej:', err);
    res.status(500).json({
      error: 'Błąd zapisu zgody marketingowej do SQL'
    });
  }
});

// Pobranie raportów danego użytkownika (identyfikowanego przez firebase_uid)
app.get('/api/reports/:uid', async (req, res) => {
  const { uid } = req.params;

  try {
    const { rows: userRows } = await db.query(
      'SELECT id FROM users WHERE firebase_uid = $1 LIMIT 1',
      [uid]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'Nie znaleziono użytkownika' });
    }

    const userId = userRows[0].id;

    const { rows: reportRows } = await db.query(
      'SELECT id, created_at, overall_score, profile_name, report_data FROM reports WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json(reportRows);
  } catch (err) {
    console.error("Błąd PostgreSQL (reports):", err);
    res.status(500).json({
      error: 'Błąd pobierania raportów z SQL'
    });
  }
});

// Zapis nowego raportu - działa bez konta: jedyny wymóg to podanie e-maila,
// na który raport został wysłany. `uid` (jeśli jest - np. anonimowe konto
// Firebase) jest opcjonalny i, o ile pasujący wiersz w `users` istnieje,
// używany tylko do powiązania raportu z nim (wsteczna kompatybilność).
app.post('/api/reports', async (req, res) => {
  const { uid, email, relationship_goal, attract_traits, self_traits, overall_score, profile_name, report_data } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Brak adresu e-mail' });
  }

  try {
    let userId = null;
    if (uid) {
      const { rows: userRows } = await db.query(
        'SELECT id FROM users WHERE firebase_uid = $1 LIMIT 1',
        [uid]
      );
      if (userRows.length > 0) userId = userRows[0].id;
    }

    const { rows: result } = await db.query(
      `INSERT INTO reports (user_id, email, relationship_goal, attract_traits, self_traits, overall_score, profile_name, report_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        userId, email, relationship_goal || null,
        JSON.stringify(attract_traits || []), JSON.stringify(self_traits || []),
        overall_score, profile_name, JSON.stringify(report_data)
      ]
    );

    res.json({ success: true, reportId: result[0].id });
  } catch (err) {
    console.error("Błąd PostgreSQL (create report):", err);
    res.status(500).json({ error: 'Błąd zapisu raportu do SQL' });
  }
});

// Cena bazowa (przed ewentualnym rabatem) - front-end pobiera ją stąd,
// żeby wyświetlić aktualną cenę i przeliczyć podgląd rabatu.
app.get('/api/pricing', (req, res) => {
  res.json({
    basePrice: HOTPAY_KWOTA,
    currency: 'PLN'
  });
});

// Sprawdza czy podany kod rabatowy jest ważny i zwraca przeliczoną cenę -
// używane przez front-end WYŁĄCZNIE do podglądu ceny. Ostateczna, wiążąca
// weryfikacja i przeliczenie zawsze odbywa się ponownie po stronie serwera
// w /api/payment/create, więc front-end nie może "oszukać" ceny.
app.post('/api/coupon/validate', async (req, res) => {
  const { code } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ valid: false, error: 'Podaj kod rabatowy' });
  }

  try {
    const { rows } = await db.query(
      'SELECT code, discount_percent FROM coupons WHERE UPPER(code) = UPPER($1) AND active = true LIMIT 1',
      [code.trim()]
    );

    if (rows.length === 0) {
      return res.json({ valid: false, error: 'Nieprawidłowy lub nieaktywny kod rabatowy' });
    }

    const discountPercent = rows[0].discount_percent;
    const basePrice = parseFloat(HOTPAY_KWOTA);
    const finalPrice = (basePrice * (1 - discountPercent / 100)).toFixed(2);

    res.json({
      valid: true,
      code: rows[0].code,
      discountPercent,
      basePrice: basePrice.toFixed(2),
      finalPrice
    });
  } catch (err) {
    console.error('Błąd walidacji kodu rabatowego:', err);
    res.status(500).json({ valid: false, error: 'Błąd serwera przy sprawdzaniu kodu rabatowego' });
  }
});

// 1) Utworzenie zamówienia płatności - zwraca dane formularza, który front-end
//    wyśle (przekierowanie przeglądarki) do HotPay.
app.post('/api/payment/create', async (req, res) => {
  const { uid, email, couponCode, marketingConsent } = req.body;

  if (!HOTPAY_SEKRET || !HOTPAY_HASLO_NOTYFIKACJI) {
    console.error('Brak HOTPAY_SEKRET / HOTPAY_HASLO_NOTYFIKACJI w .env');
    return res.status(500).json({ error: 'Płatności nie są jeszcze skonfigurowane na serwerze.' });
  }
  if (HOTPAY_HASLO_NOTYFIKACJI.includes('WKLEJ_TU')) {
    console.error('HOTPAY_HASLO_NOTYFIKACJI to wciąż placeholder - trzeba wkleić prawdziwą wartość z panelu HotPay!');
    return res.status(500).json({ error: 'HOTPAY_HASLO_NOTYFIKACJI w .env to wciąż placeholder - wklej prawdziwe hasło notyfikacji z panelu HotPay.' });
  }

  // Cena zawsze liczona od nowa na serwerze - NIGDY nie ufamy kwocie/rabatowi
  // przysłanemu przez front-end, tylko własnej cenie bazowej (.env) i kodowi
  // rabatowemu sprawdzonemu tutaj w bazie danych.
  let amount = HOTPAY_KWOTA;
  let appliedCouponCode = null;
  let discountPercent = 0;

  if (couponCode && couponCode.trim()) {
    try {
      const { rows } = await db.query(
        'SELECT code, discount_percent FROM coupons WHERE UPPER(code) = UPPER($1) AND active = true LIMIT 1',
        [couponCode.trim()]
      );

      if (rows.length > 0) {
        discountPercent = rows[0].discount_percent;
        appliedCouponCode = rows[0].code;
        const basePrice = parseFloat(HOTPAY_KWOTA);
        amount = (basePrice * (1 - discountPercent / 100)).toFixed(2);
      } else {
        console.warn('⚠️ Próba użycia nieprawidłowego/nieaktywnego kodu rabatowego przy tworzeniu płatności:', couponCode);
      }
    } catch (err) {
      // Jeśli sprawdzenie kodu się nie uda, nie blokujemy płatności -
      // po prostu naliczamy pełną cenę bazową.
      console.error('Błąd sprawdzania kodu rabatowego przy tworzeniu płatności:', err);
    }
  }

  const orderId = crypto.randomUUID();

  try {
    await db.query(
      `INSERT INTO payments (order_id, uid, email, amount, status, coupon_code, discount_percent, marketing_consent, marketing_consent_at)
       VALUES ($1, $2, $3, $4, 'PENDING', $5, $6, $7, CASE WHEN $7 THEN NOW() ELSE NULL END)`,
      [orderId, uid || null, email || null, amount, appliedCouponCode, discountPercent, !!marketingConsent]
    );

    // Adres powrotu MUSI być identyczny w polu ADRES_WWW i w wyliczeniu HASH-a
    const adresWww = `${HOTPAY_RETURN_URL}?order=${orderId}`;

    // HASH = sha256("HASLO_Z_USTAWIEN;KWOTA;NAZWA_USLUGI;ADRES_WWW;ID_ZAMOWIENIA;SEKRET")
    // Uwaga: KWOTA to już cena PO rabacie (jeśli zastosowano poprawny kod) -
    // to właśnie ta kwota zostanie pobrana przez HotPay.
    const hash = crypto
      .createHash('sha256')
      .update(
        `${HOTPAY_HASLO_NOTYFIKACJI};${amount};${HOTPAY_NAZWA_USLUGI};${adresWww};${orderId};${HOTPAY_SEKRET}`
      )
      .digest('hex');

    res.json({
      actionUrl: HOTPAY_PAYMENT_URL,
      fields: {
        SEKRET: HOTPAY_SEKRET,
        KWOTA: amount,
        NAZWA_USLUGI: HOTPAY_NAZWA_USLUGI,
        ADRES_WWW: adresWww,
        ID_ZAMOWIENIA: orderId,
        EMAIL: email || '',
        HASH: hash
      }
    });
  } catch (err) {
    console.error('Błąd tworzenia płatności HotPay:', err);
    res.status(500).json({
      error: 'Błąd tworzenia płatności'
    });
  }
});

// 2) Notyfikacja serwer->serwer wysyłana przez HotPay po zakończeniu płatności.
app.post('/api/payment/notify', upload.none(), async (req, res) => {
  try {
    const body = req.body || {};
    const { SEKRET, KWOTA, STATUS, ID_ZAMOWIENIA, ID_PLATNOSCI, SECURE, HASH } = body;
    console.log('📩 Notyfikacja HotPay dla zamówienia', ID_ZAMOWIENIA, '- status:', STATUS);

    if (!KWOTA || !ID_PLATNOSCI || !ID_ZAMOWIENIA || !STATUS || !SEKRET || !SECURE || !HASH) {
      console.warn('⚠️ Notyfikacja HotPay: brak wymaganych pól w req.body:', JSON.stringify(body));
      return res.status(400).send('Brak wymaganych pól');
    }

    const expectedHash = crypto
      .createHash('sha256')
      .update(
        `${HOTPAY_HASLO_NOTYFIKACJI};${KWOTA};${ID_PLATNOSCI};${ID_ZAMOWIENIA};${STATUS};${SECURE};${SEKRET}`
      )
      .digest('hex');

    if (expectedHash !== HASH) {
      console.warn('⚠️ Nieprawidłowy HASH notyfikacji HotPay dla zamówienia', ID_ZAMOWIENIA, '- oczekiwano:', expectedHash, 'otrzymano:', HASH);
      return res.status(400).send('Nieprawidłowy HASH');
    }

    await db.query(
      `UPDATE payments SET status = $1, id_platnosci = $2 WHERE order_id = $3`,
      [STATUS, ID_PLATNOSCI, ID_ZAMOWIENIA]
    );
    console.log('✅ Zaktualizowano status płatności', ID_ZAMOWIENIA, '->', STATUS);
    res.send('OK');
  } catch (err) {
    console.error('❌ Błąd w /api/payment/notify:', err);
    res.status(500).json({ error: 'Błąd serwera', message: err.message });
  }
});

// 3) Front-end odpytuje ten endpoint po powrocie użytkownika z HotPay.
app.get('/api/payment/status/:orderId', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT status FROM payments WHERE order_id = $1 LIMIT 1',
      [req.params.orderId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Nie znaleziono zamówienia' });
    }
    res.json({ status: rows[0].status });
  } catch (err) {
    console.error('Błąd sprawdzania statusu płatności:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Zapis zakupu z aplikacji mobilnej (Google Play, przez RevenueCat) do tej
// samej tabeli "payments" co HotPay - żeby historia płatności na profilu
// użytkownika obejmowała oba źródła. WAŻNE: to jest zapis POMOCNICZY do
// wyświetlania historii, a NIE weryfikacja płatności - o tym, czy zakup w
// Google Play jest faktycznie ważny, decyduje RevenueCat/Google (front-end
// woła ten endpoint dopiero PO potwierdzeniu zakupu przez Purchases SDK).
app.post('/api/payment/record-native', async (req, res) => {
  const { uid, transactionId, productId, amount, currency } = req.body;

  if (!uid || !transactionId) {
    return res.status(400).json({ error: 'Brak wymaganych pól (uid, transactionId)' });
  }

  try {
    await db.query(
      `INSERT INTO payments (order_id, uid, amount, status, id_platnosci, coupon_code, discount_percent)
       VALUES ($1, $2, $3, 'SUCCESS', $4, $5, 0)
       ON CONFLICT (order_id) DO NOTHING`,
      [
        `GOOGLEPLAY-${transactionId}`,
        uid,
        amount || null,
        `${productId || 'unknown'} (${currency || ''})`.trim(),
        'google_play'
      ]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Błąd zapisu zakupu z Google Play:', err);
    res.status(500).json({ error: 'Błąd zapisu do bazy' });
  }
});

// 4) Historia płatności danego użytkownika (do wyświetlenia na profilu)
app.get('/api/payments/:uid', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT order_id, amount, status, id_platnosci, created_at, updated_at
       FROM payments WHERE uid = $1 ORDER BY created_at DESC`,
      [req.params.uid]
    );
    res.json(rows);
  } catch (err) {
    console.error('Błąd pobierania historii płatności:', err);
    res.status(500).json({
      error: 'Błąd pobierania płatności z SQL'
    });
  }
});

// Globalny handler błędów - łapie wyjątki, które wyleciałyby poza nasze
// try/catch (np. z middleware multer/express). Pełny szczegół trafia tylko
// do logów serwera, do klienta idzie ogólny komunikat.
app.use((err, req, res, next) => {
  console.error('❌ Nieobsłużony błąd Express na', req.method, req.path, ':', err);
  res.status(500).json({ error: 'Nieobsłużony błąd serwera' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API działa na porcie ${PORT}`));
