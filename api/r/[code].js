// Node.js Runtime (stabiler!)
export default async function handler(req, res) {
  const { code } = req.query;
  
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Server configuration error' });
  }
  
  if (!code || code.length < 3) {
    return res.status(400).json({ error: 'Invalid QR code' });
  }
  
  try {
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
              .container { max-width: 500px; }
              h1 { font-size: 4em; margin: 0; }
              p { font-size: 1.2em; opacity: 0.9; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🤔</h1>
              <h2>QR Code nicht gefunden</h2>
              <p>Code: ${code}</p>
            </div>
          </body>
        </html>
      `);
    }
    
    const relink = data[0];
    
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
            </div>
          </body>
        </html>
      `);
    }
    
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
            <h2>Server Error</h2>
            <p>${error.message}</p>
          </div>
        </body>
      </html>
    `);
  }
}

// KEIN Edge Runtime Config mehr!
```

**Wichtig:** Am Ende ist KEIN `export const config` mehr!

---

## **Speichern & Warten**

Commit → Vercel deployed automatisch → Warte 30 Sekunden

---

## **Dann teste:**
```
https://qr-shirt-redirects.vercel.app/r/test001
