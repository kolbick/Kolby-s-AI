// === BASIC FRONTEND WIRING FOR KOLBY'S AI ===

// 1) Backend API base URL – change this once your server is up.
const API_BASE_URL = ""; // e.g. "https://api.kolbysai.com"

// 2) Hard-coded models for now.
// When your backend is ready, you'll fetch these from /api/models instead.
const MODELS = [
  { id: "v1-pi", label: "V1 · Pi rig" },
  { id: "v2", label: "V2 · Desktop" },
  { id: "v2.1", label: "V2.1 · Tweaked" },
  { id: "v2.2", label: "V2.2 · Current" },
];

let currentModel = null;
let currentConversationId = null;
let isSending = false;
let isLoggedIn = false;
let currentUser = null;

// DOM refs
const modelListEl = document.getElementById("model-list");
const chatListEl = document.getElementById("chat-list");
const messagesEl = document.getElementById("messages");
const chatFormEl = document.getElementById("chat-form");
const chatInputEl = document.getElementById("chat-input");
const newChatBtn = document.getElementById("new-chat-btn");
const backendStatusDot = document.getElementById("backend-status-dot");
const backendStatusText = document.getElementById("backend-status-text");
const currentModelLabel = document.getElementById("current-model-label");
const signInBtn = document.getElementById("sign-in-btn");
const loginModal = document.getElementById("login-modal");
const loginForm = document.getElementById("login-form");
const loginCancel = document.getElementById("login-cancel");

// ---------- UI helpers ----------

function addMessage(role, text) {
  const container = document.createElement("div");
  container.className = `message ${role}`;

  const meta = document.createElement("div");
  meta.className = "message-meta";
  meta.textContent =
    role === "user" ? "You" : role === "assistant" ? "Kolby’s AI" : "System";

  const body = document.createElement("div");
  body.className = "message-body";
  body.textContent = text;

  container.appendChild(meta);
  container.appendChild(body);
  messagesEl.appendChild(container);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function setBackendStatus(connected) {
  if (connected) {
    backendStatusDot.style.background = "#2ecc71";
    backendStatusText.textContent = "Frontend + backend connected";
  } else {
    backendStatusDot.style.background = "#e0564a";
    backendStatusText.textContent = "Frontend only · API not connected";
  }
}

function renderModels() {
  modelListEl.innerHTML = "";
  MODELS.forEach((m) => {
    const li = document.createElement("li");
    li.className = "model-item";
    li.dataset.modelId = m.id;

    const dot = document.createElement("span");
    dot.className = "model-dot";

    const label = document.createElement("span");
    label.textContent = m.label;

    li.appendChild(dot);
    li.appendChild(label);

    li.addEventListener("click", () => {
      currentModel = m.id;
      document
        .querySelectorAll(".model-item")
        .forEach((el) => el.classList.remove("active"));
      li.classList.add("active");
      currentModelLabel.textContent = `Model: ${m.label}`;
    });

    modelListEl.appendChild(li);
  });
}

function renderDummyHistory() {
  // Placeholder – replaced later when wired to /api/conversations
  chatListEl.innerHTML = "";
  const li = document.createElement("li");
  li.className = "chat-item active";
  li.textContent = "Welcome demo";
  chatListEl.appendChild(li);
}

// ---------- Login modal ----------

function openLoginModal() {
  loginModal.classList.remove("hidden");
}

function closeLoginModal() {
  loginModal.classList.add("hidden");
}

signInBtn?.addEventListener("click", openLoginModal);
loginCancel?.addEventListener("click", closeLoginModal);

loginForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  // TODO: Replace this with a real POST `${API_BASE_URL}/api/login`
  // For now, pretend login works and mark you as admin.
  currentUser = { email, isAdmin: true };
  isLoggedIn = true;
  signInBtn.textContent = email.split("@")[0];
  closeLoginModal();
});

// ---------- Chat sending ----------

async function sendToBackend(messages) {
  if (!API_BASE_URL) {
    // No backend yet – just echo with a placeholder.
    await new Promise((r) => setTimeout(r, 400));
    return {
      role: "assistant",
      content:
        "Backend not wired yet. Once your API is live, this will be a real model response.",
    };
  }

  // TODO: replace with your real /api/chat implementation.
  // Example shape:
  /*
  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: isLoggedIn && currentUser?.token
        ? `Bearer ${currentUser.token}`
        : undefined,
    },
    body: JSON.stringify({
      model: currentModel,
      conversationId: currentConversationId,
      messages,
    }),
  });

  if (!res.ok) throw new Error("API error");
  return await res.json();
  */
}

chatFormEl?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (isSending) return;

  const text = chatInputEl.value.trim();
  if (!text) return;

  if (!currentModel) {
    addMessage(
      "system",
      "Pick a model in the sidebar first (V1, V2, V2.1, or V2.2)."
    );
    return;
  }

  isSending = true;
  chatInputEl.value = "";
  addMessage("user", text);

  try {
    const messagesPayload = [
      { role: "user", content: text },
      // When wired to backend, prepend conversation history here.
    ];

    const resp = await sendToBackend(messagesPayload);

    if (resp && resp.content) {
      addMessage("assistant", resp.content);
    } else {
      addMessage(
        "system",
        "Backend returned no data. Check your /api/chat wiring when you hook it up."
      );
    }
  } catch (err) {
    console.error(err);
    addMessage(
      "system",
      "Error talking to backend. Check API_BASE_URL and server logs."
    );
  } finally {
    isSending = false;
  }
});

// ---------- New chat ----------

newChatBtn?.addEventListener("click", () => {
  currentConversationId = null;
  messagesEl.innerHTML = "";
  addMessage(
    "system",
    "New chat started. Pick a model and send your first message."
  );
});

// ---------- Initial boot ----------

(function init() {
  renderModels();
  renderDummyHistory();
  setBackendStatus(Boolean(API_BASE_URL));
})();
