// Vercel Serverless Function für QR-Code Redirects
// Datei: api/r/[code].js

export default async function handler(req, res) {
  const { code } = req.query;
  
  // Supabase Credentials aus Environment Variables
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ 
      error: 'Server configuration error' 
    });
  }
  
  // Validierung: Code muss existieren
  if (!code || code.length < 3) {
    return res.status(400).json({ 
      error: 'Invalid QR code' 
    });
  }
  
  try {
    // Hole Relink aus Supabase
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/relinks?short_code=eq.${code}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Database query failed');
    }
    
    const data = await response.json();
    
    // Kein Relink gefunden
    if (!data || data.length === 0) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>QR Code nicht gefunden</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-align: center;
                padding: 20px;
              }
              .container {
                max-width: 500px;
              }
              h1 { font-size: 4em; margin: 0; }
              p { font-size: 1.2em; opacity: 0.9; }
              a {
                display: inline-block;
                margin-top: 20px;
                padding: 12px 30px;
                background: white;
                color: #667eea;
                text-decoration: none;
                border-radius: 25px;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🤔</h1>
              <h2>QR Code nicht gefunden</h2>
              <p>Dieser QR Code existiert nicht oder wurde deaktiviert.</p>
              <a href="https://dein-shop.com">Zum Shop</a>
            </div>
          </body>
        </html>
      `);
    }
    
    const relink = data[0];
    
    // Status Check
    if (relink.status !== 'active') {
      return res.status(410).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>QR Code deaktiviert</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: white;
                text-align: center;
                padding: 20px;
              }
              .container { max-width: 500px; }
              h1 { font-size: 4em; margin: 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>⚠️</h1>
              <h2>QR Code deaktiviert</h2>
              <p>Dieser QR Code wurde vom Besitzer deaktiviert.</p>
            </div>
          </body>
        </html>
      `);
    }
    
    // Analytics/Tracking (optional - später ausbauen)
    // Hier könntest du Klicks in einer separaten Tabelle loggen:
    /*
    await fetch(`${SUPABASE_URL}/rest/v1/relink_clicks`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        relink_id: relink.id,
        clicked_at: new Date().toISOString(),
        user_agent: req.headers['user-agent'],
        referer: req.headers['referer'] || null,
        ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress
      })
    });
    */
    
    // REDIRECT!
    return res.redirect(307, relink.current_target_url);
    
  } catch (error) {
    console.error('Redirect error:', error);
    
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Fehler</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              color: white;
              text-align: center;
              padding: 20px;
            }
            .container { max-width: 500px; }
            h1 { font-size: 4em; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>😕</h1>
            <h2>Etwas ist schief gelaufen</h2>
            <p>Bitte versuche es später erneut.</p>
          </div>
        </body>
      </html>
    `);
  }
}

// Edge Config (Optional - für schnellere Global Performance)
export const config = {
  runtime: 'edge', // Läuft auf Vercel Edge Network (schneller)
};
