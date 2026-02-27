const messagesDiv = document.getElementById('messages');
const textInput = document.getElementById('textInput');
const sendBtn = document.getElementById('sendBtn');
const micBtn = document.getElementById('micBtn');
const memoriesList = document.getElementById('memoriesList');

const alertsList = document.getElementById('alertsList');

let conversationHistory = [];
let storedMemories = [];
const recorder = new AudioRecorder();
let isRecording = false;

// Load alerts on page load and refresh every 60 seconds
loadAlerts();
setInterval(loadAlerts, 60000);

// Initial greeting
addMessage(
  'assistant',
  "Hello! I'm here to help record memories about Eleanor. Tell me about her life \u2014 her family, favorite places, special moments. I'll save everything so she can be reminded later."
);

// Send on button click or Enter key
sendBtn.addEventListener('click', () => sendMessage());
textInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// Mic button: hold to record
micBtn.addEventListener('pointerdown', async () => {
  isRecording = true;
  micBtn.classList.add('recording');
  micBtn.textContent = 'Recording...';
  await recorder.start();
});

micBtn.addEventListener('pointerup', async () => {
  if (!isRecording) return;
  isRecording = false;
  micBtn.classList.remove('recording');
  micBtn.textContent = '\u{1F3A4}';

  try {
    const blob = await recorder.stop();
    textInput.value = 'Transcribing...';
    const text = await recorder.transcribe(blob);
    textInput.value = text;
  } catch (err) {
    textInput.value = '';
    console.error('Recording error:', err);
  }
});

async function sendMessage() {
  const text = textInput.value.trim();
  if (!text) return;

  textInput.value = '';
  addMessage('user', text);

  // Show typing indicator
  const typingId = addMessage('assistant', '...');

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: conversationHistory }),
    });
    const data = await response.json();

    // Update conversation history
    conversationHistory.push({ role: 'user', content: text });
    conversationHistory.push({ role: 'assistant', content: data.reply });

    // Update typing indicator with actual response
    updateMessage(typingId, data.reply, data.memoriesStored);

    // Add memories to sidebar
    if (data.memoriesStored && data.memoriesStored.length > 0) {
      for (const mem of data.memoriesStored) {
        addMemoryCard(mem.content);
      }
    }
  } catch (err) {
    updateMessage(typingId, 'Sorry, something went wrong. Please try again.');
    console.error('Chat error:', err);
  }
}

function addMessage(role, text) {
  // Remove empty state from memories panel on first message
  const emptyState = memoriesList.querySelector('.empty-state');
  if (emptyState && role === 'user') emptyState.remove();

  const id = 'msg-' + Date.now();
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.id = id;
  div.textContent = text;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  return id;
}

function updateMessage(id, text, memoriesStored) {
  const div = document.getElementById(id);
  if (!div) return;
  div.textContent = text;

  if (memoriesStored && memoriesStored.length > 0) {
    const tag = document.createElement('span');
    tag.className = 'stored-tag';
    tag.textContent = `\u2713 ${memoriesStored.length} memory saved`;
    div.appendChild(tag);
  }
}

function addMemoryCard(content) {
  const card = document.createElement('div');
  card.className = 'memory-card';

  const contentDiv = document.createElement('div');
  contentDiv.className = 'content';
  contentDiv.textContent = content;
  card.appendChild(contentDiv);

  memoriesList.prepend(card);
}

async function loadAlerts() {
  try {
    const response = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();

    alertsList.innerHTML = '';

    if (!data.alerts || data.alerts.length === 0) {
      alertsList.innerHTML = '<div class="alert-card info">No alerts. Eleanor is doing well.</div>';
      return;
    }

    data.alerts.forEach((alert) => {
      const div = document.createElement('div');
      div.className = `alert-card ${alert.severity}`;
      div.textContent = alert.message;
      alertsList.appendChild(div);
    });
  } catch (err) {
    console.error('Alerts error:', err);
    alertsList.innerHTML = '<div class="alert-card info">Could not load alerts</div>';
  }
}
