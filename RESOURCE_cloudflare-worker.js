// Cloudflare Worker: browser -> Worker -> OpenAI.
const SYSTEM_PROMPT = `You are a warm, concise L’Oréal beauty assistant. Only answer questions about L’Oréal products and brands, beauty and personal care, skincare, makeup, haircare, fragrance, routines, and recommendations. For questions outside these topics, politely say you can help with L’Oréal products and beauty-related questions, then invite the user to ask one. Do not claim a product will cure or diagnose a medical condition. For irritation or a serious skin or scalp concern, recommend stopping use and consulting a qualified healthcare professional. Ask a brief follow-up when key details such as skin type, hair type, desired result, or region are needed. Be transparent when you are uncertain, and do not invent ingredients, product availability, or product claims. Keep recommendations practical and remind users to follow product labels.`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: { message: "Use POST to send a chat message." } }, 405);
    }

    if (!env.OPENAI_API_KEY) {
      return jsonResponse({ error: { message: "The Worker is missing its OPENAI_API_KEY secret." } }, 500);
    }

    try {
      const input = await request.json();
      if (!Array.isArray(input.messages) || input.messages.length === 0 || input.messages.length > 30) {
        return jsonResponse({ error: { message: "Send between 1 and 30 conversation messages." } }, 400);
      }

      // Accept only plain user and assistant turns. The system prompt stays here,
      // where a browser visitor cannot replace it.
      const messages = input.messages.map((message) => {
        if (!message || !["user", "assistant"].includes(message.role) ||
            typeof message.content !== "string" || message.content.length > 4000) {
          throw new Error("Each message must have a supported role and contain under 4,000 characters.");
        }
        return { role: message.role, content: message.content };
      });

      const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1",
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
          max_completion_tokens: 350,
        }),
      });

      const data = await upstream.json();
      return jsonResponse(data, upstream.status);
    } catch (error) {
      return jsonResponse({ error: { message: error.message || "The request could not be processed." } }, 400);
    }
  },
};
