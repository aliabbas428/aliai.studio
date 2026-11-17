export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/chat") {
      try {
        const body = await request.json();
        const prompt = String(body.prompt || "").trim();
        if (!prompt) {
          return Response.json({ error: "Prompt is required." }, { status: 400 });
        }

        const answer = await callAI([{ role: "user", content: prompt }], env);
        return Response.json({ answer });
      } catch (error) {
        return Response.json({ error: error.message || "AI request failed." }, { status: 500 });
      }
    }

    return env.ASSETS.fetch(request);
  }
};

async function callAI(messages, env) {
  const provider = (env.AI_PROVIDER || "openai-compatible").toLowerCase();
  const key = env.AI_API_KEY;
  const model = env.AI_MODEL;

  if (!key) throw new Error("AI_API_KEY is not configured.");
  if (!model) throw new Error("AI_MODEL is not configured.");

  if (provider === "anthropic") {
    const url = env.AI_API_URL || "https://api.anthropic.com/v1/messages";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({ model, max_tokens: 2048, messages })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Anthropic request failed.");
    return (data.content || [])
      .filter(item => item.type === "text")
      .map(item => item.text)
      .join("\n");
  }

  const base = (env.AI_API_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const response = await fetch(base + "/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + key
    },
    body: JSON.stringify({ model, messages, temperature: 0.2 })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "AI request failed.");
  return data.choices?.[0]?.message?.content || "No response returned.";
}
