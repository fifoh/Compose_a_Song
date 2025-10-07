let audioContext;

document.getElementById('startButton').addEventListener('click', async () => {
  // Create or resume AudioContext inside the user gesture
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state !== 'running') {
    await audioContext.resume();
  }

  // Create a simple oscillator
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  gain.gain.value = 0.2;  // volume
  osc.connect(gain).connect(audioContext.destination);

  osc.type = 'sine';
  osc.frequency.value = 440; // A4
  osc.start();
  osc.stop(audioContext.currentTime + 1); // 1 second tone

  console.log('✅ Audio played!');
});
