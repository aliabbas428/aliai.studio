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

        if (!env.AI) {
          return Response.json(
            { error: "Workers AI binding is not configured yet." },
            { status: 503 }
          );
        }

        const messages = [
          {
            role: "system",
            content:
              "You are AliAI Studio, a helpful coding assistant. Give accurate, practical code. Explain briefly when useful. Never invent APIs or files. If the user asks in Urdu or Roman Urdu, answer in the same style."
          },
          { role: "user", content: prompt }
        ];

        const result = await env.AI.run(
          env.AI_MODEL || "@cf/zai-org/glm-4.7-flash",
          { messages }
        );

        const answer =
          result?.response ||
          result?.output_text ||
          result?.text ||
          "No response returned.";

        return Response.json({ answer });
      } catch (error) {
        return Response.json(
          { error: error?.message || "Workers AI request failed." },
          { status: 500 }
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};