/* ==========================================================
   Kolby's AI — Local OpenWebUI Model Integration
   ========================================================== */

/* ---------- CONFIG ---------- */

const OPENWEBUI_URL = "https://YOUR_NGROK_URL_HERE/api/chat/completions";
const OPENWEBUI_JWT = "PASTE_YOUR_JWT_TOKEN_HERE";

/* ---------- YOUR MODELS ---------- */

const MODELS = [
  { id: "kolbys-ai-v2", label: "Kolby's AI (Alpha)" },
  { id: "kolbys-ai-v21", label: "Kolby's AI (Beta 1.0)" },
  { id: "kolbys-ai-v22", label: "Kolby's AI (Beta 1.1)" },
  { id: "changing-tides-ai-proposal-test", label: "Changing Tides AI Proposal (Test)" },
  { id: "mountains-to-sea-therapy", label: "Mountains to Sea Therapy" }
];

let currentModel = MODELS[0].id;

/* ==========================================================
   BUILD SIDEBAR MODEL LIST
   ========================================================== */

function applyWatermark(modelId) {
  const watermark = document.querySelector(".watermark");
  if (!watermark) return;

  const isMountains = modelId === "mountains-to-sea-therapy";
  watermark.classList.toggle("watermark--mountains", isMountains);
  watermark.classList.toggle("watermark--kolby", !isMountains);
}

function activateModel(li, model) {
  currentModel = model.id;
  document
    .querySelectorAll(".model-list-item")
    .forEach((el) => el.classList.toggle("active", el === li));
  applyWatermark(currentModel);
  document.body.classList.remove("sidebar-open");
  console.log("Selected model:", currentModel);
}

function loadModelList() {
  const list = document.getElementById("model-list");
  if (!list) {
    console.error("Could not find #model-list in the DOM.");
    return;
  }

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

function wireChatUI() {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const empty = document.getElementById("chat-empty");
  const shell = document.querySelector(".chat-shell");

  function appendMessage(role, text) {
    if (empty) empty.style.display = "none";

    const msg = document.createElement("div");
    msg.className = `chat-msg ${role}`;
    msg.innerHTML = `<p>${text}</p>`;
    shell.appendChild(msg);
    shell.scrollTop = shell.scrollHeight;
  }

  if (form && input && shell) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const text = input.value.trim();
      if (!text) return;

      appendMessage("user", text);
      input.value = "";

      const reply = await callModel(text);
      appendMessage("assistant", reply);
    });
  } else {
    console.warn("Chat UI not found on this page.");
  }
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
});
