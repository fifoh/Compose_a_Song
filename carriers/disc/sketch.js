let audioContext;
let oscillator;
let isPlaying = false;

function setup() {
  createCanvas(400, 400);
  textAlign(CENTER, CENTER);
  textSize(16);
  
  // Create AudioContext but don't start yet
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // Create a silent buffer to "warm up" the audio system
  let buffer = audioContext.createBuffer(1, 1, 22050);
  let source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start(0);
  
  // Immediately suspend it
  audioContext.suspend();
}

function draw() {
  background(220);
  
  if (!isPlaying) {
    fill(0);
    text('TAP HERE TO START AUDIO\n(AudioContext state: ' + audioContext.state + ')', width/2, height/2);
  } else {
    fill(0, 150, 0);
    text('AUDIO PLAYING!\nState: ' + audioContext.state, width/2, height/2);
    
    // Visual feedback
    let size = 100 + sin(frameCount * 0.2) * 30;
    fill(255, 0, 0, 100);
    ellipse(width/2, height/3, size, size);
  }
}

function touchStarted() {
  // The nuclear option for mobile audio
  if (audioContext.state === 'suspended') {
    audioContext.resume().then(() => {
      console.log('AudioContext resumed:', audioContext.state);
      startSound();
    }).catch(err => {
      console.error('Failed to resume:', err);
    });
  } else {
    startSound();
  }
  
  // Prevent default to avoid browser issues
  return false;
}

function mousePressed() {
  touchStarted();
}

function startSound() {
  if (!isPlaying) {
    // Create oscillator
    oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    
    // Create gain node for volume control
    let gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    
    // Connect and start
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    
    isPlaying = true;
    
    console.log('Sound started, AudioContext state:', audioContext.state);
  } else {
    // Change frequency if already playing
    oscillator.frequency.setValueAtTime(random(300, 800), audioContext.currentTime);
  }
}
