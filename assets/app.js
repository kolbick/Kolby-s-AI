/* ==========================================================
   Kolby's AI — interface
   Keeps existing backend URL/JWT + model IDs intact
   ========================================================== */

const OPENWEBUI_URL = "https://kaitlin-unfertilisable-snottily.ngrok-free.dev/api/chat/completions";
const OPENWEBUI_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM5NWUyNDIyLTk2ZTMtNDlmNi1iYjk2LTU3MTcyMWRjN2NhMCIsImV4cCI6MTc2NzQ3OTYxOSwianRpIjoiYWRhN2RiNTctNGZmZS00YjIwLWIxYTMtZGJkYjBkNzI0OGIxIn0.9f-SW4DckWTAu5cR9yY5wbW8Y3Jpg86xE7WPA4o2h28";

const MODELS = [
  {
    id: "kolbys-ai-v2",
    label: "Kolby's AI (Alpha)",
    description: "",
    logo: "assets/logos/kolbys-ai-logo.png"
  },
  {
    id: "kolbys-ai-v21",
    label: "Kolby's AI (Beta 1.0)",
    description: "",
    logo: "assets/logos/kolbys-ai-logo.png"
  },
  {
    id: "kolbys-ai-v22",
    label: "Kolby's AI (Beta 1.1)",
    description: "",
    logo: "assets/logos/kolbys-ai-logo.png"
  },
  {
    id: "changing-tides-ai-proposal-test",
    label: "Notes (Beta)",
    description: "",
    logo: "assets/logos/changing-tides.png"
  },
  {
    id: "mountains-to-sea-therapy",
    label: "Mountains to Sea Therapy",
    description: "",
    logo: "assets/logos/mountains-to-sea.png"
  }
];

const THEME_BY_MODEL = {
  "changing-tides-ai-proposal-test": "beach",
  "mountains-to-sea-therapy": "mountain"
};

let currentModel = MODELS[0].id;
let spicyMode = false;
let originMode = false;
let sending = false;
let lastUserText = "";

/* ==========================================================
   UTILITIES
   ========================================================== */
const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => Array.from(document.querySelectorAll(selector));

function updateModesIndicator() {
  const indicator = qs("#modes-indicator");
  if (!indicator) return;
  indicator.textContent = `Spicy: ${spicyMode ? "On" : "Off"} · Origin: ${originMode ? "On" : "Off"}`;
}

function setThemeForModel(modelId) {
  const theme = THEME_BY_MODEL[modelId] || "light";
  document.documentElement.setAttribute("data-theme", theme);
  const themeLabel = theme === "beach" ? "Changing Tides" : theme === "mountain" ? "Mountains to Sea" : "light";
  const indicator = qs("#theme-indicator");
  if (indicator) indicator.textContent = `Theme: ${themeLabel}`;
}

function populateModelSelect() {
  const select = qs("#model-select");
  if (!select) return;
  select.innerHTML = "";
  MODELS.forEach((model) => {
    const option = document.createElement("option");
    option.value = model.id;
    option.textContent = model.label;
    select.appendChild(option);
  });
}

function renderModelPicker() {
  const container = qs("#model-picker");
  if (!container) return;

  container.innerHTML = "";

  MODELS.forEach((model) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "model-picker__item";
    button.setAttribute("data-model-id", model.id);
    button.setAttribute("role", "listitem");
    button.setAttribute("aria-label", model.label);

    if (model.id === currentModel) {
      button.classList.add("model-picker__item--active");
      button.setAttribute("aria-current", "true");
    }

    const img = document.createElement("img");
    img.src = model.logo;
    img.alt = model.label;
    img.loading = "lazy";

    button.appendChild(img);

    button.addEventListener("click", () => {
      if (model.id !== currentModel) {
        setActiveModel(model.id);
      }
    });

    container.appendChild(button);
  });
}

function renderBadges(model) {
  const row = qs("#model-badges");
  if (!row || !model) return;
  row.innerHTML = "";
  const chips = [model.label];
  chips.forEach((text) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.textContent = text;
    row.appendChild(chip);
  });
}

function setActiveModel(modelId) {
  currentModel = modelId;
  populateModelSelect();

  const select = qs("#model-select");
  if (select && select.value !== modelId) select.value = modelId;

  const model = MODELS.find((m) => m.id === modelId) || MODELS[0];
  qs("#active-model-name").textContent = model.label;
  qs("#active-model-subtitle").textContent = model.description;
  qs("#topbar-model-name").textContent = model.label;
  qs("#active-logo").src = model.logo;
  qs("#topbar-logo").src = model.logo;

  if (model.logo) {
    document.documentElement.style.setProperty("--watermark-image", `url("${model.logo}")`);
  }

  setThemeForModel(modelId);
  renderBadges(model);
  updateModesIndicator();
  renderModelPicker();
}

function toggleEmptyState(show) {
  const empty = qs("#chat-empty");
  const thread = qs("#chat-thread");
  if (empty) empty.style.display = show ? "grid" : "none";
  if (thread && show) thread.innerHTML = "";
}

function buildSystemPrompt() {
  let prompt = "You are Kolby's AI assistant.";
  if (spicyMode) {
    prompt += " Spicy Mode ON: reply with witty, sarcastic but not cruel humor while staying helpful.";
  }
  if (originMode) {
    prompt += " If asked, share the origin story about Kolby building the model.";
  }
  return prompt;
}

function createTyping() {
  const typing = document.createElement("span");
  typing.className = "typing";
  typing.innerHTML = "<span></span><span></span><span></span>";
  return typing;
}

function fillContent(container, text) {
  container.textContent = text;
}

function appendMessage(role, text, { pending = false } = {}) {
  const thread = qs("#chat-thread");
  if (!thread) return null;

  toggleEmptyState(false);

  const bubble = document.createElement("article");
  bubble.className = `bubble bubble--${role}${pending ? " bubble--pending" : ""}`;

  const meta = document.createElement("div");
  meta.className = "bubble__meta";
  const roleSpan = document.createElement("span");
  roleSpan.className = "bubble__role";
  roleSpan.textContent = role === "user" ? "You" : "Kolby’s AI";
  meta.appendChild(roleSpan);

  const time = document.createElement("span");
  time.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  meta.appendChild(time);

  const content = document.createElement("div");
  content.className = "bubble__content";
  if (pending) {
    content.appendChild(createTyping());
  } else {
    fillContent(content, text);
  }

  bubble.appendChild(meta);
  bubble.appendChild(content);

  if (role === "assistant" && !pending) {
    const actions = document.createElement("div");
    actions.className = "bubble__actions";
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "ghost-btn";
    retry.textContent = "Retry";
    retry.addEventListener("click", () => {
      if (lastUserText) sendFlow(lastUserText);
    });
    actions.appendChild(retry);
    bubble.appendChild(actions);
  }

  thread.appendChild(bubble);
  thread.scrollTop = thread.scrollHeight;
  return bubble;
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
}

/* ==========================================================
   BACKEND CALL
   ========================================================== */
async function callModel(userText, { modelId = currentModel } = {}) {
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
          { role: "system", content: buildSystemPrompt() },
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
   CHAT FLOW
   ========================================================== */
async function sendFlow(text) {
  if (!text || sending) return;
  lastUserText = text;
  setSending(true);
  appendMessage("user", text);
  const pending = appendMessage("assistant", "Thinking...", { pending: true });

  const reply = await callModel(text);

  if (pending) {
    pending.classList.remove("bubble--pending");
    const content = pending.querySelector(".bubble__content");
    if (content) fillContent(content, reply);
    const actions = pending.querySelector(".bubble__actions");
    if (!actions) {
      const actionWrap = document.createElement("div");
      actionWrap.className = "bubble__actions";
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "ghost-btn";
      retry.textContent = "Retry";
      retry.addEventListener("click", () => {
        if (lastUserText) sendFlow(lastUserText);
      });
      actionWrap.appendChild(retry);
      pending.appendChild(actionWrap);
    }
  }

  setSending(false);
}

function wireComposer() {
  const form = qs("#chat-form");
  const textarea = qs("#chat-input");
  if (!form || !textarea) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = textarea.value.trim();
    if (!text) return;
    textarea.value = "";
    sendFlow(text);
  });

  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const text = textarea.value.trim();
      if (!text) return;
      textarea.value = "";
      sendFlow(text);
    }
  });

  qsa(".prompt-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const prompt = btn.dataset.prompt || "";
      textarea.value = prompt;
      textarea.focus();
    });
  });
}

function wireSidebar() {
  const openBtn = qs("#sidebar-open");
  const scrim = qs("#sidebar-scrim");
  const sidebar = qs("#sidebar");
  const close = () => document.body.classList.remove("drawer-open");
  openBtn?.addEventListener("click", () => document.body.classList.add("drawer-open"));
  scrim?.addEventListener("click", close);
  sidebar?.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

function wireModelSelect() {
  const select = qs("#model-select");
  if (!select) return;
  select.addEventListener("change", () => {
    setActiveModel(select.value);
    document.body.classList.remove("drawer-open");
  });
}

function wireToggles() {
  const spicyBtn = qs("#spicy-toggle");
  const originBtn = qs("#origin-toggle");

  const update = () => {
    spicyBtn.textContent = `Spicy Mode: ${spicyMode ? "On" : "Off"}`;
    spicyBtn.setAttribute("aria-pressed", spicyMode);
    originBtn.textContent = `Origin Story: ${originMode ? "On" : "Off"}`;
    originBtn.setAttribute("aria-pressed", originMode);
    updateModesIndicator();
    const model = MODELS.find((m) => m.id === currentModel);
    renderBadges(model);
  };

  spicyBtn?.addEventListener("click", () => {
    spicyMode = !spicyMode;
    update();
  });

  originBtn?.addEventListener("click", () => {
    originMode = !originMode;
    update();
  });

  update();
}

function wireNewChat() {
  const newChatBtn = qs("#new-chat-btn");
  const textarea = qs("#chat-input");
  newChatBtn?.addEventListener("click", () => {
    toggleEmptyState(true);
    lastUserText = "";
    textarea?.focus();
  });
}

function init() {
  populateModelSelect();
  setActiveModel(currentModel);
  wireComposer();
  wireSidebar();
  wireModelSelect();
  wireToggles();
  wireNewChat();
  renderModelPicker();
  toggleEmptyState(true);
}

document.addEventListener("DOMContentLoaded", init);
