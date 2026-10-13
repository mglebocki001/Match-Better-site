/**
 * 📧 GOTOWY KOD DO WYSYŁANIA EMAILA Z RAPORTEM
 *
 * Użycie:
 * 1. npm install nodemailer dotenv
 * 2. Dodaj do .env: EMAIL_USER, EMAIL_PASSWORD (Gmail App Password)
 * 3. Wklej ten kod do swojego Express app'a
 * 4. Restart serwera
 *
 * ⚠️ Gmail App Password: https://myaccount.google.com/apppasswords
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

// ─────────────────────────────────────────────────────────────
// KONFIGURACJA TRANSPORTU EMAIL'OWA
// ─────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,     // np. noreply@matchbetter.com.pl
    pass: process.env.EMAIL_PASSWORD   // Gmail App Password (nie zwykłe hasło!)
  }
});

// ─────────────────────────────────────────────────────────────
// FUNKCJA GENERUJĄCA HTML RAPORTU
// ─────────────────────────────────────────────────────────────

function generateReportHTML(reportData, images, language) {
  const isPolish = language === 'pl';

  // reportData ma dwa poziomy: część pól (overall_score, photo_by_photo, bio) jest
  // na najwyższym poziomie, a część (summary, one_great_thing, top_5_improvements)
  // jest zagnieżdżona w reportData.overview
  const root = reportData.data || reportData;
  const overview = root.overview || root;

  const overallScore = root.overall_score || 0;
  const summary = overview.overall_action_plan_summary || overview.podsumowanie || '';
  const greatThing = overview.one_great_thing || overview.zalety || '';
  const photoByPhoto = Array.isArray(root.photo_by_photo) ? root.photo_by_photo : [];
  const bioResult = root.bio || null;
  const improvements = overview.top_5_improvements || [];

  const scoreColor = overallScore >= 70 ? '#22C55E' : overallScore >= 45 ? '#F5A524' : '#F5455C';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          background: #0B0B10;
          color: #F7F7FA;
          line-height: 1.6;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: #16161E;
          border-radius: 16px;
          padding: 40px 24px;
          border: 1px solid rgba(255,255,255,0.07);
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          padding-bottom: 24px;
        }
        .logo {
          font-size: 28px;
          font-weight: 800;
          color: #E19CFB;
          margin-bottom: 12px;
          letter-spacing: -0.5px;
        }
        .title {
          font-size: 22px;
          font-weight: 700;
          margin: 12px 0;
          color: #F7F7FA;
        }
        .subtitle {
          margin: 12px 0;
          color: #A5A5B2;
          font-size: 14px;
        }
        .score-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          background: rgba(192,38,211,0.15);
          border: 1px solid rgba(192,38,211,0.35);
          border-radius: 14px;
          margin-top: 16px;
        }
        .score-value {
          font-size: 32px;
          font-weight: 800;
          color: ${scoreColor};
        }
        .score-max {
          font-size: 14px;
          color: #A5A5B2;
          font-weight: 600;
        }
        .section {
          margin-top: 32px;
        }
        .section-title {
          font-size: 18px;
          font-weight: 700;
          color: #E19CFB;
          margin-bottom: 16px;
        }
        .summary-box {
          background: #1A1A23;
          padding: 16px 18px;
          border-radius: 10px;
          border-left: 4px solid #C026D3;
          margin-bottom: 12px;
        }
        .summary-box.success {
          border-left-color: #22C55E;
        }
        .summary-label {
          color: #E19CFB;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
          display: block;
        }
        .summary-box.success .summary-label {
          color: #22C55E;
        }
        .summary-text {
          margin: 0;
          color: #A5A5B2;
          font-size: 14px;
          line-height: 1.6;
        }
        .bio-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 12px;
        }
        .bio-card {
          background: #1A1A23;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          padding: 16px;
        }
        .bio-card.highlight {
          border: 1px solid rgba(192,38,211,0.35);
          background: #1A1A23;
        }
        .bio-label {
          font-size: 12px;
          color: #72727E;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
          display: block;
        }
        .bio-card.highlight .bio-label {
          color: #E9A6FF;
        }
        .bio-text {
          color: #A5A5B2;
          font-size: 14px;
          line-height: 1.6;
          margin: 10px 0;
        }
        .bio-why {
          color: #E9A6FF;
          border-top: 1px solid rgba(255,255,255,0.07);
          padding-top: 8px;
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
        }
        .improvements-list {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .improvement-item {
          background: #1A1A23;
          padding: 14px 16px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.07);
        }
        .improvement-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #1A1A23;
          color: #F5A0AC;
          font-size: 12px;
          font-weight: 800;
          margin-right: 8px;
          flex-shrink: 0;
        }
        .improvement-title {
          font-weight: 700;
          color: #FFF;
          margin: 0 0 8px 0;
          font-size: 14px;
          display: flex;
          align-items: center;
        }
        .improvement-body {
          color: #A5A5B2;
          font-size: 13px;
          margin: 6px 0 0 28px;
          line-height: 1.5;
        }
        .improvement-body strong {
          color: #E9A6FF;
        }
        .cta-section {
          text-align: center;
          margin-top: 36px;
          padding: 24px 0;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(90deg, #7C3AED 0%, #C026D3 55%, #FF3D8D 100%);
          color: #FFF;
          padding: 14px 40px;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 700;
          font-size: 16px;
          box-shadow: 0 10px 30px rgba(192,38,211,0.28);
          transition: transform 0.2s ease;
        }
        .cta-button:hover {
          transform: translateY(-2px);
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.07);
          font-size: 12px;
          color: #72727E;
          text-align: center;
        }
        .footer p {
          margin: 6px 0;
        }
        @media (max-width: 600px) {
          .container {
            padding: 24px 16px;
          }
          .title {
            font-size: 18px;
          }
          .bio-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- HEADER -->
        <div class="header">
          <div class="logo">✨ MatchBetter</div>
          <h1 class="title">${isPolish ? 'Dziękujemy za zakup!' : 'Thank you for your purchase!'}</h1>
          <p class="subtitle">
            ${isPolish ? 'Oto Twój raport analizy profilu' : 'Here is your profile analysis report'}
          </p>
          <div class="score-badge">
            <span class="score-value">${Math.round(overallScore)}</span>
            <span class="score-max">/100</span>
          </div>
        </div>

        <!-- ZDJĘCIA -->
        ${photoByPhoto.length > 0 ? `
          <div class="section">
            <h3 class="section-title">📸 ${isPolish ? 'Ocena zdjęć' : 'Photo Rating'}</h3>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-top: 12px;">
              <tr>
                ${photoByPhoto.map((photo) => {
                  const actionColor = photo.action === 'Usuń' ? '#F5455C' : photo.action === 'Zostaw' ? '#22C55E' : '#F5A524';
                  const actionLabel = photo.action;
                  const hasImage = !!images[photo.photo_index - 1];
                  const cidRef = `photo${photo.photo_index}`;
                  return `
                    <td style="width: ${Math.floor(100 / photoByPhoto.length)}%; text-align: center; padding: 0 5px; vertical-align: top;">
                      ${hasImage
                        ? `<img src="cid:${cidRef}" width="64" alt="Photo ${photo.photo_index}" style="width: 64px; max-width: 100%; height: 85px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); display: block; margin: 0 auto;">`
                        : `<div style="width: 64px; height: 85px; margin: 0 auto; border-radius: 8px; background: #111118; display: flex; align-items: center; justify-content: center; color: #72727E; font-size: 20px;">📷</div>`
                      }
                      <div style="font-size: 11px; color: ${actionColor}; font-weight: 700; margin-top: 6px;">${actionLabel}</div>
                    </td>
                  `;
                }).join('')}
              </tr>
            </table>
          </div>
        ` : ''}

        <!-- PODSUMOWANIE -->
        ${summary || greatThing ? `
          <div class="section">
            <h3 class="section-title">📋 ${isPolish ? 'Podsumowanie' : 'Summary'}</h3>
            ${summary ? `
              <div class="summary-box">
                <span class="summary-label">${isPolish ? 'Plan działania' : 'Action Plan'}</span>
                <p class="summary-text">${summary}</p>
              </div>
            ` : ''}
            ${greatThing ? `
              <div class="summary-box success">
                <span class="summary-label">${isPolish ? 'Twoja największa zaleta' : 'Your Biggest Asset'}</span>
                <p class="summary-text">${greatThing}</p>
              </div>
            ` : ''}
          </div>
        ` : ''}

        <!-- BIO -->
        ${bioResult && (bioResult.original_bio || bioResult.improved_bio) ? `
          <div class="section">
            <h3 class="section-title">✍️ ${isPolish ? 'Propozycja opisu' : 'Bio Proposal'}</h3>
            <div class="bio-grid">
              <div class="bio-card">
                <span class="bio-label">${isPolish ? 'Obecny opis' : 'Current Bio'}</span>
                <p class="bio-text">${bioResult.original_bio || (isPolish ? 'Brak opisu' : 'No bio')}</p>
              </div>
              <div class="bio-card highlight">
                <span class="bio-label">${isPolish ? 'Propozycja MatchBetter' : 'MatchBetter Proposal'}</span>
                <p class="bio-text">${bioResult.improved_bio}</p>
                ${bioResult.why_better ? `<p class="bio-why">💡 ${bioResult.why_better}</p>` : ''}
              </div>
            </div>
          </div>
        ` : ''}

        <!-- ULEPSZENIA -->
        ${improvements.length > 0 ? `
          <div class="section">
            <h3 class="section-title">💡 ${isPolish ? 'Kluczowe ulepszenia' : 'Key Improvements'}</h3>
            <div class="improvements-list">
              ${improvements.map((item, idx) => {
                const itemTitle = typeof item === 'object' ? item.title || '' : item;
                return `
                  <div class="improvement-item">
                    <div class="improvement-title">
                      <span class="improvement-badge">${idx + 1}</span>
                      ${itemTitle}
                    </div>
                    ${item.why_it_matters ? `<div class="improvement-body"><strong>${isPolish ? 'Dlaczego to ważne:' : 'Why it matters:'}</strong> ${item.why_it_matters}</div>` : ''}
                    ${item.quick_fix ? `<div class="improvement-body"><strong>💡 ${isPolish ? 'Szybka rada:' : 'Quick fix:'}</strong> ${item.quick_fix}</div>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- CTA -->
        <div class="cta-section">
          <a href="https://matchbetter.com.pl" class="cta-button">
            ${isPolish ? '↠ Wróć na stronę' : '↠ Back to Website'}
          </a>
        </div>

        <!-- FOOTER -->
        <div class="footer">
          <p>© MatchBetter 2024</p>
          <p>${isPolish ? 'Raport został wygenerowany specjalnie dla Ciebie.' : 'This report was generated specifically for you.'}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ─────────────────────────────────────────────────────────────
// ENDPOINT: POST /api/send-report-email
// ─────────────────────────────────────────────────────────────

module.exports = function setupEmailRoute(app) {
  app.post('/api/send-report-email', async (req, res) => {
    try {
      const { userEmail, userName, reportData, images, language } = req.body;

      // Walidacja
      if (!userEmail || !reportData) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Generowanie HTML
      const htmlContent = generateReportHTML(reportData, images || [], language || 'en');

      // Przygotowanie attachmentów (zdjęcia) — osadzone przez cid, żeby
      // nie duplikować danych obrazu w treści HTML (patrz generateReportHTML,
      // które odwołuje się do "cid:photoN"). Dzięki temu HTML wiadomości
      // zostaje mały i Gmail nie przycina maila do "Pokaż całą wiadomość".
      const attachments = (images || []).map((imgBase64, idx) => {
        try {
          const base64Data = imgBase64.includes(',')
            ? imgBase64.split(',')[1]
            : imgBase64;

          return {
            filename: `photo_${idx + 1}.jpg`,
            content: Buffer.from(base64Data, 'base64'),
            contentType: 'image/jpeg',
            cid: `photo${idx + 1}`,
            contentDisposition: 'inline'
          };
        } catch (e) {
          console.warn(`Failed to attach image ${idx + 1}:`, e.message);
          return null;
        }
      }).filter(Boolean);

      // Wysyłanie emaila
      const mailOptions = {
        from: `"MatchBetter" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: language === 'pl'
          ? '✅ Dziękujemy za zakup! Oto Twój raport analizy profilu'
          : '✅ Thank you for your purchase! Here is your profile analysis report',
        html: htmlContent,
        attachments: attachments,
        replyTo: process.env.EMAIL_USER
      };

      const info = await transporter.sendMail(mailOptions);

      console.log(`✅ Email sent to ${userEmail} (Message ID: ${info.messageId})`);

      res.json({
        success: true,
        message: 'Email sent successfully',
        messageId: info.messageId
      });

    } catch (error) {
      console.error('❌ Error sending email:', error);
      res.status(500).json({
        error: 'Failed to send email',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
};

// ─────────────────────────────────────────────────────────────
// UŻYCIE W MAIN EXPRESS APP
// ─────────────────────────────────────────────────────────────
/*
const express = require('express');
const app = express();
app.use(express.json({ limit: '50mb' }));

// Importuj i setup email route
const setupEmailRoute = require('./EMAIL_BACKEND_READY.js');
setupEmailRoute(app);

app.listen(3000, () => console.log('Server running on port 3000'));
*/