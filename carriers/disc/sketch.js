let audioContext;
let startButton;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background('#ecefe9');

  // Create the AudioContext (won’t start until user gesture)
  audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // Create a p5 button to start audio
  startButton = createButton('🔊 Tap to Start');
  startButton.style('font-size', '2rem');
  startButton.style('padding', '1em 2em');
  startButton.style('border', 'none');
  startButton.style('background', '#dcd9cf');
  startButton.style('border-radius', '12px');
  startButton.position(windowWidth / 2 - 120, windowHeight / 2 - 40);
  startButton.mousePressed(startAudio);
}

async function startAudio() {
  // Resume the AudioContext on user gesture
  if (audioContext.state !== 'running') {
    await audioContext.resume();
  }

  // Play a short tone
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  gain.gain.value = 0.2;
  osc.connect(gain).connect(audioContext.destination);
  osc.type = 'sine';
  osc.frequency.value = 440; // A4
  osc.start();
  osc.stop(audioContext.currentTime + 1); // 1 second tone

  console.log('✅ Audio played!');
  startButton.remove(); // Remove the button after activation
}

function draw() {
  // optional: add visuals if you want
}
