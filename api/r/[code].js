module.exports = async (req, res) => {
  const { code } = req.query;
  
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Missing env vars' });
  }
  
  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/relinks?short_code=eq.${code}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      return res.status(404).send('<h1>QR Code nicht gefunden</h1>');
    }
    
    const relink = data[0];
    
    if (relink.status !== 'active') {
      return res.status(410).send('<h1>QR Code deaktiviert</h1>');
    }
    
    return res.redirect(307, relink.current_target_url);
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
