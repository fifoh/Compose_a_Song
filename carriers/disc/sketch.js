let osc;
let started = false;
let button;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background('#ecefe9');
  textAlign(CENTER, CENTER);
  textSize(22);
  text('Tap the button to start sound', width / 2, height / 2 - 40);

  button = createButton('Tap to Start');
  button.position(width / 2 - 80, height / 2);
  button.style('font-size', '20px');
  button.mousePressed(startSound);   // <--- direct sync call, no async/await
}

function startSound() {
  if (!started) {
    // resume the AudioContext *synchronously* inside the gesture
    getAudioContext().resume();

    // create and play the oscillator
    osc = new p5.Oscillator('sine');
    osc.freq(440);
    osc.amp(0.2);
    osc.start();
    setTimeout(() => osc.stop(), 1000);

    background('#cde0b8');
    text('✅ Sound played', width / 2, height / 2);
    button.remove();
    started = true;
    console.log('AudioContext state:', getAudioContext().state);
  }
}

function draw() {}
