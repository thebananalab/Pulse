const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  
  if (!ANTHROPIC_API_KEY) {
    // Esto nos dirá qué variables SI están llegando a la función
    return res.status(500).json({ 
      error: "API key not configured",
      env_keys_found: Object.keys(process.env).filter(k => !k.includes('VERCEL')) 
    });
  }
