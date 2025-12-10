/* ==========================================================
   Kolby's AI — Unified Script for Chat + Model Selection
   ========================================================== */

/* ---------- CONFIG ---------- */
const OPENWEBUI_URL = "http://localhost:3000/api/chat/completions";
const OPENWEBUI_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM5NWUyNDIyLTk2ZTMtNDlmNi1iYjk2LTU3MTcyMWRjN2NhMCIsImV4cCI6MTc2NzQ3OTYxOSwianRpIjoiYWRhN2RiNTctNGZmZS00YjIwLWIxYTMtZGJkYjBkNzI0OGIxIn0.9f-SW4DckWTAu5cR9yY5wbW8Y3Jpg86xE7WPA4o2h28";

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
  const list = document.getElementById("model-list");
  if (!list) {
    console.error("Model list not found (#model-list).");
    return;
  }

  list.innerHTML = "";

  MODELS.forEach((model, index) => {
    const li = document.createElement("li");
    li.className = "model-list-item";
    li.textContent = model.label;

    if (index === 0) li.classList.add("active");

    li.addEventListener("click", () => {
      currentModel = model.id;

      document.querySelectorAll(".model-list-item").forEach(e => e.classList.remove("active"));
      li.classList.add("active");
    });

    list.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", loadModelList);

/* ==========================================================
   API CALL TO OPENWEBUI
   ========================================================== */
async function callModel(userText) {
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

    const data = await response.json();

    if (!data?.choices?.[0]?.message?.content) {
      return "No reply from backend — check model ID or JWT.";
    }

    return data.choices[0].message.content;

  } catch (err) {
    return "Backend error: " + err.message;
  }
}

/* ==========================================================
   CHAT UI HANDLERS
   ========================================================== */
const form   = document.getElementById("chat-form");
const input  = document.getElementById("chat-input");
const empty  = document.getElementById("chat-empty");
const shell  = document.querySelector(".chat-shell");

function appendMessage(role, text) {
  if (empty) empty.style.display = "none";

  const msg = document.createElement("div");
  msg.className = `chat-msg ${role}`;
  msg.innerHTML = `<p>${text}</p>`;
  shell.appendChild(msg);
  shell.scrollTop = shell.scrollHeight;
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const text = input.value.trim();
    if (!text) return;

    appendMessage("user", text);
    input.value = "";

    const reply = await callModel(text);
    appendMessage("assistant", reply);
  });
}
