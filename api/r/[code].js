module.exports = async (req, res) => {
  const { code } = req.query;
  
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
  
  // Debug logging
  console.log('Code:', code);
  console.log('Supabase URL exists:', !!SUPABASE_URL);
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ 
      error: 'Server configuration error',
      hasUrl: !!SUPABASE_URL,
      hasKey: !!SUPABASE_KEY
    });
  }
  
  if (!code || code.length < 3) {
    return res.status(400).json({ error: 'Invalid QR code', received: code });
  }
  
  try {
    const supabaseUrl = `${SUPABASE_URL}/rest/v1/relinks?short_code=eq.${code}&select=*`;
    console.log('Fetching from:', supabaseUrl);
    
    const response = await fetch(supabaseUrl, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Supabase response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase error:', errorText);
      throw new Error(`Database query failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Data found:', data.length, 'records');
    
    if (!data || data.length === 0) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
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
              <p>Code: <code>${code}</code></p>
              <p style="font-size: 0.9em; opacity: 0.7;">Dieser QR Code existiert nicht oder wurde deaktiviert.</p>
            </div>
          </body>
        </html>
      `);
    }
    
    const relink = data[0];
    console.log('Redirecting to:', relink.current_target_url);
    
    if (relink.status !== 'active') {
      return res.status(410).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
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
    
    // REDIRECT mit Node.js res.redirect
    return res.redirect(307, relink.current_target_url);
    
  } catch (error) {
    console.error('Redirect error:', error);
    
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Server Fehler</title>
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
            pre { 
              background: rgba(0,0,0,0.3); 
              padding: 10px; 
              border-radius: 5px;
              font-size: 0.8em;
              text-align: left;
              overflow-x: auto;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>😕</h1>
            <h2>Server Error</h2>
            <pre>${error.message}</pre>
          </div>
        </body>
      </html>
    `);
  }
};
```

5. **Commit new file**

---

### **Schritt 3: Warte & Teste**

Warte 30 Sekunden → Dann:
```
https://qr-shirt-redirects.vercel.app/r/test001
