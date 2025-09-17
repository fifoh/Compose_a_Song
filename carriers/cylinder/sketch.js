p5.disableFriendlyErrors = true;
let debounceTimer;
let debounceTimerArray;
let loadedInstrumentSetBuffers = {};

let helpButton;
let helpDiv;

let lastFrameTime = 0;
let animationFrameId = null;

let lastState = '';

let buttonSize = 20;
let ellipseButtons = [];
let ellipseColors = [
  [108,142,93], // dark green 
  [173, 200, 159], // light Green
  [159, 129, 177], // purple now
];

let individualInstrumentArray = new Array(37).fill(1);

let touchThreshold = 30; // was 30
let startX, startY;
let cylinderYCoordinates;
let clearButton;
let canvasTopBoundary = 70;

let presetButton;
let showingPreset = false;
const presetSong = [
  [7, 18], [4, 21] , [7, 22], [4, 25], [7,26], [4, 27], [7,28], [9,29], [11,30],
  [10,2], [8,5], [10,6], [8,9], [10,10], [8,11], [6,12], [8,13], [4,14]
];

// start index for playback array
let angleX = 0;
let angleY = 0;
let angleZ = 0;
let cylinderCoordinates = [];
let colors = [];
let notes = [];

let isDragging = false;
let rotationalValue = 0;
let addButton;
let removeButton;
let note_duration = 200;

let totalHorizontalPoints = 32;
let totalVerticalPoints = 12;
let totalDuration = note_duration * totalHorizontalPoints;

let instrumentButtons = [];
let instruments = [
  { name: "Comb", icon: "images/comb_icon.jpg", whiteIcon: "images/comb_icon_white.jpg" },
  { name: "Piano", icon: "images/piano_icon.jpg", whiteIcon: "images/piano_icon_white.jpg" },
  { name: "Bells", icon: "images/bells_icon.jpg", whiteIcon: "images/bells_icon_white.jpg" }
];
let selectedInstrument = 0; // 0 = Comb, 1 = Piano, 2 = Bells

// audio
let audioBuffers = [];
let timeouts = [];
let isPlaying = false;
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let bufferLoader;
let startTime;
let playButton;
let durationSlider;
let timeoutIds = [];
let radius;
let cylinderHeight;

let rightGrotesk;
let discLink;
let cylinderLink;
let bookLink;
let rollLink;

function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = [];
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function (url, index) {
  let request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";
  let loader = this;
  request.onload = function () {
    loader.context.decodeAudioData(
      request.response,
      function (buffer) {
        if (!buffer) {
          console.error("Error decoding file data: " + url);
          return;
        }
        loader.bufferList[index] = buffer;
        if (++loader.loadCount == loader.urlList.length) {
          loader.onload(loader.bufferList);
        }
      },
      function (error) {
        console.error("decodeAudioData error for " + url, error);
      }
    );
  };
  request.onerror = function () {
    console.error("BufferLoader: XHR error for " + url);
  };
  request.send();
};

BufferLoader.prototype.load = function () {
  for (let i = 0; i < this.urlList.length; ++i) {
    this.loadBuffer(this.urlList[i], i);
  }
};

// Line colours
let defaultLineColor = [0, 0, 0, 40];
let activeLineColor = ['#ECEFE9'];
let lineColors = Array(totalVerticalPoints).fill(defaultLineColor);
let lineSpacing = 37;

function preload() {
  rightGrotesk = loadFont('fonts/RightGrotesk-Medium.otf');			
  myFont = loadFont('assets/Arial.ttf');
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  loadAudioSet(individualInstrumentArray);
  audioContext.suspend().then(() => {
    console.log('AudioContext state in preload:', audioContext.state);
  });  
}

function loadAudioSet(individualInstrumentArray) {
  let filePathsToLoad = [];
  let bufferIndicesToLoad = [];
  for (let i = 0; i < 37; i++) {
    let setNumber = individualInstrumentArray[i];
    let instrumentSet = "";
    if (setNumber === 1) {
      instrumentSet = "comb";
    } else if (setNumber === 2) {
      instrumentSet = "piano";
    } else if (setNumber === 3) {
      instrumentSet = "bells";
    } else {
      console.error(`Invalid set number ${setNumber} at index ${i}`);
      return;
    }
    let filePath = `${instrumentSet}/${i}.mp3`;
    filePathsToLoad.push(filePath);
    bufferIndicesToLoad.push(i);
  }
  if (filePathsToLoad.length > 0) {
    bufferLoader = new BufferLoader(
      audioContext,
      filePathsToLoad,
      (newBufferList) => finishedLoading(newBufferList, bufferIndicesToLoad)
    );
    bufferLoader.load();
  } else {
    finishedLoading([], []);
  }
}

function finishedLoading(newBufferList, bufferIndicesToLoad) {
  for (let i = 0; i < newBufferList.length; i++) {
    let bufferIndex = bufferIndicesToLoad[i];
    audioBuffers[bufferIndex] = newBufferList[i];

    let setNumber = individualInstrumentArray[bufferIndex];
    let instrumentSet = "";
    if (setNumber === 1) {
      instrumentSet = "comb";
    } else if (setNumber === 2) {
      instrumentSet = "piano";
    } else if (setNumber === 3) {
      instrumentSet = "bells";
    }
    let filePath = `${instrumentSet}/${bufferIndex}.mp3`;
    loadedInstrumentSetBuffers[filePath] = newBufferList[i];
  }
  if (newBufferList.length > 0) {
    let filePathsLoaded = newBufferList.map((buffer, index) => {
      let bufferIndex = bufferIndicesToLoad[index];
      let setNumber = individualInstrumentArray[bufferIndex];
      let instrumentSet = "";
      if (setNumber === 1) {
        instrumentSet = "comb";
      } else if (setNumber === 2) {
        instrumentSet = "piano";
      } else if (setNumber === 3) {
        instrumentSet = "bells";
      }
      return `${instrumentSet}/${bufferIndex}.mp3`;
    });

    for (let filePath in loadedInstrumentSetBuffers) {
      if (!filePathsLoaded.includes(filePath)) {
        delete loadedInstrumentSetBuffers[filePath];
      }
    }
  }
}

let majorScale = {
  0: 0,
  1: 2,
  2: 4,
  3: 5,
  4: 7,
  5: 9,
  6: 11,
  7: 12,
  8: 14,
  9: 16,
  10: 17,
  11: 19,
  12: 21,
  13: 23,
  14: 24,
  15: 26
}

let minorScale = {
  0: 0,
  1: 2,
  2: 3,
  3: 5,
  4: 7,
  5: 8,
  6: 11,
  7: 12,
  8: 14,
  9: 15,
  10: 17,
  11: 19,
  12: 20,
  13: 23,
  14: 24,
  15: 26
}

let xoffset_cylinder = 0; // offset for center
let y_offset_cylinder = 70;

// default scale mapping
let scaleMappings = majorScale; // Default scale
let currentScaleName = "major"; // Track current scale name

function setup() {
  // Suspend the AudioContext
  audioContext.suspend().then(() => {
    console.log('AudioContext suspended in setup:', audioContext.state);
  }).catch((err) => {
    console.error('Error suspending AudioContext:', err);
  });  
  createCanvas(windowWidth, windowHeight, WEBGL);
  window.addEventListener("resize", resizeCanvasToWindow);
  frameRate(60);
  
  // Enable WebGL optimizations
  drawingContext.enable(drawingContext.DEPTH_TEST);
  drawingContext.depthFunc(drawingContext.LEQUAL);
  drawingContext.hint(drawingContext.PERSPECTIVE_CORRECTION_HINT, drawingContext.FASTEST);
  
  // === Top panel (home, name, logo, language toggle) ===
  leftPanel = createDiv();
  leftPanel.style('position', 'absolute');
  leftPanel.style('top', '0px');
  leftPanel.style('left', '0px');
  leftPanel.style('width', '100%');
  leftPanel.style('height', '70px'); // adjust height
  leftPanel.style('background-color', '#6B8D5C');
  leftPanel.style('display', 'flex');
  leftPanel.style('flex-direction', 'row'); // horizontal buttons
  leftPanel.style('align-items', 'center');
  leftPanel.style('justify-content', 'space-between');
  leftPanel.style('padding', '10px 10px');
  
  // Left side: Home + Name
  let topLeft = createDiv();
  topLeft.parent(leftPanel);
  topLeft.style('display', 'flex');
  topLeft.style('flex-direction', 'row');
  topLeft.style('align-items', 'center');
  topLeft.style('gap', '15px');

  homeLink = createImg("images/home_icon.png", "Home");
  homeLink.size(55, 55);
  homeLink.parent(topLeft);
  homeLink.style('opacity', '0.8');
  homeLink.mousePressed(() => window.location.href = "../../index_dutch.html");

  speelkloklogo = createImg("images/speelklok_logo.png", "logo");
  speelkloklogo.size(150, 65);
  speelkloklogo.parent(topLeft);
  speelkloklogo.mousePressed(() => window.location.href = "../../index_dutch.html");  

  // === Middle panel (horizontal buttons) ===
  midPanel = createDiv();
  midPanel.style('position', 'absolute');
  midPanel.style('top', leftPanel.elt.offsetHeight + 'px');
  midPanel.style('left', '0px');
  midPanel.style('width', '100%');
  midPanel.style('height', '60px'); // adjust
  midPanel.style('background-color', '#ADB99F');
  midPanel.style('display', 'flex');
  midPanel.style('flex-direction', 'row');
  midPanel.style('align-items', 'center');
  midPanel.style('justify-content', 'flex-start');
  midPanel.style('gap', '15px');
  midPanel.style('padding', '10px');

  // === Bottom panel (horizontal buttons) ===
  rightPanel = createDiv();
  rightPanel.style('position', 'absolute');
  rightPanel.style('top', leftPanel.elt.offsetHeight + midPanel.elt.offsetHeight + 'px');
  rightPanel.style('left', '0px');
  rightPanel.style('width', '100%');
  rightPanel.style('height', '70px'); // adjust
  rightPanel.style('background-color', '#775989');
  rightPanel.style('display', 'flex');
  rightPanel.style('flex-direction', 'row');
  rightPanel.style('align-items', 'center');
  rightPanel.style('justify-content', 'flex-start');
  rightPanel.style('gap', '25px');
  rightPanel.style('padding', '10px');   

  playButton = createImg("images/play_icon.jpg", "▶");
  playButton.size(55, 55);
  playButton.parent(rightPanel);
  playButton.touchStarted(togglePlayback);  

  radius = windowWidth * 0.2; // was 0.2
  cylinderHeight = windowHeight * 0.3; // was 0.4

  let sliderWrapper = select(".slider-wrapper");
  durationSlider = createSlider(200, 1000, 700); // Min 200 ms, Max 1s, Initial 800 ms
  positionDurationSlider();
  durationSlider.parent(sliderWrapper);
  durationSlider.style("width", "90px");
  durationSlider.hide()

  note_duration = durationSlider.value();
  totalDuration = note_duration * totalHorizontalPoints;

  clearButton = createImg("images/bin_icon.jpg", "✖");
  clearButton.size(60, 60);
  clearButton.parent(rightPanel);
  clearButton.touchStarted(clearNotes);

  scaleButton = createImg("images/major_icon.jpg", "Scale");
  scaleButton.size(55, 55);
  scaleButton.parent(midPanel);
  scaleButton.mousePressed(cycleScale);

  // instrument buttons
  for (let i = 0; i < instruments.length; i++) {
    let btn = createImg(instruments[i].icon, instruments[i].name);
    btn.size(75, 75);
    btn.parent(midPanel);
    btn.mousePressed(() => selectInstrument(i));
    instrumentButtons.push(btn);
  }

  // Set initial instrument selection
  selectInstrument(0);
  
  presetButton = createImg("images/presetbutton_inactive.jpg", "R");
  presetButton.size(55, 50);
  presetButton.parent(midPanel); 
  presetButton.touchStarted(togglePresetSong);     

  for (let i = 0; i < totalVerticalPoints; i++) {
    let y = map(
      i,
      0,
      totalVerticalPoints,
      cylinderHeight / 2,
      -cylinderHeight / 2
    ) + y_offset_cylinder;
    let rowCoordinates = [];
    let rowColors = [];
    let rowNotes = [];

    for (let j = 0; j < totalHorizontalPoints; j++) {
      let angle = map(j, 0, totalHorizontalPoints, 0, TWO_PI);

      let x = radius * Math.cos(angle);
      let z = radius * Math.sin(angle);

      rowCoordinates.push({ x, y, z });
      rowColors.push(color(0, 0, 0, 35)); // Initialize with light grey
      rowNotes.push(false); // Initialize as not filled
    }

    cylinderCoordinates.push(rowCoordinates);
    colors.push(rowColors);
    notes.push(rowNotes);
  }
}

function draw() {
  background('#ECEFE9');

  const now = performance.now();
  const deltaTime = now - lastFrameTime;
  lastFrameTime = now;

  if (isPlaying) {
    const rotationSpeed = TWO_PI / (totalDuration / 1000); // radians per second
    angleY += rotationSpeed * (deltaTime / 1000);
    rotationalValue = (angleY / TWO_PI) % 1;
  }

  calculateCylinderY();
  drawfixedHorizontalLines(cylinderYCoordinates);

  const scaleFactorBase = 400;
  const scaleFactorOffset = 300;

  for (let i = 0; i < cylinderCoordinates.length; i++) {
    for (let j = 0; j < cylinderCoordinates[i].length; j++) {
      let coords = cylinderCoordinates[i][j];
      let { x, y, z } = coords;
      let projection = SphericalProjection(x, y, z, angleX, angleY, angleZ);
      let scaleFactor = scaleFactorBase / (projection.z + scaleFactorOffset);
      let projectedX = projection.x * scaleFactor + xoffset_cylinder; // + the center offset for the cylinder
      let projectedY = projection.y * scaleFactor;

      let alpha = map(scaleFactor, 0.9, 2, 0, 255);
      
      // Determine if this is a preset note (light grey) or user note (black/green)
      let isPresetNote = colors[i][j].levels && 
                         colors[i][j].levels[0] === 200 && 
                         colors[i][j].levels[1] === 200 && 
                         colors[i][j].levels[2] === 200;
      let isUserNoteOnPreset = notes[i][j] && isPresetNote;
      
      if (isUserNoteOnPreset) {
        fill(0, alpha); // Black  
      } else if (notes[i][j]) {
        fill(0, alpha); // Black
      } else if (isPresetNote) {
        let originalIndex = scaleMappings[i];
        let colIndex = individualInstrumentArray[originalIndex] - 1;        
        let originalAlpha = alpha * 1.0;
        let newColor = color(ellipseColors[colIndex]);
        let r = red(newColor);
        let g = green(newColor);
        let b = blue(newColor);

        fill(r, g, b, originalAlpha);        

      } else {
        noFill();
      }

      stroke(0, alpha);
      strokeWeight(0.7);

      ellipse(projectedX, projectedY, 8, 8);
    }
  }
}

function SphericalProjection(x, y, z, angleX, angleY, angleZ) {
  // Precompute trig values once
  const cosX = Math.cos(angleX);
  const sinX = Math.sin(angleX);
  const cosY = Math.cos(angleY);
  const sinY = Math.sin(angleY);
  const cosZ = Math.cos(angleZ);
  const sinZ = Math.sin(angleZ);

  // Apply Z rotation
  let x1 = x * cosZ - y * sinZ;
  let y1 = x * sinZ + y * cosZ;
  
  // Apply Y rotation
  let x2 = x1 * cosY + z * sinY;
  let z2 = -x1 * sinY + z * cosY;
  
  // Apply X rotation
  let y3 = y1 * cosX - z2 * sinX;
  let z3 = y1 * sinX + z2 * cosX;

  return { x: x2, y: y3, z: z3 };
}

function playSound(buffer) {
  let source = audioContext.createBufferSource();
  source.buffer = buffer;
  let gainNode = audioContext.createGain();
  gainNode.gain.value = 0.25; // volume multiplier
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  source.start(0);
}

function playAllNotes() {
  if (timeoutIds.length > 0) {
    return; // Exit if the loop is already running
  }
  isPlaying = true;
  let startIndex = 18; // Playback starting index

  let loopFunction = () => {
    for (let j = 0; j < notes[0].length; j++) {
      let adjustedIndex = (j + startIndex) % notes[0].length;
      let timeoutId = setTimeout(() => {
        if (!isPlaying) {
          clearTimeouts();
          return;
        }
        for (let i = 0; i < notes.length; i++) {
          if (notes[i][adjustedIndex]) {
            let bufferIndex = scaleMappings[i];
            playSound(audioBuffers[bufferIndex]);
            changeLineColor(i);
          }
        }
      }, j * note_duration);
      timeoutIds.push(timeoutId);
    }

    if (isPlaying) {
      let timeoutId = setTimeout(loopFunction, notes[0].length * note_duration); // Loop after one iteration
      timeoutIds.push(timeoutId);
    }
  };
  loopFunction();
}

async function togglePlayback() {
  if (!isPlaying) {
    unmapped_noteDuration = durationSlider.value();
    note_duration = map(unmapped_noteDuration, 200, 1000, 600, 50);

    totalDuration = note_duration * totalHorizontalPoints;
    if (angleY != 0) {
      await smoothResetRotation();
    }

    isPlaying = true;
    startTime = millis();
    playAllNotes();
    playButton.attribute("src", "images/stop_icon.jpg");
    durationSlider.attribute("disabled", "");  
  } else {
    // Stop
    isPlaying = false;
    clearButton.attribute("src", "images/bin_icon.jpg");
    clearTimeouts();
    playButton.attribute("src", "images/play_icon.jpg");
    durationSlider.removeAttribute("disabled");
    smoothResetRotation();
  }
}

function clearTimeouts() {
  timeoutIds.forEach((timeoutId) => clearTimeout(timeoutId));
  timeoutIds = [];
}

function smoothResetRotation() {
  return new Promise((resolve) => {
    let startX = angleX;
    let startY = angleY;
    let startZ = angleZ;
    let startValue = rotationalValue;

    let startTime = millis();
    let targetY = Math.round(startY / TWO_PI) * TWO_PI;

    function animate() {
      let currentTime = millis();
      let elapsedTime = currentTime - startTime;
      let progress = elapsedTime / 500;

      if (progress < 1) {
        angleX = lerp(startX, 0, progress);
        angleY = lerp(startY, targetY, progress);
        angleZ = lerp(startZ, 0, progress);
        rotationalValue = lerp(startValue, 0, progress);
        requestAnimationFrame(animate);
      } else {
        angleX = 0;
        angleY = targetY;
        angleZ = 0;
        rotationalValue = 0;
        resolve();
      }
    }

    requestAnimationFrame(animate);
  });
}

function changeLineColor(lineIndex) {
  lineColors[lineIndex] = activeLineColor;
  setTimeout(() => {
    lineColors[lineIndex] = defaultLineColor;
  }, note_duration / 2);
}

function clearNotes() {
  if (isPlaying) return;
  
  showingPreset = false;
  presetButton.attribute("src", "images/presetbutton_inactive.jpg");
  
  // Rest of your existing clear code
  colors = [];
  notes = [];
  for (let i = 0; i < totalVerticalPoints; i++) {
    let rowColors = [];
    let rowNotes = [];
    for (let j = 0; j < totalHorizontalPoints; j++) {
      rowColors.push(color(0, 0, 0, 35));
      rowNotes.push(false);
    }
    colors.push(rowColors);
    notes.push(rowNotes);
  }
  individualInstrumentArray = new Array(37).fill(1);
  loadAudioSet(individualInstrumentArray);
}

function addNote() {
  if (totalVerticalPoints < 15) {
    totalVerticalPoints++;
    updateArraysForVerticalPoints();
  }
}

function removeNote() {
  if (totalVerticalPoints > 3) {
    totalVerticalPoints--;
    updateArraysForVerticalPoints();
  }
}

function updateArraysForVerticalPoints() {
  let newCylinderCoordinates = [];
  let newColors = [];
  let newNotes = [];
  let newLineColors = Array(totalVerticalPoints).fill(defaultLineColor);

  const radius = windowWidth * 0.2;
  const cylinderHeight = windowHeight * 0.4;
  const halfCylinderHeight = cylinderHeight / 2;
  const totalHorizontalPointsReciprocal = 1 / totalHorizontalPoints;
  const totalVerticalPointsReciprocal = 1 / totalVerticalPoints;

  for (let i = 0; i < totalVerticalPoints; i++) {
    const y =
      halfCylinderHeight - i * cylinderHeight * totalVerticalPointsReciprocal;
    let rowCoordinates = [];
    let rowColors = [];
    let rowNotes = [];

    for (let j = 0; j < totalHorizontalPoints; j++) {
      const angle = j * TWO_PI * totalHorizontalPointsReciprocal;
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);

      rowCoordinates.push({ x, y, z });

      if (i < cylinderCoordinates.length && j < cylinderCoordinates[i].length) {
        rowColors.push(colors[i][j]);
        rowNotes.push(notes[i][j]);
      } else {
        rowColors.push(color(0, 0, 0, 35));
        rowNotes.push(false);
      }
    }

    newCylinderCoordinates.push(rowCoordinates);
    newColors.push(rowColors);
    newNotes.push(rowNotes);
  }

  cylinderCoordinates = newCylinderCoordinates;
  colors = newColors;
  notes = newNotes;
  lineColors = newLineColors;
}

function cycleScale() {
  // Determine current scale
  let currentScale;
  if (scaleMappings === majorScale) currentScale = "major";
  else if (scaleMappings === minorScale) currentScale = "minor";

  // Cycle to next scale
  let nextScale;
  let displayName;
  if (currentScale === "major") {
    scaleMappings = minorScale;
    displayName = "Minor";
    nextScale = "minor";
  } 
  else if (currentScale === "minor") {
    scaleMappings = majorScale;
    displayName = "Major";
    nextScale = "major";
  }

  // Update button image
  scaleButton.elt.src = `images/${nextScale}_icon.jpg`;
}

function positionMetroIcon() {
  metroImage.position(65, 20);
}

function positionDurationSlider() {
  durationSlider.position(115, 31);
}

function calculateCylinderY() {
  // Calculate y-coordinates of cylinder rows
  cylinderYCoordinates = [];
  for (let i = 0; i < cylinderCoordinates.length; i++) {
    if (cylinderCoordinates[i].length > 0) {
      cylinderYCoordinates.push(cylinderCoordinates[i][0].y);
    }
  }
  cylinderYCoordinates.sort((a, b) => b - a);
}

function drawfixedHorizontalLines(cylinderYCoordinates) {
  for (let i = 0; i < cylinderYCoordinates.length; i++) {
    stroke(lineColors[i]);
    strokeWeight(1 * pixelDensity());
    let y = cylinderYCoordinates[i] * 1.4;
    let rectStartX = -windowWidth / 2.4 + xoffset_cylinder;
    let rectEndX = -windowWidth / 3.5 + xoffset_cylinder;
    let rectWidth = rectEndX - rectStartX;

    noStroke();
    fill(lineColors[i]);
    rect(rectStartX, y - 0.5, rectWidth, 5);

    let buttonSize = 18;
    let buttonX = -windowWidth / 2.4 + xoffset_cylinder;
    let buttonY = y+1.1;
    ellipseButtons.push({ id: i, x: buttonX, y: buttonY, size: buttonSize });
    let originalIndex = scaleMappings[i];
    let colIndex = individualInstrumentArray[originalIndex] - 1;
    fill(ellipseColors[colIndex]);
    stroke(lineColors[i]);
    strokeWeight(0);
    ellipse(buttonX, buttonY, buttonSize, buttonSize);
  }
}

function touchStarted() {
  if (audioContext.state !== 'running') {
    userStartAudio().then(() => {
      audioContext.resume().then(() => {
        console.log('AudioContext resumed on mousePressed:', audioContext.state);
      }).catch((err) => {
        console.error('Error resuming AudioContext:', err);
      });
    }).catch((err) => {
      console.error('Error starting user audio:', err);
    });
  }
  if (touches.length > 0) {
    isDragging = false; // Initially not dragging
    startX = touches[0].x;
    startY = touches[0].y;
    previousTouchX = startX;
    previousTouchY = startY;
  }
}

function touchMoved(event) {
  event.preventDefault();
  if (touches.length > 0 && touches[0].y > canvasTopBoundary) {
    isDragging = true;
    let currentTouchX = touches[0].x;
    let currentTouchY = touches[0].y;
    let deltaX = currentTouchX - previousTouchX;
    let deltaY = currentTouchY - previousTouchY;
    angleY -= deltaX * 0.003;
    rotationalValue = (angleY / TWO_PI) % 1;
    previousTouchX = currentTouchX;
    previousTouchY = currentTouchY;
  }
}

function touchEnded() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (typeof startX !== "undefined" && typeof startY !== "undefined") {
      // Calculate distance moved during touch
      let dx = previousTouchX - startX;
      let dy = previousTouchY - startY;
      let touchMovedDistance = Math.sqrt(dx * dx + dy * dy);

      if (!isDragging && touchMovedDistance < touchThreshold) {
        let transformedTouchX = startX - width / 2;
        let transformedTouchY = startY - height / 2;
        let buttonClicked = false;

        if (!buttonClicked) {
          handleNoteClick();
        }
      }
      startX = undefined;
      startY = undefined;
    }
  }, 100); // debounce
}

function handleNoteClick() {
  translate(width / 2, height / 2);
  let nearestPoint = null;
  let nearestDistance = Infinity;

  for (let i = 0; i < cylinderCoordinates.length; i++) {
    for (let j = 0; j < cylinderCoordinates[i].length; j++) {
      let coords = cylinderCoordinates[i][j];
      let { x, y, z } = coords;
      let projectionMath = SphericalProjection(x, y, z, angleX, angleY, angleZ);
      let scaleFactor = 400 / (projectionMath.z + 300);
      let projectedX = projectionMath.x * scaleFactor;
      let projectedY = projectionMath.y * scaleFactor;

	let d = dist(
	  mouseX - width / 2 - xoffset_cylinder,
	  mouseY - height / 2,
	  projectedX,
	  projectedY
	);

      if (d < nearestDistance && d < 20) {
        let alphaThreshold = 100;
        let alphaValue = map(scaleFactor, 0.9, 2, 0, 255);
        if (alphaValue >= alphaThreshold) {
          nearestPoint = { x: projectedX, y: projectedY, i, j };
          nearestDistance = d;
        }
      }
    }
  }
  if (nearestPoint !== null) {
    let { i, j } = nearestPoint;
    let isPresetNote = colors[i][j].levels && 
                      colors[i][j].levels[0] === 200 && 
                      colors[i][j].levels[1] === 200 && 
                      colors[i][j].levels[2] === 200;
    
    if (notes[i][j]) {
      // When removing a note, restore the original color (preset or default)
      if (isPresetNote) {
        colors[i][j] = color(200, 200, 200, 50);
      } else {
        colors[i][j] = color(0, 0, 0, 35);
      }
      notes[i][j] = false;
    } else {
      // When adding a note, keep the preset color in the background
      notes[i][j] = true;
      // Don't change the color here - let the draw() function handle the coloring
    }
  }
}

function resizeCanvasToWindow() {
  resizeCanvas(windowWidth, windowHeight);
}

function updateIndividualInstrumentArray(indexToUpdate) {
  clearTimeout(debounceTimerArray);
  debounceTimerArray = setTimeout(() => {
    if (
      indexToUpdate >= 0 &&
      indexToUpdate < individualInstrumentArray.length
    ) {
      indexToUpdate = scaleMappings[indexToUpdate];
      individualInstrumentArray[indexToUpdate] =
        (individualInstrumentArray[indexToUpdate] % 3) + 1;
      loadAudioSet(individualInstrumentArray);
    }
  }, 50); // debounce
}

function selectInstrument(index) {
  selectedInstrument = index;

  // Update button icons
  for (let i = 0; i < instrumentButtons.length; i++) {
    if (i === index) {
      instrumentButtons[i].elt.src = instruments[i].whiteIcon;
    } else {
      instrumentButtons[i].elt.src = instruments[i].icon;
    }
  }

  // Update instrument array
  individualInstrumentArray = new Array(37).fill(index + 1);

  console.log("Selected instrument:", instruments[index].name);

  loadAudioSet(individualInstrumentArray);
}

function togglePresetSong() {
  
  // First clear all notes and reset colors
  for (let i = 0; i < totalVerticalPoints; i++) {
    for (let j = 0; j < totalHorizontalPoints; j++) {
      notes[i][j] = false;
      colors[i][j] = color(0, 0, 0, 35); // Reset to default empty color
    }
  }

  showingPreset = !showingPreset;
  
  if (showingPreset) {
    // Set to 12 rows (good for the preset)
    if (totalVerticalPoints < 12) {
      totalVerticalPoints = 12;
      updateArraysForVerticalPoints();
    }
    
    // Apply the preset notes (now using alpha in the color)
    for (let note of presetSong) {
      let [i, j] = note;
      if (i < totalVerticalPoints && j < totalHorizontalPoints) {
        colors[i][j] = color(200, 200, 200, 50); // Light grey with initial alpha
      }
    }
    presetButton.attribute("src", "images/presetbutton_active.jpg");
    scaleMappings = majorScale; // Default scale
    currentScale = "major"; // Track current scale name    
    scaleButton.elt.src = `images/${currentScale}_icon.jpg`;
    
  } else {
    presetButton.attribute("src", "images/presetbutton_inactive.jpg");
  }
}
