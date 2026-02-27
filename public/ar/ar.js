// ============================================================
//  MindLink AR — Question Mode + Constellation Mode
// ============================================================

const recorder = new AudioRecorder();
const talkBtn = document.getElementById('talkBtn2D');
const statusDiv = document.getElementById('status2D');
const modeToggle = document.getElementById('modeToggle');
const listeningBadge = document.getElementById('listeningBadge');

// A-Frame elements — Question Mode
const questionMode = document.getElementById('questionMode');
const answerCard = document.getElementById('answerCard');
const answerText = document.getElementById('answerText');
const answerHeader = document.getElementById('answerHeader');
const peopleCards = document.getElementById('peopleCards');
const micIndicator = document.getElementById('micIndicator3D');
const thinkingIndicator = document.getElementById('thinkingIndicator');

// A-Frame elements — Constellation Mode
const constellationMode = document.getElementById('constellationMode');
const memoryNodes = document.getElementById('memoryNodes');
const memoryEdges = document.getElementById('memoryEdges');
const detailPanel = document.getElementById('detailPanel');
const detailTitle = document.getElementById('detailTitle');
const detailContent = document.getElementById('detailContent');

let isRecording = false;
let currentMode = 'question'; // 'question' or 'constellation'
let constellationLoaded = false;

// ============================================================
//  Category colors for visual variety
// ============================================================
const CATEGORY_COLORS = {
  family: '#ff6b9d',
  'early-life': '#ffa64d',
  wedding: '#ff6b9d',
  'life-events': '#ffd93d',
  education: '#6bcb77',
  career: '#6bcb77',
  health: '#ff6b6b',
  places: '#4ecdc4',
  hobbies: '#a36bff',
  favorites: '#a36bff',
  friends: '#45b7d1',
  pets: '#ffa64d',
  routine: '#78909c',
  general: '#4a90d9',
};

// ============================================================
//  MODE TOGGLE
// ============================================================
modeToggle.addEventListener('click', () => {
  if (currentMode === 'question') {
    switchToConstellation();
  } else {
    switchToQuestion();
  }
});

function switchToConstellation() {
  currentMode = 'constellation';
  questionMode.setAttribute('visible', 'false');
  constellationMode.setAttribute('visible', 'true');
  modeToggle.textContent = 'Ask a Question';

  if (!constellationLoaded) {
    loadConstellation();
  }
}

function switchToQuestion() {
  currentMode = 'question';
  questionMode.setAttribute('visible', 'true');
  constellationMode.setAttribute('visible', 'false');
  modeToggle.textContent = 'Show My Memories';
  detailPanel.setAttribute('visible', 'false');
}

// ============================================================
//  QUESTION MODE — Hold to Talk
// ============================================================
talkBtn.addEventListener('pointerdown', async (e) => {
  e.preventDefault();
  if (isRecording) return;
  isRecording = true;
  talkBtn.classList.add('recording');
  talkBtn.textContent = 'Listening...';
  statusDiv.textContent = '';

  // Show 3D mic indicator
  micIndicator.setAttribute('visible', 'true');
  answerCard.setAttribute('visible', 'false');
  peopleCards.innerHTML = '';

  // Pause live transcription
  if (window.liveTranscriber) window.liveTranscriber.pause();

  try {
    await recorder.start();
  } catch (err) {
    console.error('Mic error:', err);
    statusDiv.textContent = 'Could not access microphone';
    resetButton();
  }
});

talkBtn.addEventListener('pointerup', handleRelease);
talkBtn.addEventListener('pointerleave', handleRelease);

async function handleRelease(e) {
  e.preventDefault();
  if (!isRecording) return;
  isRecording = false;
  talkBtn.textContent = '...';
  talkBtn.classList.remove('recording');
  micIndicator.setAttribute('visible', 'false');

  try {
    const blob = await recorder.stop();
    statusDiv.textContent = 'Transcribing...';

    const text = await recorder.transcribe(blob);
    const lower = text.toLowerCase();
    statusDiv.textContent = `"${text}"`;

    // --- COMMAND: "Show my memories" ---
    if (lower.includes('show') && lower.includes('memor')) {
      switchToConstellation();
      resetButton();
      if (window.liveTranscriber) window.liveTranscriber.resume();
      return;
    }

    // --- COMMAND: "Remember this/that..." ---
    if (lower.includes('remember that') || lower.includes('remember this')) {
      const memoryContent = text.replace(/^.*?remember (this|that)\s*/i, '');
      statusDiv.textContent = 'Saving memory...';
      const response = await fetch('/api/remember', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: memoryContent }),
      });
      const data = await response.json();
      showAnswerCard(data.answer, [], []);
      speakAnswer(data.answer);
      resetButton();
      if (window.liveTranscriber) window.liveTranscriber.resume();
      return;
    }

    // --- COMMAND: "Good morning" / "What's happening today" (Daily Briefing) ---
    if (
      lower.includes('good morning') ||
      lower.includes("what's happening today") ||
      lower.includes('whats happening today') ||
      lower.includes('daily briefing') ||
      lower.includes('what is happening today') ||
      lower.includes("what's my day")
    ) {
      thinkingIndicator.setAttribute('visible', 'true');
      answerCard.setAttribute('visible', 'false');
      const response = await fetch('/api/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      thinkingIndicator.setAttribute('visible', 'false');
      showAnswerCard(data.answer, data.people || [], data.places || [], 'Good Morning');
      speakAnswer(data.answer);
      resetButton();
      if (window.liveTranscriber) window.liveTranscriber.resume();
      return;
    }

    // --- COMMAND: "Show me today" (Timeline) ---
    if (
      (lower.includes('show') && lower.includes('today')) ||
      lower.includes('timeline') ||
      lower.includes('what happened today')
    ) {
      statusDiv.textContent = 'Loading timeline...';
      await showTimeline();
      resetButton();
      if (window.liveTranscriber) window.liveTranscriber.resume();
      return;
    }

    // --- DEFAULT: Normal recall question ---
    thinkingIndicator.setAttribute('visible', 'true');
    answerCard.setAttribute('visible', 'false');

    const response = await fetch('/api/recall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: text }),
    });
    const data = await response.json();

    thinkingIndicator.setAttribute('visible', 'false');
    showAnswerCard(data.answer, data.people || [], data.places || []);
    speakAnswer(data.answer);
  } catch (err) {
    console.error('Recall error:', err);
    statusDiv.textContent = 'Something went wrong. Try again.';
    thinkingIndicator.setAttribute('visible', 'false');
  }

  resetButton();
  if (window.liveTranscriber) window.liveTranscriber.resume();
}

// Helper to speak answers
function speakAnswer(text) {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    speechSynthesis.speak(utterance);
  }
}

function resetButton() {
  talkBtn.textContent = 'Hold to Talk';
  talkBtn.classList.remove('recording');
  isRecording = false;
}

// ============================================================
//  QUESTION MODE — Show Floating Answer + People Cards
// ============================================================
function showAnswerCard(answer, people, places, headerText) {
  // Truncate long answers for display
  const displayAnswer =
    answer.length > 200 ? answer.substring(0, 200) + '...' : answer;

  answerText.setAttribute('value', displayAnswer);
  answerHeader.setAttribute('value', headerText || 'MindLink');

  // Animate card in
  answerCard.setAttribute('visible', 'true');
  answerCard.setAttribute('animation', {
    property: 'position',
    from: '0 1.3 -1.8',
    to: '0 1.55 -1.8',
    dur: 400,
    easing: 'easeOutQuad',
  });

  // Spawn people cards below the answer
  peopleCards.innerHTML = '';
  const tags = [];
  people.forEach((p) => tags.push({ label: p, type: 'person' }));
  places.forEach((p) => tags.push({ label: p, type: 'place' }));

  const maxCards = Math.min(tags.length, 6);
  const totalWidth = maxCards * 0.42;
  const startX = -totalWidth / 2 + 0.21;

  for (let i = 0; i < maxCards; i++) {
    const tag = tags[i];
    const x = startX + i * 0.42;
    const cardColor = tag.type === 'person' ? '#1a3a6e' : '#1a4e4e';
    const accentColor = tag.type === 'person' ? '#4a90d9' : '#4ecdc4';
    const icon = tag.type === 'person' ? 'person' : 'place';

    const card = document.createElement('a-entity');
    card.setAttribute('position', `${x} 0 0`);
    card.innerHTML = `
      <a-plane width="0.38" height="0.2" color="${cardColor}"
        material="shader: flat; transparent: true; opacity: 0.9"></a-plane>
      <a-plane width="0.38" height="0.005" color="${accentColor}" position="0 0.098 0.001"
        material="shader: flat"></a-plane>
      <a-text value="${tag.label}" color="#e0e8f5" font="roboto" width="0.7"
        position="0 0.01 0.01" align="center" wrap-count="15"></a-text>
      <a-text value="${tag.type === 'person' ? 'Person' : 'Place'}" color="${accentColor}" font="roboto" width="0.5"
        position="0 -0.06 0.01" align="center"></a-text>
    `;

    // Staggered animation
    card.setAttribute('animation', {
      property: 'position',
      from: `${x} -0.3 0`,
      to: `${x} 0 0`,
      dur: 300,
      delay: i * 80,
      easing: 'easeOutQuad',
    });

    peopleCards.appendChild(card);
  }
}

// ============================================================
//  TIMELINE MODE — "Show me today"
// ============================================================
async function showTimeline() {
  try {
    const response = await fetch('/api/memories/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'today conversation happened recently talked discussed',
        limit: 10,
      }),
    });
    const data = await response.json();

    // Filter for short-term memories and sort by timestamp
    const shortTerm = (data.results || [])
      .filter((r) => r.metadata && r.metadata.type === 'shortterm')
      .map((r) => ({
        content: r.content || (r.chunks && r.chunks[0] && r.chunks[0].content) || '',
        time: r.metadata.timestamp || r.createdAt || '',
      }));

    if (shortTerm.length === 0) {
      showAnswerCard(
        "I don't have any events recorded for today yet. As conversations happen around you, I'll keep track of them.",
        [], [], 'Today'
      );
      speakAnswer("I don't have any events recorded for today yet.");
      return;
    }

    // Show timeline as vertically stacked cards
    answerCard.setAttribute('visible', 'false');
    peopleCards.innerHTML = '';

    const container = peopleCards;
    const startY = (shortTerm.length - 1) * 0.25 / 2;

    shortTerm.forEach((item, i) => {
      const y = startY - i * 0.25;
      const shortContent =
        item.content.length > 60
          ? item.content.substring(0, 60) + '...'
          : item.content;

      const card = document.createElement('a-entity');
      card.setAttribute('position', `0 ${y + 0.7} 0`);
      card.innerHTML = `
        <a-plane width="1.3" height="0.18" color="#0d1b3e"
          material="shader: flat; transparent: true; opacity: 0.9"></a-plane>
        <a-plane width="0.008" height="0.18" color="#4a90d9" position="-0.646 0 0.001"
          material="shader: flat"></a-plane>
        <a-circle radius="0.02" color="#4a90d9" position="-0.646 0 0.002"
          material="shader: flat"></a-circle>
        <a-text value="${shortContent}" color="#e0e8f5" font="roboto" width="1.1"
          position="-0.6 0 0.01" anchor="left" wrap-count="45"></a-text>
      `;

      card.setAttribute('animation', {
        property: 'position',
        from: `-1 ${y + 0.7} 0`,
        to: `0 ${y + 0.7} 0`,
        dur: 300,
        delay: i * 100,
        easing: 'easeOutQuad',
      });

      container.appendChild(card);
    });

    // Title card
    const title = document.createElement('a-entity');
    title.setAttribute('position', `0 ${startY + 1.0} 0`);
    title.innerHTML = `
      <a-text value="Today's Timeline" color="#4a90d9" font="roboto" width="1.5"
        align="center"></a-text>
    `;
    container.appendChild(title);

    speakAnswer(`Here's what happened today. I found ${shortTerm.length} events.`);
    statusDiv.textContent = `${shortTerm.length} events today`;
  } catch (err) {
    console.error('Timeline error:', err);
    statusDiv.textContent = 'Could not load timeline';
  }
}

// ============================================================
//  CONSTELLATION MODE — 3D Memory Graph
// ============================================================
async function loadConstellation() {
  statusDiv.textContent = 'Loading memories...';

  try {
    const response = await fetch('/api/graph');
    const data = await response.json();

    memoryNodes.innerHTML = '';
    memoryEdges.innerHTML = '';

    const nodePositions = {};
    const nodeCount = data.nodes.length;

    // Position nodes in a sphere layout
    data.nodes.forEach((node, i) => {
      // Fibonacci sphere for even distribution
      const phi = Math.acos(1 - (2 * (i + 0.5)) / nodeCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const radius = 1.8;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      nodePositions[node.id] = { x, y, z };

      const color = CATEGORY_COLORS[node.category] || CATEGORY_COLORS.general;
      const shortLabel =
        node.label.length > 25
          ? node.label.substring(0, 25) + '...'
          : node.label;

      const nodeEl = document.createElement('a-entity');
      nodeEl.setAttribute('position', `${x} ${y} ${z}`);
      nodeEl.setAttribute('class', 'clickable');
      nodeEl.innerHTML = `
        <a-sphere radius="0.06" color="${color}"
          material="shader: flat; transparent: true; opacity: 0.9"
          class="clickable"
          animation="property: scale; from: 0.8 0.8 0.8; to: 1 1 1; dur: 600; delay: ${i * 40}; easing: easeOutElastic"
          ></a-sphere>
        <a-sphere radius="0.09" color="${color}"
          material="shader: flat; transparent: true; opacity: 0.15"
          animation="property: scale; from: 1 1 1; to: 1.3 1.3 1.3; dur: 2000; loop: true; dir: alternate; easing: easeInOutSine"
          ></a-sphere>
        <a-text value="${shortLabel}" color="#d0d8f0" font="roboto" width="1"
          position="0 0.12 0" align="center" wrap-count="20"
          look-at="[camera]"
          ></a-text>
      `;

      // Click to show detail
      nodeEl.addEventListener('click', () => {
        showNodeDetail(node);
      });

      memoryNodes.appendChild(nodeEl);
    });

    // Draw connections between related memories
    data.edges.forEach((edge, i) => {
      const from = nodePositions[edge.source];
      const to = nodePositions[edge.target];
      if (!from || !to) return;

      // Create a line using a thin cylinder between two points
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const dz = to.z - from.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      const midZ = (from.z + to.z) / 2;

      const line = document.createElement('a-entity');
      line.setAttribute('position', `${midX} ${midY} ${midZ}`);
      line.setAttribute('geometry', {
        primitive: 'cylinder',
        radius: 0.003,
        height: dist,
      });
      line.setAttribute('material', {
        shader: 'flat',
        color: '#4a6fa5',
        transparent: true,
        opacity: 0.25,
      });

      // Rotate cylinder to point between the two nodes
      line.object3D.lookAt(to.x, to.y, to.z);
      line.object3D.rotateX(Math.PI / 2);

      memoryEdges.appendChild(line);
    });

    constellationLoaded = true;
    statusDiv.textContent = `${data.nodes.length} memories loaded`;
    setTimeout(() => {
      statusDiv.textContent = '';
    }, 2000);
  } catch (err) {
    console.error('Constellation error:', err);
    statusDiv.textContent = 'Could not load memories';
  }
}

function showNodeDetail(node) {
  const title = node.label || 'Memory';
  const content = node.content || '';
  const displayContent =
    content.length > 250 ? content.substring(0, 250) + '...' : content;

  detailTitle.setAttribute('value', title);
  detailContent.setAttribute('value', displayContent);
  detailPanel.setAttribute('visible', 'true');

  // Animate in
  detailPanel.setAttribute('animation', {
    property: 'scale',
    from: '0.5 0.5 0.5',
    to: '1 1 1',
    dur: 300,
    easing: 'easeOutQuad',
  });

  // Read it aloud
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.rate = 0.85;
    speechSynthesis.speak(utterance);
  }
}

// ============================================================
//  LIVE TRANSCRIPTION (Background)
// ============================================================
class LiveTranscriber {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.stream = null;
  }

  async start() {
    this.isRunning = true;
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    listeningBadge.classList.add('active');
    this.captureLoop();
  }

  pause() {
    this.isPaused = true;
  }
  resume() {
    this.isPaused = false;
  }

  stop() {
    this.isRunning = false;
    listeningBadge.classList.remove('active');
    if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
  }

  async captureLoop() {
    while (this.isRunning) {
      if (this.isPaused) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      try {
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : 'audio/mp4';

        const mediaRecorder = new MediaRecorder(this.stream, {
          mimeType: mimeType || undefined,
        });
        const chunks = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.start();
        await new Promise((r) => setTimeout(r, 30000));

        const blob = await new Promise((resolve) => {
          mediaRecorder.onstop = () =>
            resolve(new Blob(chunks, { type: mimeType }));
          mediaRecorder.stop();
        });

        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');
        const resp = await fetch('/api/whisper', {
          method: 'POST',
          body: formData,
        });
        const data = await resp.json();

        if (data.text && data.text.trim().length > 10) {
          await fetch('/api/memories/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: `[${new Date().toLocaleTimeString()}] ${data.text}`,
              type: 'shortterm',
              metadata: { source: 'live-transcription' },
            }),
          });
        }
      } catch (err) {
        console.error('Live transcription error:', err);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }
}

// Auto-start live transcription
window.liveTranscriber = new LiveTranscriber();
window.liveTranscriber.start().catch((err) => {
  console.log('Live transcription not available:', err.message);
});
