const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const root = path.join(__dirname, "web");

function json(res, status, body) {
  res.writeHead(status, {"Content-Type":"application/json; charset=utf-8"});
  res.end(JSON.stringify(body));
}

async function callAI(messages) {
  const provider = (process.env.AI_PROVIDER || "openai-compatible").toLowerCase();
  const key = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  if (!key) throw new Error("AI_API_KEY is not configured.");
  if (!model) throw new Error("AI_MODEL is not configured.");

  if (provider === "anthropic") {
    const url = process.env.AI_API_URL || "https://api.anthropic.com/v1/messages";
    const r = await fetch(url, {
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "x-api-key":key,
        "anthropic-version":"2023-06-01"
      },
      body:JSON.stringify({
        model, max_tokens:2048, messages
      })
    });
    const data=await r.json();
    if(!r.ok) throw new Error(data.error?.message || "Anthropic request failed.");
    return (data.content||[]).filter(x=>x.type==="text").map(x=>x.text).join("\n");
  }

  const base = (process.env.AI_API_URL || "https://api.openai.com/v1").replace(/\/$/,"");
  const r = await fetch(base + "/chat/completions", {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "Authorization":"Bearer "+key
    },
    body:JSON.stringify({model,messages,temperature:0.2})
  });
  const data=await r.json();
  if(!r.ok) throw new Error(data.error?.message || "AI request failed.");
  return data.choices?.[0]?.message?.content || "No response returned.";
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (req.method === "POST" && url.pathname === "/api/chat") {
    let raw="";
    req.on("data", chunk => raw += chunk);
    req.on("end", async () => {
      try {
        const body=JSON.parse(raw || "{}");
        const prompt=String(body.prompt || "").trim();
        if(!prompt) return json(res,400,{error:"Prompt is required."});
        const answer=await callAI([{role:"user",content:prompt}]);
        json(res,200,{answer});
      } catch(e) {
        json(res,500,{error:e.message});
      }
    });
    return;
  }

  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const file = path.join(root, pathname);
  if (!file.startsWith(root)) return res.writeHead(403).end("Forbidden");

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, {"Content-Type":"text/plain; charset=utf-8"});
      return res.end("Not found");
    }
    const ext = path.extname(file);
    const types={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8"};
    res.writeHead(200, {"Content-Type":types[ext]||"application/octet-stream"});
    res.end(data);
  });
});

server.listen(PORT, "0.0.0.0", () => console.log(`AliAI Studio running on port ${PORT}`));
