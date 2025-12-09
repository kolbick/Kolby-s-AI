const API_BASE_URL = ""; // set later

const MODELS = [
  { id: "V1", label: "V1 (Pi)" },
  { id: "V2", label: "V2" },
  { id: "V2.1", label: "V2.1" },
  { id: "V2.2", label: "V2.2" },
];

let currentModel = "V1";
let isLoggedIn = false;
let currentUser = null;

// DOM
const modelListEl = document.getElementById("model-list");
const chatFormEl = document.getElementById("chat-form");
const chatInputEl = document.getElementById("chat-input");
const emptyEl = document.getElementById("chat-empty");
const signInBtn = document.getElementById("sign-in-btn");
const loginModal = document.getElementById("login-modal");
const loginForm = document.getElementById("login-form");
const loginCancel = document.getElementById("login-cancel");

// build model list
function renderModels() {
  modelListEl.innerHTML = "";
  MODELS.forEach((m) => {
    const li = document.createElement("li");
    li.className = "model-item";
    li.innerHTML = `<span class="id">${m.id}</span><span>${m.label.replace(
      m.id,
      ""
    )}</span>`;
    li.addEventListener("click", () => {
      currentModel = m.id;
      document
        .querySelectorAll(".model-item")
        .forEach((el) => el.style.fontWeight = "normal");
      li.style.fontWeight = "600";
    });
    if (m.id === currentModel) li.style.fontWeight = "600";
    modelListEl.appendChild(li);
  });
}

// fake backend call
async function sendToBackend(message) {
  if (!API_BASE_URL) {
    await new Promise((r) => setTimeout(r, 300));
    return `(${currentModel}) Backend not wired yet. This will be a real response once your API is connected.`;
  }
  // TODO: real fetch to your backend
}

// chat submit
chatFormEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = chatInputEl.value.trim();
  if (!text) return;

  emptyEl.textContent = "Thinking…";

  const reply = await sendToBackend(text);

  emptyEl.textContent = reply;
  chatInputEl.value = "";
});

// login modal UI
function openLogin() {
  loginModal.classList.remove("hidden");
}
function closeLogin() {
  loginModal.classList.add("hidden");
}

signInBtn.addEventListener("click", openLogin);
loginCancel.addEventListener("click", closeLogin);

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  isLoggedIn = true;
  currentUser = { email, isAdmin: true };
  signInBtn.textContent = email.split("@")[0] || "Account";
  closeLogin();
});

// init
renderModels();
