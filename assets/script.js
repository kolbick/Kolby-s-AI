// Temporary API placeholder.
// We'll point this to your real backend later (e.g. https://api.kolbysai.com/chat)
const API_URL = "https://example.com/chat";

const chatLog = document.getElementById("chatLog");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const statusText = document.getElementById("statusText");

function appendMessage(content, who, extraClass = "") {
  const div = document.createElement("div");
  div.className = `msg ${who === "user" ? "msg-user" : "msg-ai"} ${extraClass}`;
  div.textContent = content;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text || sendBtn.disabled) return;

  // Show user message in UI
  appendMessage(text, "user");
  input.value = "";
  statusText.textContent = "Thinking...";
  sendBtn.disabled = true;

  try {
    // This will fail until we point API_URL to your real backend.
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      appendMessage(
        "Backend not wired yet. This is just the frontend UI. We'll connect it in the next steps.",
        "ai",
        "system"
      );
    } else {
      appendMessage(data.reply || "[Empty response]", "ai");
    }
  } catch (err) {
    appendMessage(
      "No backend yet. Frontend is live; brain is coming next.",
      "ai",
      "system"
    );
  } finally {
    statusText.textContent = "Idle";
    sendBtn.disabled = false;
    input.focus();
  }
}

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

