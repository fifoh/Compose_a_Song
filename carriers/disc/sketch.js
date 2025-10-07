// paste this into sketch.js (save file as UTF-8 WITHOUT BOM)
let osc;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background('#ecefe9');
  textAlign(CENTER, CENTER);
  textSize(20);
  text('Tap the button to play sound', width / 2, height / 2 - 40);

  const btn = createButton('Tap to Start');
  btn.style('font-size', '20px');
  // center roughly
  btn.position((windowWidth - 140) / 2, height / 2);
  btn.mousePressed(async () => {
    // ensure p5.sound is activated on mobile
    await userStartAudio();

    osc = new p5.Oscillator('sine');
    osc.freq(440);
    osc.amp(0.2);
    osc.start();
    setTimeout(() => osc.stop(), 1000);

    btn.remove();
    background('#cde0b8');
    text('Played a tone', width / 2, height / 2);
  });
}

function draw() {
  // no-op
}
