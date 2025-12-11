/* ==========================================================
   Kolby's AI — Connected Frontend
   Uses existing OpenWebUI endpoint & JWT defined in repo
   ========================================================== */

/* ---------- CONFIG ---------- */

const OPENWEBUI_URL = "https://kaitlin-unfertilisable-snottily.ngrok-free.dev/api/chat/completions";
const OPENWEBUI_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM5NWUyNDIyLTk2ZTMtNDlmNi1iYjk2LTU3MTcyMWRjN2NhMCIsImV4cCI6MTc2NzQ3OTYxOSwianRpIjoiYWRhN2RiNTctNGZmZS00YjIwLWIxYTMtZGJkYjBkNzI0OGIxIn0.9f-SW4DckWTAu5cR9yY5wbW8Y3Jpg86xE7WPA4o2h28";

/* ---------- YOUR MODELS ---------- */

const MODELS = [
  { id: "kolbys-ai-v2", label: "Kolby's AI (Alpha)" },
  { id: "kolbys-ai-v21", label: "Kolby's AI (Beta 1.0)" },
  { id: "kolbys-ai-v22", label: "Kolby's AI (Beta 1.1)" },
  { id: "changing-tides-ai-proposal-test", label: "Changing Tides AI Proposal (Test)" },
  { id: "mountains-to-sea-therapy", label: "Mountains to Sea Therapy" }
];

let currentModel = MODELS[0].id;
let sending = false;

/* ==========================================================
   UTILS
   ========================================================== */

function setCurrentModelLabel(label) {
  const el = document.getElementById("current-model-label");
  if (el) el.textContent = label;
}

function applyWatermark(modelId) {
  const watermark = document.querySelector(".watermark");
  if (!watermark) return;

  const isMountains = modelId === "mountains-to-sea-therapy";
  watermark.classList.toggle("watermark--mountains", isMountains);
  watermark.classList.toggle("watermark--kolby", !isMountains);
}

function setConnectionStatus(text) {
  const badge = document.getElementById("connection-status");
  if (badge) badge.textContent = text;
}

function buildContent(text) {
  const container = document.createElement("div");
  container.className = "message__content";
  fillContent(container, text);
  return container;
}

function fillContent(container, text) {
  container.innerHTML = "";
  text.split(/\n+/).forEach((line) => {
    const p = document.createElement("p");
    p.textContent = line;
    container.appendChild(p);
  });
}

function toggleEmptyState(show) {
  const empty = document.getElementById("chat-empty");
  if (!empty) return;
  empty.style.display = show ? "flex" : "none";
}

/* ==========================================================
   BUILD SIDEBAR MODEL LIST
   ========================================================== */

function activateModel(li, model) {
  currentModel = model.id;
  document
    .querySelectorAll(".model-list-item")
    .forEach((el) => el.classList.toggle("active", el === li));
  applyWatermark(currentModel);
  setCurrentModelLabel(model.label);
  document.body.classList.remove("sidebar-open");
  setConnectionStatus("Brain online");
  console.log("Selected model:", currentModel);
}

function loadModelList() {
  const list = document.getElementById("model-list");
  if (!list) return;

  list.innerHTML = "";

  MODELS.forEach((model) => {
    const li = document.createElement("li");
    li.className = "model-list-item";
    li.dataset.modelId = model.id;
    li.tabIndex = 0;
    li.textContent = model.label;

    if (model.id === currentModel) li.classList.add("active");

    const handler = () => activateModel(li, model);
    li.addEventListener("click", handler);
    li.addEventListener("touchend", handler, { passive: true });
    li.addEventListener("keyup", (evt) => {
      if (evt.key === "Enter" || evt.key === " ") handler();
    });

    list.appendChild(li);
  });

  setCurrentModelLabel(MODELS.find((m) => m.id === currentModel)?.label || MODELS[0].label);
}

/* ==========================================================
   API CALL TO OPENWEBUI
   ========================================================== */

async function callModel(userText) {
  console.log("Sending request:", { model: currentModel, url: OPENWEBUI_URL });

  try {
    const response = await fetch(OPENWEBUI_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENWEBUI_JWT}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: currentModel,
        messages: [
          { role: "system", content: "You are Kolby's AI assistant." },
          { role: "user", content: userText }
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Backend responded with an error:", response.status, text);
      throw new Error(`Backend responded with status ${response.status}`);
    }

    const data = await response.json();
    console.log("Raw backend response:", data);

    if (!data?.choices?.[0]?.message?.content) {
      console.error("Unexpected backend payload", data);
      return "No reply from backend — check JWT, model ID, and URL.";
    }

    return data.choices[0].message.content;
  } catch (err) {
    console.error("Error talking to backend:", err);
    return "Backend error: " + err.message;
  }
}

/* ==========================================================
   CHAT UI HANDLERS
   ========================================================== */

function appendMessage(role, text, { pending = false } = {}) {
  const thread = document.getElementById("chat-thread");
  if (!thread) return null;

  toggleEmptyState(false);

  const msg = document.createElement("article");
  msg.className = `message message--${role}${pending ? " message--pending" : ""}`;

  const meta = document.createElement("div");
  meta.className = "message__meta";
  const rolePill = document.createElement("span");
  rolePill.className = "role-pill";
  rolePill.textContent = role === "user" ? "You" : "Kolby’s AI";
  meta.appendChild(rolePill);

  const timestamp = document.createElement("span");
  timestamp.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  meta.appendChild(timestamp);

  msg.appendChild(meta);
  msg.appendChild(buildContent(text));

  thread.appendChild(msg);
  thread.scrollTop = thread.scrollHeight;

  return msg;
}

function setSending(state) {
  sending = state;
  const sendBtn = document.getElementById("send-btn");
  if (sendBtn) {
    sendBtn.disabled = state;
    sendBtn.innerHTML = state ? '<i class="ri-loader-4-line" aria-hidden="true"></i> Sending' : '<i class="ri-send-plane-2-line" aria-hidden="true"></i> Send';
  }
  setConnectionStatus(state ? "Talking to backend…" : "Brain online");
}

function clearChat() {
  const thread = document.getElementById("chat-thread");
  if (thread) thread.innerHTML = "";
  toggleEmptyState(true);
}

function handlePromptButtons() {
  document.querySelectorAll(".prompt-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const textarea = document.getElementById("chat-input-textarea");
      if (!textarea) return;
      textarea.value = btn.dataset.prompt || "";
      textarea.focus();
    });
  });
}

function wireChatUI() {
  const form = document.getElementById("chat-form");
  const textarea = document.getElementById("chat-input-textarea");

  if (!form || !textarea) {
    console.warn("Chat UI not found on this page.");
    return;
  }

  const sendFlow = async (text) => {
    if (!text || sending) return;
    appendMessage("user", text);
    textarea.value = "";
    setSending(true);

    const pending = appendMessage("assistant", "Thinking...", { pending: true });
    const reply = await callModel(text);

    if (pending) {
      pending.classList.remove("message--pending");
      const content = pending.querySelector(".message__content");
      if (content) {
        fillContent(content, reply);
      } else {
        pending.appendChild(buildContent(reply));
      }
    } else {
      appendMessage("assistant", reply);
    }

    setSending(false);
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = textarea.value.trim();
    sendFlow(text);
  });

  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const text = textarea.value.trim();
      sendFlow(text);
    }
  });

  const newChatButtons = [document.getElementById("new-chat-btn"), document.getElementById("secondary-new-chat")];
  newChatButtons.forEach((btn) => {
    if (btn) btn.addEventListener("click", () => {
      clearChat();
      textarea.focus();
    });
  });
}

/* ==========================================================
   SIDEBAR TOGGLING FOR MOBILE
   ========================================================== */

function wireSidebarToggle() {
  const toggle = document.getElementById("sidebar-toggle");
  const overlay = document.getElementById("sidebar-overlay");

  const closeSidebar = () => document.body.classList.remove("sidebar-open");
  const toggleSidebar = () => document.body.classList.toggle("sidebar-open");

  if (toggle) toggle.addEventListener("click", toggleSidebar);
  if (overlay) overlay.addEventListener("click", closeSidebar);
}

/* ==========================================================
   INIT
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  loadModelList();
  applyWatermark(currentModel);
  wireChatUI();
  wireSidebarToggle();
  handlePromptButtons();
  toggleEmptyState(true);
});
