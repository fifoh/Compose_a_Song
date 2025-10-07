let started = false;
let button;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background('#ecefe9');
  textAlign(CENTER, CENTER);
  textSize(20);
  text('Tap the button to hear a tone', width / 2, height / 2 - 40);

  button = createButton('Tap to Start');
  button.position(width / 2 - 80, height / 2);
  button.mousePressed(startAudio);
}

function startAudio() {
  if (started) return;
  started = true;

  const ctx = getAudioContext();
  ctx.resume();       // must be synchronous with the gesture
  masterVolume(1.0);  // open p5.sound’s master gain

  // --- Create oscillator and ramp gain manually ---
  const osc = new p5.Oscillator('sine');
  const gain = osc.output.gain;           // native GainNode inside p5.Oscillator
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.05);

  osc.freq(440);
  osc.start(now + 0.05);                  // schedule slightly ahead
  osc.stop(now + 1.05);

  background('#cde0b8');
  text('✅ You should hear a 1-second beep', width / 2, height / 2);
  button.remove();

  console.log('AudioContext state:', ctx.state);
}

function draw() {}
