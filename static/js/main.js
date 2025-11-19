// Face + Text + Animated Avatar + Theme
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const loader = document.getElementById('loader');
const resultBox = document.getElementById('resultBox');
const resultTitle = document.getElementById('resultTitle');
const suggestionsList = document.getElementById('suggestionsList');
const resultTags = document.getElementById('resultTags');
const userText = document.getElementById('userText');
const downloadBtn = document.getElementById('downloadReport');

const videoEl = document.getElementById('videoEl');
const startCamBtn = document.getElementById('startCamBtn');
const stopCamBtn = document.getElementById('stopCamBtn');
const scanEmoji = document.getElementById('scanEmoji');
const avatarSVG = document.getElementById('avatarSVG');
const mouthPath = document.getElementById('mouthPath');
const eyeLeft = document.getElementById('eyeLeft');
const eyeRight = document.getElementById('eyeRight');
const appContainer = document.getElementById('appContainer');
let stream = null;
let modelsLoaded = false;
let faceScanInterval = null;

// text analyzer
function analyzeTextClient(text) {
  const t = text.toLowerCase();
  const tags = [];
  const suggestions = [];
  if (t.includes('burnout') || t.includes('overwhelmed') || t.includes('tired') || t.includes('exhausted') || t.includes('frustrat')) {
    tags.push('Burnout');
    suggestions.push('Take a 5-minute deep breathing break.');
    suggestions.push('Try the 4-7-8 breathing technique.');
    suggestions.push('Schedule a 30-minute rest after current task.');
  }
  if (t.includes('stress') || t.includes('anx') || t.includes('panic')) {
    if (!tags.includes('Stress')) tags.push('Stress');
    suggestions.push('Do a short grounding exercise (5 mins).');
  }
  if (t.includes('sad') || t.includes('down') || t.includes('hopeless') || t.includes('depress')) {
    if (!tags.includes('Low Mood')) tags.push('Low Mood');
    suggestions.push('Listen to calming music for 10 minutes.');
    suggestions.push('Reach out to a friend or write a short journal.');
  }
  if (tags.length === 0) {
    tags.push('Positive / Neutral');
    suggestions.push('Maintain your routine and take regular breaks.');
  }
  return { tags, suggestions };
}

// populate UI
function populateResult(data) {
  const emojiDisplay = document.getElementById('emojiDisplay');
  if (data.tags.includes('Burnout')) emojiDisplay.innerText = '🥵';
  else if (data.tags.includes('Stress')) emojiDisplay.innerText = '😣';
  else if (data.tags.includes('Low Mood')) emojiDisplay.innerText = '😞';
  else emojiDisplay.innerText = '😊';
  resultTitle.innerText = data.tags.join(' • ');
  resultTags.innerHTML = '';
  data.tags.forEach(tag => {
    const el = document.createElement('span');
    el.className = 'tag';
    el.innerText = tag;
    resultTags.appendChild(el);
  });
  suggestionsList.innerHTML = '';
  data.suggestions.forEach(s => {
    const li = document.createElement('li');
    li.innerText = s;
    suggestionsList.appendChild(li);
  });
  // animate avatar based on top tag
  animateAvatar(data.tags[0] || 'Positive / Neutral');
}

// analyze call
async function showResult() {
  const text = userText.value.trim();
  if (!text) {
    alert('Please enter how you feel before analyzing.');
    return;
  }
  loader.style.display = 'block';
  resultBox.style.display = 'none';
  try {
    const resp = await fetch('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!resp.ok) throw new Error('Server error');
    const data = await resp.json();
    populateResult(data);
  } catch (err) {
    const data = analyzeTextClient(text);
    populateResult(data);
  } finally {
    loader.style.display = 'none';
    resultBox.style.display = 'block';
  }
}

function clearAll() {
  userText.value = '';
  resultBox.style.display = 'none';
  resultTags.innerHTML = '';
  suggestionsList.innerHTML = '';
}

// avatar animations
function animateAvatar(tag) {
  // reset
  scanEmoji.innerText = '🙂';
  document.documentElement.classList.remove('themeHappy','themeSad','themeStress');
  if (tag === 'Burnout') {
    scanEmoji.innerText = '🥵';
    // mouth flat small
    mouthPath.setAttribute('d','M84 122 Q100 118 116 122');
    document.documentElement.classList.add('themeStress');
    appContainer.style.transition = 'background 0.6s';
    appContainer.style.background = 'linear-gradient(135deg,#3b194b,#3a1f2f)';
  } else if (tag === 'Stress') {
    scanEmoji.innerText = '😣';
    mouthPath.setAttribute('d','M84 126 Q100 118 116 126');
    document.documentElement.classList.add('themeStress');
    appContainer.style.background = 'linear-gradient(135deg,#2b1b1f,#2a2b2f)';
  } else if (tag === 'Low Mood') {
    scanEmoji.innerText = '😞';
    mouthPath.setAttribute('d','M84 132 Q100 140 116 132');
    document.documentElement.classList.add('themeSad');
    appContainer.style.background = 'linear-gradient(135deg,#0b2b4b,#08122a)';
  } else {
    scanEmoji.innerText = '😊';
    mouthPath.setAttribute('d','M80 118 Q100 135 120 118');
    document.documentElement.classList.add('themeHappy');
    appContainer.style.background = '';
  }
}

// face-api load
async function loadModels() {
  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri('/static/models');
    await faceapi.nets.faceExpressionNet.loadFromUri('/static/models');
    modelsLoaded = true;
    console.log('Models loaded');
  } catch (e) {
    console.warn('Model load failed', e);
    modelsLoaded = false;
  }
}

// start camera
async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Camera not supported');
    return;
  }
  await loadModels();
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    videoEl.srcObject = stream;
    startCamBtn.style.display = 'none';
    stopCamBtn.style.display = 'inline-block';
    faceScanInterval = setInterval(scanFaceAndSuggest, 900);
  } catch (e) {
    alert('Camera access denied or error: ' + e.message);
  }
}

// stop camera
function stopCamera() {
  if (stream) stream.getTracks().forEach(t => t.stop());
  videoEl.srcObject = null;
  startCamBtn.style.display = 'inline-block';
  stopCamBtn.style.display = 'none';
  clearInterval(faceScanInterval);
  scanEmoji.innerText = '🙂';
}

// scan face
async function scanFaceAndSuggest() {
  if (!modelsLoaded) {
    scanEmoji.innerText = '⚠️';
    loadModels();
    return;
  }
  if (!videoEl || videoEl.readyState < 2) return;
  try {
    const detection = await faceapi.detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
    if (!detection || !detection.expressions) {
      scanEmoji.innerText = '😐';
      return;
    }
    const ex = detection.expressions;
    let top = {expr:null,score:0};
    for (const k in ex) {
      if (ex[k] > top.score) top = {expr:k,score:ex[k]};
    }
    const mapping = {
      happy: {emoji:'😊', tag:'Positive / Neutral', suggestions:['Keep your good routine!']},
      neutral: {emoji:'😐', tag:'Positive / Neutral', suggestions:['You seem neutral — take short breaks.']},
      sad: {emoji:'😞', tag:'Low Mood', suggestions:['Listen to calming music for 10 minutes.','Reach out to a friend.']},
      angry: {emoji:'😡', tag:'Stress', suggestions:['Step away for 5 minutes.','Take deep breaths.']},
      fearful: {emoji:'😨', tag:'Stress', suggestions:['Grounding exercise (5 mins).']},
      disgusted: {emoji:'🤢', tag:'Stress', suggestions:['Take water and breathe.']},
      surprised: {emoji:'😲', tag:'Neutral', suggestions:['Breathe. Notice surroundings.']}
    };
    const info = mapping[top.expr] || {emoji:'🙂', tag:'Positive / Neutral', suggestions:['Maintain routine.']};
    scanEmoji.innerText = info.emoji;
    // combine with text
    let combined = { tags: [info.tag], suggestions: info.suggestions.slice() };
    const text = userText.value.trim();
    if (text) {
      const tA = analyzeTextClient(text);
      tA.tags.forEach(t=>{ if (!combined.tags.includes(t)) combined.tags.push(t); });
      tA.suggestions.forEach(s=>{ if (!combined.suggestions.includes(s)) combined.suggestions.push(s); });
    }
    populateResult(combined);
    resultBox.style.display = 'block';
  } catch (e) {
    console.warn('Face scan error', e);
  }
}

// download
downloadBtn.onclick = ()=> {
  const data = {
    input: userText.value,
    seenEmoji: scanEmoji ? scanEmoji.innerText : '',
    result: resultTags.innerText,
    suggestions: Array.from(suggestionsList.querySelectorAll('li')).map(li=>li.innerText)
  };
  const report = `NeuraCare Mood Report\n\nInput:\n${data.input}\n\nFace Emoji: ${data.seenEmoji}\n\nResult: ${data.result}\n\nSuggestions:\n- ${data.suggestions.join('\n- ')}\n\nGenerated: ${new Date().toLocaleString()}`;
  const blob = new Blob([report], {type:'text/plain'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download='neuracare_report.txt'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
};

// events
analyzeBtn.addEventListener('click', showResult);
clearBtn.addEventListener('click', clearAll);
startCamBtn.addEventListener('click', startCamera);
stopCamBtn.addEventListener('click', ()=>{ stopCamera(); resultBox.style.display='none'; });
userText.addEventListener('keydown',(e)=>{ if (e.key==='Enter' && (e.ctrlKey||e.metaKey)){ e.preventDefault(); showResult();
} });
  // your all existing code here...
// events...

// === THEME TOGGLER STARTS HERE ===
const toggleBtn = document.getElementById("toggleTheme");
toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
});

 

