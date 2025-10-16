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
          <head><meta charset="utf-8"><title>QR Code nicht gefunden</title></head>
          <body style="font-family:sans-serif;text-align:center;margin-top:5em;">
            <h1>🤔 QR Code nicht gefunden</h1>
            <p>Dieser Code existiert nicht oder wurde deaktiviert.</p>
          </body>
        </html>
      `);
    }
    
    const relink = data[0];
    
    if (relink.status !== 'active') {
      return res.status(410).send(`
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8"><title>QR Code deaktiviert</title></head>
          <body style="font-family:sans-serif;text-align:center;margin-top:5em;">
            <h1>⚠️ QR Code deaktiviert</h1>
            <p>Dieser Code wurde vom Besitzer deaktiviert.</p>
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
        <head><meta charset="utf-8"><title>Fehler</title></head>
        <body style="font-family:sans-serif;text-align:center;margin-top:5em;">
          <h1>😕 Fehler</h1>
          <p>Etwas ist schief gelaufen. Bitte versuche es später erneut.</p>
        </body>
      </html>
    `);
  }
}

export const config = { runtime: 'edge' };
