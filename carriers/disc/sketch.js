📄 sketch.js
let startButton;
let osc;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background('#ecefe9');
  textAlign(CENTER, CENTER);
  textSize(24);
  text('Tap the button to start sound', width / 2, height / 2 - 60);

  // Create the button in p5
  startButton = createButton('🔊 Tap to Start');
  startButton.style('font-size', '2rem');
  startButton.style('padding', '1em 2em');
  startButton.style('border', 'none');
  startButton.style('background', '#dcd9cf');
  startButton.style('border-radius', '12px');
  startButton.center();
  startButton.mousePressed(startAudio);
}

function startAudio() {
  // Resume p5’s audio context (required on mobile)
  userStartAudio().then(() => {
    console.log('Audio context started.');

    // Create and play a 1-second sine tone
    osc = new p5.Oscillator('sine');
    osc.freq(440);
    osc.amp(0.2);
    osc.start();
    setTimeout(() => {
      osc.stop();
    }, 1000);

    startButton.remove(); // remove button after start
    background('#cde0b8');
    text('✅ You should hear a tone!', width / 2, height / 2);
  });
}
