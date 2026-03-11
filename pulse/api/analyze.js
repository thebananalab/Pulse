const res1 = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "web-search-2025-03-05", 
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 3000,
        tools: [{ 
          type: "web_search_20250305", 
          name: "web_search" // <--- Esto es lo que faltaba
        }], 
        messages: [{ role: "user", content: prompt }],
      }),
    });
