/* ==========================================================
   Kolby's AI — Local OpenWebUI Model Integration
   ========================================================== */

const OPENWEBUI_URL = "http://localhost:3000/api/chat/completions";
const OPENWEBUI_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM5NWUyNDIyLTk2ZTMtNDlmNi1iYjk2LTU3MTcyMWRjN2NhMCIsImV4cCI6MTc2NzQ3OTYxOSwianRpIjoiYWRhN2RiNTctNGZmZS00YjIwLWIxYTMtZGJkYjBkNzI0OGIxIn0.9f-SW4DckWTAu5cR9yY5wbW8Y3Jpg86xE7WPA4o2h28";

/*  
   THESE ARE YOUR ACTUAL MODEL IDs  
   ----------------------------------------------------------
   The 'label' is what appears in your sidebar.
   The 'id' is the slug your backend uses.
*/

const MODELS = [
  { id: "kolbys-ai-v2", label: "Kolby's AI (Alpha)" },
  { id: "kolbys-ai-v21", label: "Kolby's AI (Beta 1.0)" },
  { id: "kolbys-ai-v22", label: "Kolby's AI (Beta 1.1)" },
  { id: "changing-tides-ai-proposal-test", label: "Changing Tides AI Proposal (Test)" }
];

let currentModel = MODELS[0].id;

/* Populate Model List in Sidebar */
function loadModelList() {
  const list = document.getElementById("model-list");
  list.innerHTML = "";

  MODELS.forEach(model => {
    const li = document.createElement("li");
    li.className = "model-list-item";
    li.textContent = model.label;
    li.onclick = () => {
      currentModel = model.id;
      document.querySelectorAll(".model-list-item").forEach(e => e.classList.remove("active"));
      li.classList.add("active");
    };
    list.appendChild(li);
  });
}

loadModelList();

/* ==========================================================
   MAIN CHAT FUNCTION
   ========================================================== */

async function callOpenWebUIChat(message) {
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
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    if (!data?.choices?.[0]?.message?.content) {
      return "No reply from backend. Check your JWT token or model ID.";
    }

    return data.choices[0].message.content;

  } catch (err) {
    return "Error contacting backend: " + err.message;
  }
}

/* ==========================================================
   CHAT UI HANDLING
   ========================================================== */

const form = document.getElementById("chat-form");
const input = document.getElementById("chat-input");
const empty = document.getElementById("chat-empty");
const shell = document.querySelector(".chat-shell");

function appendMessage(role, text) {
  empty.style.display = "none";

  const bubble = document.createElement("div");
  bubble.className = `chat-msg ${role}`;
  bubble.innerHTML = `<p>${text}</p>`;
  shell.appendChild(bubble);

  shell.scrollTop = shell.scrollHeight;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userText = input.value.trim();
  if (!userText) return;

  appendMessage("user", userText);
  input.value = "";

  const reply = await callOpenWebUIChat(userText);
  appendMessage("assistant", reply);
});
