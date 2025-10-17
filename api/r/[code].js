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
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) throw new Error('Database query failed');
    const data = await response.json();

    if (!data || data.length === 0) {
      return res.status(404).send('QR Code nicht gefunden');
    }

    const relink = data[0];

    if (relink.status !== 'active') {
      return res.status(410).send('QR Code deaktiviert');
    }

    const target =
      relink.current_target_url ||
      relink.current_target ||
      relink.target_url;

    if (!target) {
      return res.status(500).send('Ziel-URL fehlt in der Datenbank');
    }

    return res.redirect(307, target);
  } catch (err) {
    console.error('Redirect error:', err);
    return res.status(500).send('Fehler');
  }
}
