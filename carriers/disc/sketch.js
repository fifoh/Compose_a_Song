let osc;
let started = false;

function setup() {
  createCanvas(400, 400);
  
  // Create oscillator but don't start yet
  osc = new p5.Oscillator('sine');
  osc.amp(0); // Start with volume at 0
  
  textAlign(CENTER, CENTER);
  textSize(20);
}

function draw() {
  background(220);
  
  if (!started) {
    fill(0);
    text('Tap anywhere to start sound', width/2, height/2);
  } else {
    fill(255, 0, 0);
    text('Sound is playing!', width/2, height/2);
    
    // Visual feedback - circle pulses with sound
    let pulse = sin(frameCount * 0.1) * 50 + 100;
    fill(255, 100, 100);
    ellipse(width/2, height/3, pulse, pulse);
  }
}

function mousePressed() {
  if (!started) {
    // First user interaction - start audio
    userStartAudio().then(() => {
      osc.start();
      osc.amp(0.3, 0.1); // Fade in volume
      started = true;
    });
  } else {
    // Change frequency when clicked/tapped
    osc.freq(random(200, 800));
  }
}

function touchStarted() {
  // Handle mobile touch
  mousePressed();
  return false; // Prevent default behavior
}
