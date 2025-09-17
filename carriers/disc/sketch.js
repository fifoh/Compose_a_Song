p5.disableFriendlyErrors = true;
let isPlaying = false;
let currentAngle = 0;
let targetAngle = 0;
let easingFactor = 0.05;
let isEasing = false;
let debounceTimer;
let debounceTimerArray;
let loadedInstrumentSetBuffers = {};
let buttonSize = 20;
let ellipseButtons = [];
let ellipseColors = [
  [108,142,93], // dark green 
  [173, 200, 159], // light Green
  [159, 129, 177], // purple now
];

let lastState = '';

let rightGrotesk;
let discLink;
let cylinderLink;
let bookLink;
let rollLink;

let presetButton;
let showPresetPoints = false;
let visualPoints = [];

let buttonGraphics;
let gapIndex = 9;
let individualInstrumentArray = new Array(37).fill(1);
let startX, startY;
let circleCenterX, circleCenterY, circleRadius;
let points;
let numRings = 15;
let numSegments = 16;
let duration = 550;

let instrumentButtons = [];
let instruments = [
  { name: "Comb", icon: "images/comb_icon.jpg", whiteIcon: "images/comb_icon_white.jpg" },
  { name: "Piano", icon: "images/piano_icon.jpg", whiteIcon: "images/piano_icon_white.jpg" },
  { name: "Bells", icon: "images/bells_icon.jpg", whiteIcon: "images/bells_icon_white.jpg" }
];
let selectedInstrument = 0; // 0 = Comb, 1 = Piano, 2 = Bells

let audioBuffers = [];
let timeouts = [];
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let bufferLoader;
let startTime;
let playButton;
let clearButton;
let durationSlider;
let timeoutIds = [];
let graphics;

// Loading audio
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

function preload() {
  rightGrotesk = loadFont('fonts/RightGrotesk-Medium.otf');	
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  loadAudioSet(individualInstrumentArray);
  audioContext.suspend().then(() => {
    console.log('AudioContext state in preload:', audioContext.state);
  });  
} 

// Load audio set
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

// define scales
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
};

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
};
// default scale mapping
let scaleMappings = majorScale; // Default scale
let currentScaleName = "major"; // Track current scale name

let leftPanel, midPanel, rightPanel;

function setup() {
  audioContext.suspend().then(() => {
    console.log('AudioContext suspended in setup:', audioContext.state);
  }).catch((err) => {
    console.error('Error suspending AudioContext:', err);
  });  
  
  createCanvas(windowWidth, windowHeight);
  window.addEventListener("resize", resizeCanvasToWindow);
  frameRate(60);
  
  // === Create left panel ===
  leftPanel = createDiv();
  leftPanel.style('position', 'absolute');
  leftPanel.style('top', '0px');
  leftPanel.style('left', '0px');
  leftPanel.style('width', '200px');
  leftPanel.style('height', windowHeight + 'px');
  leftPanel.style('background-color', '#6B8D5C');
  leftPanel.style('display', 'flex');
  leftPanel.style('flex-direction', 'column');
  leftPanel.style('padding', '0px');
  leftPanel.style('gap', '0px');

  // === Create mid panel ===
  midPanel = createDiv();
  midPanel.style('position', 'absolute');
  midPanel.style('top', '0px');
  midPanel.style('left', '200px');
  midPanel.style('width', '100px');
  midPanel.style('height', windowHeight + 'px');
  midPanel.style('background-color', '#ADB99F');
  midPanel.style('display', 'flex');
  midPanel.style('flex-direction', 'column');
  midPanel.style('padding', '0px');
  midPanel.style('gap', '0px');  

  // === Create right panel ===
  rightPanel = createDiv();
  rightPanel.style('position', 'absolute');
  rightPanel.style('top', '0px');
  rightPanel.style('left', '300px');
  rightPanel.style('width', '100px');
  rightPanel.style('height', windowHeight + 'px');
  rightPanel.style('background-color', '#775989');
  rightPanel.style('display', 'flex');
  rightPanel.style('flex-direction', 'column');
  rightPanel.style('padding', '0px');
  rightPanel.style('gap', '0px');  
  
  buttonGraphics = createGraphics(windowWidth, windowHeight);
  circleCenterX = windowWidth / 1.5; // offset for interface
  circleCenterY = windowHeight / 2;
  let baseRadius = Math.min(windowWidth, windowHeight) * 0.45;
  circleRadius = baseRadius;
  initializePointsArray();
  createPlayButton();
  createClearButton();
  
  // HOME BUTTON
  homeLink = createImg("images/home_icon.png", "Home");
  homeLink.size(55, 55);
  homeLink.position(32, 145);
  homeLink.style('opacity', '0.8');
  homeLink.mousePressed(() => {
    window.location.href = "../../index_dutch.html";
  });   
  
  // "Name game" heading
  let nameGame = createP("Componeer<br>een lied");
  nameGame.style('font-family', 'RightGrotesk');
  nameGame.style('color', 'white');
  nameGame.style('font-size', '32px');
  nameGame.style('line-height', '1.1');
  nameGame.style('margin', '0');
  nameGame.position(30, 40); // Adjust as needed

  // Underscore line below the heading
  let underscore = createDiv();
  underscore.style('width', '95px');         
  underscore.style('height', '1px');
  underscore.style('background-color', 'white');
  underscore.position(30, 125);              
  
  // link buttons to carriers
  discLink = createP("Metalen plaat");
  discLink.style('font-family', 'RightGrotesk');
  discLink.style('color', 'white');
  discLink.style('text-decoration', 'underline');   
  discLink.style('font-size', '26px'); // Adjust as needed
  discLink.position(30, 230);
  discLink.style('cursor', 'pointer');
  discLink.mousePressed(() => {
    window.location.href = "../disc/index.html";
  });
  
  cylinderLink = createP("Cilinder");
  cylinderLink.style('font-family', 'RightGrotesk');
  cylinderLink.style('color', '#A8B69A');
  cylinderLink.style('font-size', '26px'); // Adjust as needed
  cylinderLink.position(30, 285);
  cylinderLink.style('cursor', 'pointer');
  cylinderLink.mousePressed(() => {
    window.location.href = "../cylinder/index.html";
  });  
  
  bookLink = createP("Orgelboek");
  bookLink.style('font-family', 'RightGrotesk');
  bookLink.style('color', '#A8B69A');
  bookLink.style('font-size', '26px'); // Adjust as needed
  bookLink.position(30, 340);
  bookLink.style('cursor', 'pointer');
  bookLink.mousePressed(() => {
    window.location.href = "../book/index.html";
  });  

  rollLink = createP("Papieren rol");
  rollLink.style('font-family', 'RightGrotesk');
  rollLink.style('color', '#A8B69A');
  rollLink.style('font-size', '26px'); // Adjust as needed
  rollLink.position(30, 395);
  rollLink.style('cursor', 'pointer');
  rollLink.mousePressed(() => {
    window.location.href = "../roll/index.html";
  });     
  
  speelkloklogo = createImg("images/speelklok_logo.png", "logo");
  speelkloklogo.size(150, 65);
  speelkloklogo.position(17, windowHeight-87);
  speelkloklogo.mousePressed(() => {
    window.location.href = "../../index_dutch.html";
  });     
  
  // Language toggle
  let isEnglish = false;
  let languagetoggle = createP('<span style="color:white">NL</span><span style="color:#A8B69A"> / ENG</span>');
  languagetoggle.style('font-family', 'RightGrotesk');
  languagetoggle.style('font-size', '20px');
  languagetoggle.style('line-height', '1.1');
  languagetoggle.style('margin', '0');
  languagetoggle.style('position', 'absolute');
  languagetoggle.style('left', '30px');
  languagetoggle.style('bottom', '130px');   
  languagetoggle.style('cursor', 'pointer');
  languagetoggle.mousePressed(() => {
    // Toggle language
    isEnglish = !isEnglish;
  
    if (isEnglish) {
      languagetoggle.html('<span style="color:#A8B69A">NL / </span><span style="color:white">ENG</span>');
      rollLink.html("Piano roll");
	  discLink.html("Disc");
	  bookLink.html("Organ book");
	  cylinderLink.html("Cylinder");
	  nameGame.html("Compose<br>a song");
	  
    } else {
      languagetoggle.html('<span style="color:white">NL</span><span style="color:#A8B69A"> / ENG</span>');
      rollLink.html("Papieren rol");
	  discLink.html("Metalen plaat");
	  bookLink.html("Orgelboek");
	  cylinderLink.html("Cilinder");
	  nameGame.html("Componeer<br>een lied");
    }
  });      
  
  scaleButton = createImg("images/major_icon.jpg", "Scale");
  scaleButton.size(55, 55);
  scaleButton.position(225,310);
  scaleButton.mousePressed(cycleScale); 

  // Create three instrument buttons
  for (let i = 0; i < instruments.length; i++) {
    let btn = createImg(instruments[i].icon, instruments[i].name);
    btn.size(75, 75);
    btn.position(212, 50 + i * 80);
    btn.mousePressed(() => selectInstrument(i));
    instrumentButtons.push(btn);
  }

  // Set initial instrument selection
  selectInstrument(0);
  
  presetButton = createImg("images/presetbutton_inactive.jpg", "R")
  presetButton.size(55, 50);
  presetButton.position(225, 400);   
  presetButton.touchStarted(loadPresetSong);

  durationSlider = createSlider(100, 1000, 550);
  durationSlider.position(10 + playButton.width, 40);
  durationSlider.style("width", "60px");
  durationSlider.value(550);
  durationSlider.addClass("mySliders");
  durationSlider.hide()

  graphics = createGraphics(windowWidth, windowHeight);
  drawConcentricCircles();
  drawButtonEllipses();
}

function draw() {
  background('#ECEFE9');

  if (isPlaying) {
    duration_init = durationSlider.value();
    duration = map(duration_init, 100, 1000, 1000, 100);

    let elapsedTime = millis() - startTime;
    let totalRotationDuration = numSegments * duration;
    currentAngle = -(elapsedTime % totalRotationDuration) / totalRotationDuration * TWO_PI;
    targetAngle = currentAngle;
  } else if (isEasing) {
    currentAngle += (0 - currentAngle) * easingFactor;
    if (abs(currentAngle) < 0.001) {
      currentAngle = 0;
      isEasing = false;
      playButton.removeAttribute("disabled");
    }
  }

  image(graphics, 0, 0);
  image(buttonGraphics, 0, 0);

  push();
  translate(circleCenterX, circleCenterY);
  rotate(currentAngle);
  translate(-circleCenterX, -circleCenterY);

  let angleIncrement = TWO_PI / numSegments;
  let radiusIncrement = circleRadius / numRings;
  drawButtonEllipses();

  let segmentAngles = new Array(numSegments);
  for (let j = 0; j < numSegments; j++) {
    segmentAngles[j] = atan2(Math.sin(j * angleIncrement), Math.cos(j * angleIncrement)) + HALF_PI;
  }

  // Grey segment
  let arcRadius = circleRadius * 1.06 + radiusIncrement * numRings;
  noStroke();
  fill(90, 90, 90, 15);
  arc(circleCenterX, circleCenterY, arcRadius, arcRadius, 3.45, 3.8);

  // Draw visual points first (light grey, behind regular points)
  if (showPresetPoints) {
    for (let i = 3; i <= numRings; i++) {
      let quantizedRadius = i * radiusIncrement;
      for (let j = 0; j < numSegments; j++) {
        if (j === gapIndex) continue;

        let quantizedX = circleCenterX + quantizedRadius * Math.cos(j * angleIncrement);
        let quantizedY = circleCenterY + quantizedRadius * Math.sin(j * angleIncrement);

        if (visualPoints[i] && visualPoints[i][j]) {
          push();
          translate(quantizedX, quantizedY);
          rotate(segmentAngles[j]);
          
          
          let originalIndex = scaleMappings[i - 3];
          let colIndex = individualInstrumentArray[originalIndex] - 1;
          fill(ellipseColors[colIndex]);             

          noStroke();
          rect(0, 0, radiusIncrement * 0.6, radiusIncrement / 2);
          pop();
        }
      }
    }
  }

  // Draw regular points (on top of visual points)
  for (let i = 3; i <= numRings; i++) {
    let quantizedRadius = i * radiusIncrement;
    for (let j = 0; j < numSegments; j++) {
      if (j === gapIndex) continue;

      let quantizedX = circleCenterX + quantizedRadius * Math.cos(j * angleIncrement);
      let quantizedY = circleCenterY + quantizedRadius * Math.sin(j * angleIncrement);

      if (points[i][j]) {
        push();
        translate(quantizedX, quantizedY);
        rotate(segmentAngles[j]);
        
        fill(0, 170); // Original black for regular points
        
        noStroke();
        rect(0, 0, radiusIncrement * 0.6, radiusIncrement / 2);
        pop();
      }
    }
  }
  pop();
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
    let touchX = touches[0].x;
    let touchY = touches[0].y;
    let d = dist(touchX, touchY, circleCenterX, circleCenterY);

    if (d <= circleRadius + 12) {
      let adjustedTouchX = touchX;
      let adjustedTouchY = touchY;

      if (isPlaying) {
        let elapsedTime = millis() - startTime;
        let totalRotationDuration = numSegments * duration;
        let currentAngle = -(elapsedTime % totalRotationDuration) / totalRotationDuration * TWO_PI;

        let cosAngle = Math.cos(-currentAngle);
        let sinAngle = Math.sin(-currentAngle);
        let dx = touchX - circleCenterX;
        let dy = touchY - circleCenterY;

        adjustedTouchX = cosAngle * dx - sinAngle * dy + circleCenterX;
        adjustedTouchY = sinAngle * dx + cosAngle * dy + circleCenterY;
      }

      let buttonClicked = false;

      if (!buttonClicked) {
        let [rIndex, aIndex] = getClosestQuantizedIndices(adjustedTouchX, adjustedTouchY);
        if (rIndex > 0) {
          points[rIndex][aIndex] = !points[rIndex][aIndex];
        }
      }
    }
  }
}

function getClosestQuantizedIndices(x, y) {
  let angleIncrement = TWO_PI / numSegments;
  let radiusIncrement = circleRadius / numRings;
  let minDistSq = Infinity;
  let closestRIndex, closestAIndex;
  for (let i = 3; i <= numRings; i++) {
    let quantizedRadius = i * radiusIncrement;
    for (let j = 0; j < numSegments; j++) {
      let quantizedAngle = j * angleIncrement;
      let cosAngle = Math.cos(quantizedAngle);
      let sinAngle = Math.sin(quantizedAngle);
      let quantizedX = circleCenterX + quantizedRadius * cosAngle;
      let quantizedY = circleCenterY + quantizedRadius * sinAngle;

      let dx = x - quantizedX;
      let dy = y - quantizedY;
      let distSq = dx * dx + dy * dy;

      if (distSq < minDistSq) {
        minDistSq = distSq;
        closestRIndex = i;
        closestAIndex = j;
      }
    }
  }
  return [closestRIndex, closestAIndex];
}

function initializePointsArray(clear = false) {
  let newPoints = Array.from({ length: numRings + 1 }, (_, i) => 
    Array.from({ length: numSegments }, (_, j) => 
      !clear && points?.[i]?.[j] !== undefined ? points[i][j] : false
    )
  );
  points = newPoints;
  
  // Initialize visualPoints if it doesn't exist or needs to be cleared
  if (clear || visualPoints.length === 0) {
    visualPoints = Array.from({ length: numRings + 1 }, () => 
      new Array(numSegments).fill(false)
    );
  }
}

function clearInstruments() {
  individualInstrumentArray = new Array(37).fill(1);
  loadAudioSet(individualInstrumentArray);
}

function playSound(buffer) {
  let source = audioContext.createBufferSource();
  source.buffer = buffer;
  let gainNode = audioContext.createGain();
  gainNode.gain.value = 0.2;
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  source.start(0);
}

function createPlayButton() {
  playButton = createImg("images/play_icon.jpg", "▶");
  playButton.size(55, 55);
  playButton.position(322, 65);
  playButton.mousePressed(togglePlayback);
}

function createClearButton() {
  clearButton = createImg("images/bin_icon.jpg", "✖");
  clearButton.size(60, 60);
  clearButton.position(320, 160);
  clearButton.mousePressed(() => {
    initializePointsArray(true);
    visualPoints = Array.from({ length: numRings + 1 }, () => 
      new Array(numSegments).fill(false)
    );
    showPresetPoints = false; // Also turn off preset points display
    presetButton.attribute('src', 'images/presetbutton_inactive.jpg'); // Reset button image
    clearInstruments();
  });
}

function playAllNotes(startSegmentIndex) {
  if (timeoutIds.length > 0) {
    return;
  }
  isPlaying = true;
  let loopFunction = () => {
    for (let j = startSegmentIndex; j < numSegments + startSegmentIndex; j++) {
      let adjustedIndex = j % numSegments;
      if (adjustedIndex === gapIndex) continue;
      let timeoutId = setTimeout(() => {
        if (!isPlaying) {
          clearTimeouts();
          return;
        }
        for (let i = 3; i <= numRings; i++) {
          if (points[i][adjustedIndex]) {
            let bufferIndex = scaleMappings[i - 3];
            playSound(audioBuffers[bufferIndex]);
          }
        }
      }, (j - startSegmentIndex) * duration);
      timeoutIds.push(timeoutId);
    }
    if (isPlaying) {
      let timeoutId = setTimeout(loopFunction, numSegments * duration);
      timeoutIds.push(timeoutId);
    }
  };
  loopFunction();
}

function clearTimeouts() {
  timeoutIds.forEach((timeoutId) => clearTimeout(timeoutId));
  timeoutIds = [];
}

function togglePlayback() {
  if (!isPlaying && !isEasing) {
    let duration_init = durationSlider.value();
    duration = map(duration_init, 100, 1000, 1000, 100);
    isPlaying = true;
    startTime = millis();
    playAllNotes(10); // index to start playing from
    playButton.attribute("src", "images/stop_icon.jpg");
    durationSlider.attribute("disabled", "");
  } else if (isPlaying) {
    // Stop
    isPlaying = false;
    clearTimeouts();
    playButton.attribute("src", "images/play_icon.jpg");
    durationSlider.removeAttribute("disabled");
    isEasing = true;
    playButton.attribute("disabled", "");
  }
}

function resizeCanvasToWindow() {
  resizeCanvas(windowWidth, windowHeight);
  circleCenterX = windowWidth / 2;
  circleCenterY = windowHeight / 2;
  let baseRadius = Math.min(windowWidth, windowHeight) * 0.4;
  circleRadius = baseRadius;
  innerCircleRadius = baseRadius * 0.6;
  redraw();
}

function drawConcentricCircles() {
  graphics.clear();
  graphics.noFill();
  graphics.stroke(0, 50);
  graphics.strokeWeight(0);
  graphics.ellipse(circleCenterX, circleCenterY, circleRadius * 2.1);

  // sketch border
  graphics.stroke(0, 50);
  graphics.strokeWeight(3);
  graphics.noFill();
  graphics.rect(0, 0, windowWidth, windowHeight);

  // rings
  graphics.strokeWeight(1);
  graphics.stroke(0, 25);
  let radiusIncrement = circleRadius / numRings;
  let offset = radiusIncrement / 5;
  let smallestRadius = radiusIncrement * 2.2;
  graphics.ellipse(circleCenterX, circleCenterY, smallestRadius * 2);

  for (let i = 3; i <= numRings; i++) {
    let currentRadius = i * radiusIncrement + offset;
    graphics.ellipse(circleCenterX, circleCenterY, currentRadius * 2);
  }
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
    nextScale = "minor";
    displayName = "Minor";
  } 
  else if (currentScale === "minor") {
    scaleMappings = majorScale;
    nextScale = "major";
    displayName = "Major";
  }
  // Update button image
  scaleButton.elt.src = `images/${nextScale}_icon.jpg`;
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
  }, 50); // debounce delay
}

function drawButtonEllipses() {
  let radiusIncrement = circleRadius / numRings;
  let stationary_angle = -PI / 1.18;
  let offsetRadiusIncrement = radiusIncrement * -0.3;
  buttonGraphics.clear();
  ellipseButtons = [];

  for (let i = 3; i <= numRings; i++) {
    let quantizedRadius = i * radiusIncrement;
    let adjustedRadius = quantizedRadius + offsetRadiusIncrement;
    let angle = stationary_angle + i * 0.013;
    let cosAngle = cos(angle);
    let sinAngle = sin(angle);
    let buttonSize = radiusIncrement * 0.95;
    let buttonX = circleCenterX + adjustedRadius * cosAngle;
    let buttonY = circleCenterY + adjustedRadius * sinAngle;

    let originalIndex = scaleMappings[i - 3];
    let colIndex = individualInstrumentArray[originalIndex] - 1;
    buttonGraphics.fill(ellipseColors[colIndex]);
    ellipseButtons.push({
      id: i - 3,
      x: buttonX,
      y: buttonY,
      size: buttonSize,
    });
    buttonGraphics.noStroke();
    buttonGraphics.ellipse(buttonX, buttonY, buttonSize, buttonSize);
  }
}

function loadPresetSong() {
  showPresetPoints = !showPresetPoints; // Toggle state
  initializePointsArray(clear = true);

  if (showPresetPoints) {
    // Only load points when turning them on
    numRings = 15;
    
    // Set to Major scale
    if (scaleMappings !== majorScale) {
      while (scaleMappings !== majorScale) {
        scaleMappings = majorScale;
        scaleButton.elt.src = 'images/major_icon.jpg';
      }
    }

    // Initialize visual points array
    visualPoints = Array.from({ length: numRings + 1 }, () => 
      new Array(numSegments).fill(false)
    );

    // Load preset points
    const presetPoints = [
      [3, 10], [3, 11], [7, 12], [7, 13],
      [8, 14], [8, 15], [7, 0], 
      [6, 2], [6, 3], [5, 4], [5, 5],
      [4, 6], [4, 7], [3, 8]
    ];

    for (let [i, j] of presetPoints) {
      if (i <= numRings && j < numSegments) {
        visualPoints[i][j] = true;
      }
    }

    presetButton.elt.src = 'images/presetbutton_active.jpg';
  } else {
    // Clear visual points
    visualPoints = Array.from({ length: numRings + 1 }, () => 
      new Array(numSegments).fill(false)
    );

    presetButton.elt.src = 'images/presetbutton_inactive.jpg';
  }

  drawConcentricCircles();
  ellipseButtons = [];
  drawButtonEllipses();
}
