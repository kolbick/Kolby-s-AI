/* ==========================================================
   Kolby's AI — modern cockpit
   Keeps existing backend URL/JWT + model IDs intact
   ========================================================== */

const OPENWEBUI_URL = "https://kaitlin-unfertilisable-snottily.ngrok-free.dev/api/chat/completions";
const OPENWEBUI_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM5NWUyNDIyLTk2ZTMtNDlmNi1iYjk2LTU3MTcyMWRjN2NhMCIsImV4cCI6MTc2NzQ3OTYxOSwianRpIjoiYWRhN2RiNTctNGZmZS00YjIwLWIxYTMtZGJkYjBkNzI0OGIxIn0.9f-SW4DckWTAu5cR9yY5wbW8Y3Jpg86xE7WPA4o2h28";

const MODELS = [
  { id: "kolbys-ai-v2", label: "Kolby's AI (Alpha)", description: "Default assistant tuned for general requests." },
  { id: "kolbys-ai-v21", label: "Kolby's AI (Beta 1.0)", description: "Sharper reasoning with a balanced tone." },
  { id: "kolbys-ai-v22", label: "Kolby's AI (Beta 1.1)", description: "Experimental refinements for fast answers." },
  { id: "changing-tides-ai-proposal-test", label: "Changing Tides Proposal", description: "Purpose-built to draft program proposals." },
  { id: "mountains-to-sea-therapy", label: "Mountains to Sea Therapy", description: "Legacy therapy brain for context-heavy asks." }
];

const PROPOSAL_MODEL_ID = "changing-tides-ai-proposal-test";

let currentModel = MODELS[0].id;
let sending = false;

/* ==========================================================
   UTILITIES
   ========================================================== */

const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => Array.from(document.querySelectorAll(selector));

function setCurrentModelLabel(label) {
  const labelEls = qsa("#current-model-label");
  labelEls.forEach((el) => (el.textContent = label));
}

function setConnectionStatus(text) {
  const el = qs("#connection-status");
  if (el) el.textContent = text;
}

function toggleEmptyState(show) {
  const empty = qs("#chat-empty");
  if (!empty) return;
  empty.style.display = show ? "flex" : "none";
}

function clearChat() {
  const thread = qs("#chat-thread");
  if (thread) thread.innerHTML = "";
  toggleEmptyState(true);
}

function timestamp() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ==========================================================
   MODEL HANDLING
   ========================================================== */

function activateModel(modelId) {
  currentModel = modelId;
  qsa(".model-sidebar li").forEach((li) => li.classList.toggle("active", li.dataset.modelId === modelId));
  qsa(".model-card").forEach((card) => card.classList.toggle("active", card.dataset.modelId === modelId));
  const model = MODELS.find((m) => m.id === modelId) || MODELS[0];
  setCurrentModelLabel(model.label);
  setConnectionStatus("Brain online");
  document.body.classList.remove("drawer-open");
  console.log("Selected model:", modelId);
}

function renderModels() {
  const list = qs("#model-list");
  const grid = qs("#model-grid");
  if (!list || !grid) return;

  list.innerHTML = "";
  grid.innerHTML = "";

  MODELS.forEach((model) => {
    const li = document.createElement("li");
    li.textContent = model.label;
    li.dataset.modelId = model.id;
    if (model.id === currentModel) li.classList.add("active");
    li.tabIndex = 0;
    const handle = () => activateModel(model.id);
    li.addEventListener("click", handle);
    li.addEventListener("keyup", (e) => {
      if (e.key === "Enter" || e.key === " ") handle();
    });
    list.appendChild(li);

    const card = document.createElement("article");
    card.className = "model-card" + (model.id === currentModel ? " active" : "");
    card.dataset.modelId = model.id;
    card.innerHTML = `
      <div class="model-card__meta">
        <span class="model-card__name">${model.label}</span>
        <span class="model-card__badge">${model.id}</span>
      </div>
      <p class="muted">${model.description}</p>
      <div class="chip-row">
        <button class="primary-btn" type="button">Set active</button>
      </div>
    `;
    card.querySelector("button")?.addEventListener("click", handle);
    card.addEventListener("click", (e) => {
      // avoid double fires from button; outer card remains tap-friendly on mobile
      if (e.target.tagName !== "BUTTON") handle();
    });

    grid.appendChild(card);
  });

  const initialModel = MODELS.find((m) => m.id === currentModel) || MODELS[0];
  setCurrentModelLabel(initialModel.label);
}

/* ==========================================================
   API CALL
   ========================================================== */

async function callModel(userText, { modelId = currentModel, systemPrompt = "You are Kolby's AI assistant." } = {}) {
  console.log("Sending request:", { model: modelId, url: OPENWEBUI_URL });
  try {
    const response = await fetch(OPENWEBUI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENWEBUI_JWT}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: "system", content: systemPrompt },
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
   CHAT
   ========================================================== */

function appendMessage(role, text, { pending = false } = {}) {
  const thread = qs("#chat-thread");
  if (!thread) return null;

  toggleEmptyState(false);

  const msg = document.createElement("article");
  msg.className = `message message--${role}${pending ? " message--pending" : ""}`;

  const meta = document.createElement("div");
  meta.className = "message__meta";
  const pill = document.createElement("span");
  pill.className = "message__role";
  pill.textContent = role === "user" ? "You" : "Kolby’s AI";
  meta.appendChild(pill);

  const time = document.createElement("span");
  time.textContent = timestamp();
  meta.appendChild(time);

  const body = document.createElement("div");
  body.className = "message__content";
  fillContent(body, text);

  msg.appendChild(meta);
  msg.appendChild(body);
  thread.appendChild(msg);
  thread.scrollTop = thread.scrollHeight;

  return msg;
}

function fillContent(container, text) {
  container.innerHTML = "";
  text.split(/\n+/).forEach((line) => {
    const p = document.createElement("p");
    p.textContent = line;
    container.appendChild(p);
  });
}

function setSending(state) {
  sending = state;
  const sendBtn = qs("#send-btn");
  if (sendBtn) {
    sendBtn.disabled = state;
    sendBtn.innerHTML = state
      ? '<i class="ri-loader-4-line" aria-hidden="true"></i> Sending'
      : '<i class="ri-send-plane-2-line" aria-hidden="true"></i> <span>Send</span>';
  }
  setConnectionStatus(state ? "Talking to backend…" : "Brain online");
}

function wireChatUI() {
  const form = qs("#chat-form");
  const textarea = qs("#chat-input-textarea");
  if (!form || !textarea) return;

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
      if (content) fillContent(content, reply);
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

  qsa(".prompt-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      textarea.value = btn.dataset.prompt || "";
      textarea.focus();
    });
  });

  qsa("#new-chat-btn, #secondary-new-chat").forEach((btn) => {
    btn?.addEventListener("click", () => {
      clearChat();
      textarea.focus();
    });
  });
}

/* ==========================================================
   NAVIGATION + SIDEBAR
   ========================================================== */

function setActiveView(targetId) {
  qsa(".view").forEach((section) => section.classList.toggle("active", section.id === targetId));
  qsa(".nav__item").forEach((item) => item.classList.toggle("active", item.dataset.target === targetId));
  if (window.innerWidth <= 1120) document.body.classList.remove("drawer-open");
}

function wireNavigation() {
  qsa('[data-target]').forEach((el) => {
    el.addEventListener("click", (e) => {
      const target = el.dataset.target;
      if (!target) return;
      e.preventDefault();
      setActiveView(target);
    });
  });
}

function wireSidebarToggle() {
  const toggle = qs("#sidebar-toggle");
  const overlay = qs("#sidebar-overlay");
  const close = () => document.body.classList.remove("drawer-open");
  const toggleSidebar = () => document.body.classList.toggle("drawer-open");
  toggle?.addEventListener("click", toggleSidebar);
  overlay?.addEventListener("click", close);
}

/* ==========================================================
   PROPOSAL
   ========================================================== */

function wireProposalForm() {
  const form = qs("#proposal-form");
  const submitBtn = qs("#proposal-submit");
  const clearBtn = qs("#proposal-clear");
  const output = qs("#proposal-output");
  const outputBody = qs("#proposal-body");
  const status = qs("#proposal-status");

  if (!form || !submitBtn || !outputBody || !status) return;

  const setProposalState = (stateText) => {
    status.textContent = stateText;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const client = qs("#proposal-client").value.trim();
    const level = qs("#proposal-level").value.trim();
    const context = qs("#proposal-context").value.trim();

    if (!client || !level || !context || sending) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="ri-loader-4-line" aria-hidden="true"></i> Generating';
    setProposalState("Generating...");

    const prompt = `Create a concise Changing Tides proposal. Include: client name (${client}), level of care (${level}), goals, recommended services, and a short rationale. Context: ${context}`;

    const reply = await callModel(prompt, {
      modelId: PROPOSAL_MODEL_ID,
      systemPrompt: "You create clear, structured Changing Tides program proposals. Keep them brief and actionable."
    });

    outputBody.textContent = reply;
    output.hidden = false;
    setProposalState("Ready");
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="ri-magic-line" aria-hidden="true"></i> <span>Generate proposal</span>';
  });

  clearBtn?.addEventListener("click", () => {
    form.reset();
    output.hidden = true;
    outputBody.textContent = "";
  });
}

/* ==========================================================
   INIT
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  renderModels();
  wireChatUI();
  wireNavigation();
  wireSidebarToggle();
  wireProposalForm();
  toggleEmptyState(true);
  setActiveView("view-chat");
});
