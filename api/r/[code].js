export default async function handler(req) {
  // Edge Runtime: URL manuell parsen
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const code = pathParts[pathParts.length - 1];
  
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (!code || code.length < 3) {
    return new Response(JSON.stringify({ error: 'Invalid QR code' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
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
      return new Response(`
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
      `, {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    
    const relink = data[0];
    
    if (relink.status !== 'active') {
      return new Response(`
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
      `, {
        status: 410,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    
    // REDIRECT!
    return Response.redirect(relink.current_target_url, 307);
    
  } catch (error) {
    console.error('Redirect error:', error);
    
    return new Response(`
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
            <h2>Fehler: ${error.message}</h2>
          </div>
        </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

export const config = {
  runtime: 'edge',
};
```

**Speichern** → Commit

Vercel deployed automatisch neu!

---

## **Warte ~30 Sekunden, dann teste:**
```
https://qr-shirt-redirects.vercel.app/r/test001
