/*
  Kolby’s AI main script

  This script powers the sidebar model selector, the chat input and the
  modal sign‑in flow.  It has been rewritten to support calling your
  locally hosted Open WebUI instance for chat completions.  To
  authenticate requests, you must paste your JWT token into the
  `OPENWEBUI_JWT` constant below.  If you change your model names
  inside Open WebUI, update the `MODELS` array accordingly.  Each model
  entry should have an `id` that matches the model ID visible in
  Open WebUI and a `label` that will be displayed in the sidebar.

  When the user sends a chat message, the current model ID is passed to
  Open WebUI so that the correct workspace preset is used.  If no
  JWT token has been provided, the assistant displays a warning
  explaining that the backend is not yet connected.
*/

// Paste your Open WebUI JWT token here.  You can obtain it from the
// Settings → Account page inside Open WebUI.  Leave it as an empty
// string until you have a token, then replace the empty string with
// your token (do not surround the token with quotes again).  See
// docs: you can authenticate using a JWT token or an API key【6884566221690†L23-L27】.
const OPENWEBUI_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM5NWUyNDIyLTk2ZTMtNDlmNi1iYjk2LTU3MTcyMWRjN2NhMCIsImV4cCI6MTc2NzQ3OTYxOSwianRpIjoiYWRhN2RiNTctNGZmZS00YjIwLWIxYTMtZGJkYjBkNzI0OGIxIn0.9f-SW4DckWTAu5cR9yY5wbW8Y3Jpg86xE7WPA4o2h28';

// Endpoint for the Open WebUI chat completions API.  Change the host
// and port if your WebUI runs on a different machine or port.
const OPENWEBUI_URL = 'http://localhost:3000/api/chat/completions';

// Define your available models.  The `id` should match the ID/name
// configured in your Open WebUI workspace presets.  The `label` is
// what appears in the sidebar.
const MODELS = [
  { id: "Kolby's AI (Alpha-Build)", label: "Kolby's AI (Alpha-Build)" },
  { id: "Kolby's AI (Beta 1.0)", label: "Kolby's AI (Beta 1.0)" },
  { id: "Kolby's AI (Beta 1.1)", label: "Kolby's AI (Beta 1.1)" },
  { id: "Changing Tides AI Proposal (Test)", label: "Changing Tides AI Proposal (Test)" },
];

// State
let currentModel = MODELS[0].id;
let isLoggedIn = false;
let currentUser = null;

// DOM references
const modelListEl = document.getElementById('model-list');
const chatFormEl = document.getElementById('chat-form');
const chatInputEl = document.getElementById('chat-input');
const emptyEl = document.getElementById('chat-empty');
const signInBtn = document.getElementById('sign-in-btn');
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const loginCancel = document.getElementById('login-cancel');

// Render the model list in the sidebar
function renderModels() {
  modelListEl.innerHTML = '';
  MODELS.forEach((m) => {
    const li = document.createElement('li');
    li.className = 'model-item';
    li.innerHTML = `<span class="id">${m.id}</span><span>${m.label.replace(m.id, '')}</span>`;
    li.addEventListener('click', () => {
      currentModel = m.id;
      document.querySelectorAll('.model-item').forEach((el) => {
        el.style.fontWeight = 'normal';
      });
      li.style.fontWeight = '600';
    });
    if (m.id === currentModel) li.style.fontWeight = '600';
    modelListEl.appendChild(li);
  });
}

/**
 * Call the Open WebUI chat completions endpoint with the current model.
 * Returns the assistant's reply text or a fallback message if
 * authentication is not configured or the request fails.
 *
 * @param {string} message The user input to send to the model.
 * @returns {Promise<string>} The assistant's reply.
 */
async function callOpenWebUIChat(message) {
  if (!OPENWEBUI_JWT) {
    return 'Backend not wired yet. Please paste your JWT token into OPENWEBUI_JWT in assets/app.js.';
  }
  try {
    const response = await fetch(OPENWEBUI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENWEBUI_JWT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: currentModel,
        messages: [
          { role: 'system', content: 'You are Kolby\'s AI chat assistant.' },
          { role: 'user', content: message }
        ]
      })
    });
    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;
    return reply || 'No reply from backend.';
  } catch (err) {
    console.error('Error calling Open WebUI:', err);
    return 'Error contacting backend.';
  }
}

// Chat submit handler
chatFormEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = chatInputEl.value.trim();
  if (!text) return;
  emptyEl.textContent = 'Thinking…';
  const reply = await callOpenWebUIChat(text);
  emptyEl.textContent = reply;
  chatInputEl.value = '';
});

// Login modal UI
function openLogin() {
  loginModal.classList.remove('hidden');
}
function closeLogin() {
  loginModal.classList.add('hidden');
}

signInBtn.addEventListener('click', openLogin);
loginCancel.addEventListener('click', closeLogin);

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  isLoggedIn = true;
  currentUser = { email, isAdmin: true };
  signInBtn.textContent = email.split('@')[0] || 'Account';
  closeLogin();
});

// Initialise the model list on page load
renderModels();
