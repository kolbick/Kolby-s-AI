// Kolby's AI frontend wiring

const API_BASE_URL = ""; // set later when backend exists

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

// DOM
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

// helpers
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
  chatListEl.innerHTML = "";
  const li = document.createElement("li");
  li.className = "chat-item active";
  li.textContent = "Welcome demo";
  chatListEl.appendChild(li);
}

// login modal
function openLoginModal() {
  loginModal.classList.remove("hidden");
}
function closeLoginModal() {
  loginModal.classList.add("hidden");
}

signInBtn.addEventListener("click", openLoginModal);
loginCancel.addEventListener("click", closeLoginModal);

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;

  // TODO: real POST `${API_BASE_URL}/api/login`
  currentUser = { email, isAdmin: true };
  isLoggedIn = true;
  signInBtn.textContent = email.split("@")[0];
  closeLoginModal();
});

// backend call placeholder
async function sendToBackend(messages) {
  if (!API_BASE_URL) {
    await new Promise((r) => setTimeout(r, 400));
    return {
      role: "assistant",
      content:
        "Backend not wired yet. Once your API is live, this will be a real model response.",
    };
  }

  // TODO: real /api/chat call goes here
}

// chat submit
chatFormEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (isSending) return;

  const text = chatInputEl.value.trim();
  if (!text) return;

  if (!currentModel) {
    addMessage("system", "Pick a model in the sidebar first.");
    return;
  }

  isSending = true;
  chatInputEl.value = "";
  addMessage("user", text);

  try {
    const payload = [{ role: "user", content: text }];
    const resp = await sendToBackend(payload);

    if (resp && resp.content) {
      addMessage("assistant", resp.content);
    } else {
      addMessage(
        "system",
        "Backend returned no data. Check /api/chat wiring once you connect it."
      );
    }
  } catch (err) {
    console.error(err);
    addMessage(
      "system",
      "Error talking to backend. Check API_BASE_URL and your server."
    );
  } finally {
    isSending = false;
  }
});

// new chat
newChatBtn.addEventListener("click", () => {
  currentConversationId = null;
  messagesEl.innerHTML = "";
  addMessage(
    "system",
    "New chat started. Pick a model and send your first message."
  );
});

// init
(function init() {
  renderModels();
  renderDummyHistory();
  setBackendStatus(Boolean(API_BASE_URL));
})();
