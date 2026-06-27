/**
 * Free AI provider layer.
 *
 * Uses only providers with a genuinely free tier (no credit card needed):
 *   1. Google Gemini   — https://aistudio.google.com/apikey   (best free tier)
 *   2. Groq            — https://console.groq.com/keys        (very fast, free)
 *   3. OpenRouter      — https://openrouter.ai/keys           (free models)
 *
 * Set any of GEMINI_API_KEY / GROQ_API_KEY / OPENROUTER_API_KEY. The layer
 * tries them in order and falls back to the next if one fails or is rate
 * limited — so you squeeze the most out of every free quota.
 *
 * No SDK / no paid dependency — just Node's built-in fetch (Node 18+).
 */

// ---- SSE parsing (shared by every OpenAI-compatible + Gemini stream) ----
async function parseSSE(res, onData) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (line.startsWith("data:")) {
        const data = line.slice(5).trim();
        if (data) onData(data);
      }
    }
  }
}

// A message's `content` is either a plain string, or an array of parts:
//   { type: "text", text } | { type: "image", mimeType, data }   (data = base64)

// ---- Google Gemini ----
const toGeminiParts = (content) => {
  if (typeof content === "string") return [{ text: content }];
  return content.map((p) =>
    p.type === "image"
      ? { inlineData: { mimeType: p.mimeType, data: p.data } }
      : { text: p.text || "" }
  );
};

const geminiProvider = (apiKey) => {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const base = `https://generativelanguage.googleapis.com/v1beta/models/${model}`;
  const toContents = (messages) =>
    messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: toGeminiParts(m.content),
    }));

  return {
    name: "gemini",
    async stream({ system, messages, onText, signal }) {
      const res = await fetch(`${base}:streamGenerateContent?alt=sse&key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: toContents(messages),
        }),
      });
      if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
      await parseSSE(res, (data) => {
        try {
          const json = JSON.parse(data);
          const text =
            json?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
          if (text) onText(text);
        } catch {
          /* skip non-JSON keep-alive lines */
        }
      });
    },
    async json({ system, prompt }) {
      const res = await fetch(`${base}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      });
      if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
      const data = await res.json();
      const text =
        data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
      return JSON.parse(text);
    },
  };
};

// ---- OpenAI-compatible providers (Groq, OpenRouter) ----
const toOpenAIContent = (content) => {
  if (typeof content === "string") return content;
  return content.map((p) =>
    p.type === "image"
      ? { type: "image_url", image_url: { url: `data:${p.mimeType};base64,${p.data}` } }
      : { type: "text", text: p.text || "" }
  );
};

const openaiCompatProvider = ({ name, apiKey, baseURL, model, extraHeaders = {} }) => ({
  name,
  async stream({ system, messages, onText, signal }) {
    const res = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, ...extraHeaders },
      signal,
      body: JSON.stringify({
        model,
        stream: true,
        messages: [
          { role: "system", content: system },
          ...messages.map((m) => ({ role: m.role, content: toOpenAIContent(m.content) })),
        ],
      }),
    });
    if (!res.ok) throw new Error(`${name} ${res.status}: ${await res.text()}`);
    await parseSSE(res, (data) => {
      if (data === "[DONE]") return;
      try {
        const json = JSON.parse(data);
        const text = json?.choices?.[0]?.delta?.content || "";
        if (text) onText(text);
      } catch {
        /* skip */
      }
    });
  },
  async json({ system, prompt }) {
    const res = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, ...extraHeaders },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`${name} ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return JSON.parse(data?.choices?.[0]?.message?.content || "{}");
  },
});

// ---- Provider registry (ordered by preference) ----
function buildProviders() {
  const list = [];
  if (process.env.GEMINI_API_KEY) list.push(geminiProvider(process.env.GEMINI_API_KEY));
  if (process.env.GROQ_API_KEY)
    list.push(
      openaiCompatProvider({
        name: "groq",
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      })
    );
  if (process.env.OPENROUTER_API_KEY)
    list.push(
      openaiCompatProvider({
        name: "openrouter",
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: "https://openrouter.ai/api/v1",
        model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
        extraHeaders: { "X-Title": "CGLTracker" },
      })
    );
  return list;
}

const providers = buildProviders();

export const aiEnabled = providers.length > 0;
export const providerNames = providers.map((p) => p.name);

export const requireAI = (req, res, next) => {
  if (!aiEnabled) {
    return res.status(503).json({
      message:
        "AI features need a free API key. Add GEMINI_API_KEY (from aistudio.google.com/apikey), " +
        "GROQ_API_KEY, or OPENROUTER_API_KEY to the server environment.",
    });
  }
  next();
};

/**
 * Stream a chat completion, calling onText(delta) for each chunk.
 * Falls back to the next free provider only if the current one fails BEFORE
 * emitting any text (so the user never sees a duplicated/garbled answer).
 */
export async function streamChat({ system, messages, onText, signal }) {
  let lastErr;
  for (const p of providers) {
    let emitted = false;
    try {
      await p.stream({
        system,
        messages,
        signal,
        onText: (d) => {
          emitted = true;
          onText(d);
        },
      });
      return; // success
    } catch (err) {
      if (err.name === "AbortError") throw err;
      lastErr = err;
      if (emitted) throw err; // already streaming this provider — don't fall back
      // otherwise try the next provider
    }
  }
  throw lastErr || new Error("No AI provider configured");
}

/** Generate a JSON object (study plan). Tries providers in order. */
export async function generateJSON({ system, prompt }) {
  let lastErr;
  for (const p of providers) {
    try {
      return await p.json({ system, prompt });
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("No AI provider configured");
}
