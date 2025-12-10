/* ==========================================================
   Kolby's AI — Local OpenWebUI Model Integration
   ========================================================== */

/* ---------- CONFIG ---------- */

const OPENWEBUI_URL = "PASTE_NGROK_URL_HERE/api/chat/completions";
const OPENWEBUI_JWT = "PASTE_JWT_TOKEN_HERE";

/* ---------- YOUR MODELS ---------- */

const MODELS = [
  { id: "kolbys-ai-v2",  label: "Kolby's AI (Alpha)" },
  { id: "kolbys-ai-v21", label: "Kolby's AI (Beta 1.0)" },
  { id: "kolbys-ai-v22", label: "Kolby's AI (Beta 1.1)" },
  { id: "changing-tides-ai-proposal-test", label: "Changing Tides AI Proposal (Test)" }
];

let currentModel = MODELS[0].id;

/* ==========================================================
   BUILD SIDEBAR MODEL LIST
   ========================================================== */

function loadModelList() {
  console.log("app.js loaded, building model list…");

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
    li.textContent = model.label;

    if (model.id === currentModel) li.classList.add("active");

    li.addEventListener("click", () => {
      currentModel = model.id;
      document
        .querySelectorAll(".model-list-item")
        .forEach((el) => el.classList.toggle("active", el === li));
      console.log("Selected model:", currentModel);
    });

    list.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", loadModelList);

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

const form  = document.getElementById("chat-form");
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
