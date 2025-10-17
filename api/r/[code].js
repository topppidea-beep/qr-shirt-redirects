module.exports = async (req, res) => {
  // WICHTIG: Logging für Debug
  console.log('Request received:', req.url);
  console.log('Query params:', req.query);
  
  const { code } = req.query;
  
  console.log('Code extracted:', code);
  
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
  
  console.log('Supabase URL exists:', !!SUPABASE_URL);
  console.log('Supabase Key exists:', !!SUPABASE_KEY);
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ 
      error: 'Missing config',
      hasUrl: !!SUPABASE_URL,
      hasKey: !!SUPABASE_KEY
    });
  }
  
  if (!code) {
    return res.status(400).json({ 
      error: 'No code in query',
      query: req.query,
      url: req.url
    });
  }
  
  try {
    const url = `${SUPABASE_URL}/rest/v1/relinks?short_code=eq.${code}&select=*`;
    console.log('Fetching from:', url);
    
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Supabase status:', response.status);
    
    const data = await response.json();
    console.log('Data received:', JSON.stringify(data));
    
    if (!data || data.length === 0) {
      return res.status(404).send(`
        <h1>QR Code nicht gefunden</h1>
        <p>Code: ${code}</p>
        <p>Supabase returned: ${data.length} results</p>
      `);
    }
    
    const relink = data[0];
    console.log('Redirecting to:', relink.current_target_url);
    
    if (relink.status !== 'active') {
      return res.status(410).send('<h1>QR Code deaktiviert</h1>');
    }
    
    return res.redirect(307, relink.current_target_url);
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
};
```

### **Schritt 2: Vercel Cache löschen**

Nach dem Commit:

1. Vercel → **Settings** → **General**
2. Scrolle runter zu **"Reset Build Cache"**
3. Klicke **"Reset"**
4. Dann neues Deployment triggern

### **Schritt 3: Force Redeploy**

1. Vercel → **Deployments**
2. Letztes Deployment → **⋮** (3 Punkte)
3. **"Redeploy"**
4. **WICHTIG:** Haken bei **"Use existing Build Cache"** ENTFERNEN!

---

## **Alternative: Teste direkt die API Route**

Öffne im Browser:
```
https://qr-shirt-redirects.vercel.app/api/r/test001
