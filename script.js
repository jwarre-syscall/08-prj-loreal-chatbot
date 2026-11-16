// Replace this with the URL of your deployed Cloudflare Worker.
// Never put an OpenAI API key in this browser-side file.
const WORKER_URL = "https://cool-grass-7a9c.jwarre46.workers.dev/";

const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");
const latestQuestion = document.getElementById("latestQuestion");
const latestQuestionText = document.getElementById("latestQuestionText");

// Keep earlier turns so follow-up questions have context. This stays in memory
// for this tab only and is cleared when the page is refreshed.
const conversationHistory = [
  {
    role: "assistant",
    content: "Hello! I can help with L’Oréal products, skincare, makeup, haircare, fragrance, and beauty routines. What would you like to explore?",
  },
];

// Create message bubbles with textContent so user text is never treated as HTML.
function addMessage(role, message, isTemporary = false) {
  const row = document.createElement("div");
  row.className = `message-row ${role === "user" ? "user-row" : "assistant-row"}`;
  if (isTemporary) row.dataset.temporary = "true";

  if (role === "assistant") {
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = "L";
    row.append(avatar);
  }

  const content = document.createElement("div");
  content.className = "message-content";

  const name = document.createElement("span");
  name.className = "message-name";
  name.textContent = role === "user" ? "You" : "L’Oréal Beauty Assistant";

  const bubble = document.createElement("div");
  bubble.className = `message-bubble ${role === "user" ? "user-bubble" : "assistant-bubble"}`;
  if (isTemporary) bubble.classList.add("typing-bubble");
  bubble.textContent = message;

  content.append(name, bubble);
  row.append(content);
  chatWindow.append(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return row;
}

// Send the conversation to the secure Worker and render its response.
chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = userInput.value.trim();
  if (!question) return;

  if (WORKER_URL.includes("your-subdomain")) {
    addMessage("assistant", "The chatbot still needs your deployed Cloudflare Worker URL. Add it to WORKER_URL in script.js, then try again.");
    return;
  }

  latestQuestionText.textContent = question;
  latestQuestion.hidden = false;
  addMessage("user", question);
  conversationHistory.push({ role: "user", content: question });
  userInput.value = "";
  sendBtn.disabled = true;
  userInput.disabled = true;
  const typing = addMessage("assistant", "Thinking…", true);

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversationHistory }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "The beauty assistant could not answer right now.");
    }

    const reply = data.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      throw new Error("The Worker returned an empty response. Please try again.");
    }

    typing.remove();
    conversationHistory.push({ role: "assistant", content: reply });
    addMessage("assistant", reply);
  } catch (error) {
    typing.remove();
    // Remove the unanswered turn so a retry won't send a broken conversation.
    conversationHistory.pop();
    addMessage("assistant", error.message || "Something went wrong. Please try again.");
  } finally {
    sendBtn.disabled = false;
    userInput.disabled = false;
    userInput.focus();
  }
});
