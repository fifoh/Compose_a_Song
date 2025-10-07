p5.disableFriendlyErrors = true;
let lastState = '';
let debounceTimer;
let debounceTimerArray; 
let buttonSize = 20;
let ellipseButtons = [];
let ellipseColors = [
  [108,142,93], // dark green 
  [173, 200, 159], // light Green
  [159, 129, 177], // purple now
];

let xbookoffset = 0;

let showPreset = false;
let presetGrid = [];
const presetSong = [  // Bach D minor toccata / fugue
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], 
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], 
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], 
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
  [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0], 
  [0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0], 
  [1,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0] 
];

let loadedInstrumentSetBuffers = {};
let individualInstrumentArray = new Array(37).fill(1);
let initialBPM_value;
let addButton, removeButton;
let speedSliderPosition;
let speedSliderWidth;
let isPlaying;
let activeSources;
let rectX;
let rectY;
let rectWidth;
let rectHeight;
let cellWidth;
let cellHeight;
let mainRectPadding;  
let checkbox;
let prevSliderValue = 0;

let instrumentButtons = [];
let instruments = [
  { name: "Comb", icon: "images/organ_icon.jpg", whiteIcon: "images/organ_icon_white.jpg" },
  { name: "Piano", icon: "images/piano_icon.jpg", whiteIcon: "images/piano_icon_white.jpg" },
  { name: "Bells", icon: "images/bells_icon.jpg", whiteIcon: "images/bells_icon_white.jpg" }
];
let selectedInstrument = 0; // 0 = Comb, 1 = Piano, 2 = Bells

let rightGrotesk;
let discLink;
let cylinderLink;
let bookLink;
let rollLink;

let rows = 12;
const cols = 32;

let grid = [];
let gridChanged = true; 
let pixelsPerMillisecond = 0;
let animate = false;
let animationStartTime = 0;

let playButton;
let stopButton;
let clearButton;
let speedSlider;
let noteDuration = 500;
let totalAnimationTime = 8000;
let columnDuration = totalAnimationTime / cols;

// Audio
let audioBuffers = [];
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let bufferLoader;

function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = [];
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
  let request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';
  let loader = this;
  request.onload = function() {
    loader.context.decodeAudioData(
      request.response,
      function(buffer) {
        if (!buffer) {
          console.error('Error decoding file data: ' + url);
          return;
        }
        loader.bufferList[index] = buffer;
        if (++loader.loadCount == loader.urlList.length) {
          loader.onload(loader.bufferList);
        }
      },
      function(error) {
        console.error('decodeAudioData error for ' + url, error);
      }
    );
  };
  request.onerror = function() {
    console.error('BufferLoader: XHR error for ' + url);
  };
  request.send();
};

BufferLoader.prototype.load = function() {
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

function loadAudioSet(individualInstrumentArray) {
  let filePathsToLoad = [];
  let bufferIndicesToLoad = [];
  for (let i = 0; i < 37; i++) {
    let setNumber = individualInstrumentArray[i];
    let instrumentSet = '';
    if (setNumber === 1) {
      instrumentSet = 'organ';
    } else if (setNumber === 2) {
      instrumentSet = 'piano';
    } else if (setNumber === 3) {
      instrumentSet = 'bells';      
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
    // If no files need to be loaded, call finishedLoading with an empty array
    finishedLoading([], []);
  }
}

function finishedLoading(newBufferList, bufferIndicesToLoad) {
  for (let i = 0; i < newBufferList.length; i++) {
    let bufferIndex = bufferIndicesToLoad[i];
    audioBuffers[bufferIndex] = newBufferList[i];

    let setNumber = individualInstrumentArray[bufferIndex];
    let instrumentSet = '';
    if (setNumber === 1) {
      instrumentSet = 'organ';
    }
    if (setNumber === 2) {
      instrumentSet = 'piano';
    }
    else if (setNumber === 3) {
      instrumentSet = 'bells';
    }
    let filePath = `${instrumentSet}/${bufferIndex}.mp3`;
    loadedInstrumentSetBuffers[filePath] = newBufferList[i];
  }
  if (newBufferList.length > 0) {
    let filePathsLoaded = newBufferList.map((buffer, index) => {
      let bufferIndex = bufferIndicesToLoad[index];
      let setNumber = individualInstrumentArray[bufferIndex];
      let instrumentSet = '';
      if (setNumber === 1) {
        instrumentSet = 'organ';
      } 
      if (setNumber === 2) {
        instrumentSet = 'piano';
      } else if (setNumber === 3) {
        instrumentSet = 'bells';
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

let scaleMappings = majorScale;
let dragging = false;
let initialRow = -1;
let initialCol = -1;

let lastTouch = null;
let touchMovedFlag = false;

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
  
  lastTouch = touches[0]; // Store the last touch information
  touchMovedFlag = false; // Reset the flag
  return true; // Prevent any default behavior on touch start
}

function touchEnded() {
  if (!touchMovedFlag && lastTouch) {
    gridChanged = true;
    if (getAudioContext().state !== 'running') {
      getAudioContext().resume();
    }
    
    let touchX = lastTouch.x;
    let touchY = lastTouch.y;
    let adjustedtouchX = touchX - rectX;
    let adjustedtouchY = touchY - rectY;
    let touch = lastTouch;
    let buttonClicked = false;
    if (touch.x > rectX && touch.x < rectX + rectWidth && touch.y > rectY && touch.y < rectY + rectHeight) {
      let col = floor((touch.x - rectX) / cellWidth);
      let row = rows - 1 - floor((touch.y - rectY) / (cellHeight + 5));
      if (grid[row][col]) {
        deleteCells(row, col);
      } else {
        grid[row][col] = true;
        initialRow = row;
        initialCol = col;
        dragging = true;
      }
    }
    
    gridChanged = true;
  }
  
  lastTouch = null; // Clear the stored touch information
  return true;
}
function touchMoved() {
  lastTouch = touches[0]; // Update the last touch information
  touchMovedFlag = true; // Set the flag to true indicating touch moved
  return true; // Prevent any default behavior on touch move
}

function setup() {
  // Suspend the AudioContext
  audioContext.suspend().then(() => {
    console.log('AudioContext suspended in setup:', audioContext.state);
  }).catch((err) => {
    console.error('Error suspending AudioContext:', err);
  });  
  createCanvas(windowWidth * 2, windowHeight);
  window.addEventListener('resize', resizeCanvasToWindow);
  frameRate(60);  
  
  rectX = xbookoffset; // was 50: change all other rectX if this changes
  rectY = 200; // was 130
  rectWidth = windowWidth * 1.8;
  rectHeight = windowHeight * 0.5;
  
  isPlaying = Array(rows).fill(false);
  activeSources = Array(rows).fill(null);

  cellWidth = rectWidth / cols;
  cellHeight = (rectHeight - (rows - 1) * 5) / rows;
  mainRectPadding = 10; // was 10  
  
  graphics = createGraphics(windowWidth, windowHeight);
  graphics.stroke(0, 120);
  graphics.strokeWeight(2);
  graphics.strokeCap(PROJECT);
  
  
  // === Top panel (home, name, logo, language toggle) ===
  leftPanel = createDiv();
  leftPanel.style('position', 'fixed');
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
  
  // Left side: Home button
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

  // Right side: Logo (aligned top right)
  let topRight = createDiv();
  topRight.parent(leftPanel);
  topRight.style('display', 'flex');
  topRight.style('flex-direction', 'row');
  topRight.style('align-items', 'center');
  topRight.style('justify-content', 'flex-end');
  topRight.style('flex', '1'); // pushes it to the right
  topRight.style('margin-right', '15px'); // padding from edge to avoid cutoff

  speelkloklogo = createImg("images/speelklok_logo.png", "logo");
  speelkloklogo.size(150, 65);
  speelkloklogo.parent(topRight);
  speelkloklogo.mousePressed(() => window.location.href = "../../index_dutch.html");  

  // === Middle panel (horizontal buttons) ===
  midPanel = createDiv();
  midPanel.style('position', 'fixed');
  midPanel.style('bottom', '0px');
  midPanel.style('left', '0px');
  midPanel.style('width', '100%');
  midPanel.style('height', '80px'); // adjust
  midPanel.style('background-color', '#ADB99F');
  midPanel.style('display', 'flex');
  midPanel.style('align-items', 'center');
  midPanel.style('justify-content', 'space-around');
  midPanel.style('padding', '5px');
  midPanel.style('box-sizing', 'border-box');

  // === Bottom panel (horizontal buttons) ===
  rightPanel = createDiv();
  rightPanel.style('position', 'fixed');
  rightPanel.style('top', leftPanel.elt.offsetHeight + 'px');
  rightPanel.style('left', '0px');
  rightPanel.style('width', '100%');
  rightPanel.style('height', '60px'); // adjust
  rightPanel.style('background-color', '#775989');
  rightPanel.style('display', 'flex');
  rightPanel.style('flex-direction', 'row');
  rightPanel.style('align-items', 'center');
  rightPanel.style('justify-content', 'flex-start');
  rightPanel.style('gap', '25px');
  rightPanel.style('padding', '10px'); 
  
  playButton = createImg('images/play_icon.jpg', '▶');
  playButton.size(55, 55);
  playButton.style('z-index', '100');
  playButton.touchStarted(() => toggleAnimation(totalAnimationTime));
  playButton.parent(rightPanel);

  stopButton = createImg('images/stop_icon.jpg', '▶');
  stopButton.size(55, 55); 
  stopButton.style('z-index', '100');
  stopButton.touchStarted(stopAnimation).hide();
  stopButton.parent(rightPanel);  

  clearButton = createImg('images/bin_icon.jpg', '✖');
  clearButton.size(60, 60);
  clearButton.style('z-index', '100');
  clearButton.touchStarted(clearGrid);
  clearButton.parent(rightPanel);    
  
  scaleButton = createImg("images/major_icon.jpg", "Scale");
  scaleButton.size(55, 55);
  scaleButton.style('z-index', '100');
  scaleButton.mousePressed(cycleScale);  
  scaleButton.parent(midPanel);   
  
  // Create instrument buttons dynamically
  for (let i = 0; i < instruments.length; i++) {
    let btn = createImg(instruments[i].icon, instruments[i].name);
    btn.size(75, 75);
    btn.style('z-index', '100');
    btn.mousePressed(() => selectInstrument(i));
    btn.parent(midPanel);
    instrumentButtons.push(btn);
  }

  // Select first instrument by default
  selectInstrument(0);
  
  let sliderWrapper = select('.slider-wrapper');
  speedSlider = createSlider(40, 240, 120, 1);
  speedSlider.parent('button-container');
  speedSlider.style('width', '60px');
  speedSliderWidth = speedSlider.width;
  speedSlider.hide();
  
  initializeGridArray();
  
  updateSpeed();
  
  presetButton = createImg("images/presetbutton_inactive.jpg", "Preset");
  presetButton.size(55, 50);
  presetButton.style('z-index', '100');  
  presetButton.mousePressed(togglePreset);
  presetButton.parent(midPanel);      
  
  touchStarted = touchStarted;
  touchEnded = touchEnded;
  touchMoved = touchMoved;
}

function fillCells(row, col1, col2) {
  if (col1 > col2) [col1, col2] = [col2, col1]; // Swap if col1 is greater than col2
  for (let col = col1; col <= col2; col++) {
    grid[row][col] = true;
  }
}

function clearGrid(fullReset = true) {
  if (fullReset) {
    // Clear preset flags and visuals
    showPreset = false;
    showPresetPoints = false;
    presetVisualPoints = [];
    presetButton.elt.src = 'images/presetbutton_inactive.jpg';

    // Reset scale
    if (scaleMappings !== majorScale) {
      scaleMappings = majorScale;
      scaleButton.elt.src = 'images/major_icon.jpg';
    }

    // Reset instrument
    selectInstrument(0);
  }

  // Always clear the grid itself
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < cols; j++) {
      grid[i][j] = false;
    }
  }

  gridChanged = true;
}

function deleteCells(row, col) {
  let left = col;
  while (left >= 0 && grid[row][left]) {
    grid[row][left] = false;
    left--;
  }
  let right = col + 1;
  while (right < cols && grid[row][right]) {
    grid[row][right] = false;
    right++;
  }
}

function draw() {
  if (gridChanged || animate || speedSlider.value() !== prevSliderValue) {
    clear();
    background('#ECEFE9');
    translate(rectX, rectY);

    fill(255);
    stroke(1, 20);
    rect(-mainRectPadding, -mainRectPadding, rectWidth + 2 * mainRectPadding, rectHeight + 2 * mainRectPadding);
    
    // Draw grid cells
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        noStroke();

        // Draw preset notes first (if enabled)
        if (showPreset && i < presetSong.length && j < presetSong[i].length && presetSong[i][j]) {
          
          let originalIndex = scaleMappings[i];
          let colIndex = individualInstrumentArray[originalIndex] - 1;
          fill(ellipseColors[colIndex]);          
          rect(j * cellWidth, (rows - 1 - i) * (cellHeight + 5), cellWidth, cellHeight);
        }

        // Draw active notes - green if they overlap with preset, black otherwise
        if (grid[i][j]) {
          if (showPreset && i < presetSong.length && j < presetSong[i].length && presetSong[i][j]) {
            // fill colour for correct notes
            let originalIndex = scaleMappings[i];
            let colIndex = individualInstrumentArray[originalIndex] - 1;
            fill(0);            
          } else {
            fill(0); // Black for regular active notes
          }
          rect(j * cellWidth, (rows - 1 - i) * (cellHeight + 5), cellWidth, cellHeight);
        } 
        // Draw empty cells (only if not preset or active)
        else if (!(showPreset && i < presetSong.length && j < presetSong[i].length && presetSong[i][j])) {
          fill(255); // White for empty cells
          rect(j * cellWidth, (rows - 1 - i) * (cellHeight + 5), cellWidth, cellHeight);
        }
      }
    }
    
    // Draw instrument selection buttons
    for (let i = 0; i < rows; i++) {
      let buttonSize = cellHeight * 0.4;
      let buttonX = -30;
      let buttonY = (rows - 1 - i) * (cellHeight + 5) + cellHeight / 2;
      // Only add button if not already in array
      if (ellipseButtons.length <= i) {
        ellipseButtons.push({ id: i, x: buttonX, y: buttonY, size: buttonSize });
      }
      let originalIndex = scaleMappings[i];
      let colIndex = individualInstrumentArray[originalIndex] - 1;
      fill(ellipseColors[colIndex]);
      strokeWeight(0);
      ellipse(buttonX, buttonY, buttonSize, buttonSize);      
    }
    
    // Draw vertical grid lines
    for (let j = 0; j <= cols; j++) {
      if (j % 4 === 0) {
        strokeWeight(2);
        stroke(0, 0, 0, 50);
      } else if (j % 1 === 0) {
        strokeWeight(1);
        stroke(0, 0, 0, 35);
      } else {
        continue;
      }
      line(j * cellWidth, 0, j * cellWidth, rectHeight);
    }
    
    translate(-rectX, -rectY);
    gridChanged = false;
    image(graphics, 0, 0);
    
    // Draw BPM text if needed
    noStroke();
    fill(0);    
    
    // Animation handling
    if (animate) {      
      let elapsedTime = millis() - animationStartTime;
      let animationProgress = elapsedTime / totalAnimationTime;
      rectX = xbookoffset - animationProgress * (rectWidth + mainRectPadding);

      let currentCol = floor(elapsedTime / columnDuration);
      playColumnSounds(currentCol);

      if (currentCol >= cols) stopAnimation();
    }
  }
  prevSliderValue = speedSlider.value();  
}

function updateSpeed() {
  if (!animate) {
    initialBPM_value = speedSlider.value();
  }
  
  let BPM_value = speedSlider.value();

  let newTotalAnimationTime = ((60 / BPM_value) * 16) * 1000; // change (*16) if changing grid size

  if (animate) {
    // Calculate the current progress percentage
    let progress = (millis() - animationStartTime) / totalAnimationTime;

    totalAnimationTime = newTotalAnimationTime;
    pixelsPerMillisecond = (rectX + rectWidth + mainRectPadding) / totalAnimationTime;

    animationStartTime = millis() - (progress * totalAnimationTime);
  } else {
    totalAnimationTime = newTotalAnimationTime;
  }

  columnDuration = totalAnimationTime / cols;
}

function toggleAnimation() {
  animate = !animate;
  if (animate) {
    scrollToStart(); // Scroll to the start when animation begins
    playButton.hide();
    stopButton.show();
    pixelsPerMillisecond = (rectX + rectWidth + mainRectPadding) / totalAnimationTime;
    animationStartTime = millis();
    columnDuration = totalAnimationTime / cols;
  } else {
    stopAnimation();
  }
}

function stopAnimation() {
  animate = false;
  stopButton.hide();
  playButton.show();
  rectX = xbookoffset;
  isPlaying.fill(false);
  activeSources.forEach(source => source && stopSoundWithFadeOut(source));
  activeSources.fill(null);
  gridChanged = true; // force redraw
}

function playColumnSounds(col) {
  if (col < 0 || col >= cols) return;
  for (let row = 0; row < rows; row++) {
    if (grid[row][col]) {
      if (!isPlaying[row]) {
        playSound(row);
        isPlaying[row] = true;
      }
    } else {
      if (isPlaying[row]) {
        stopSound(row);
        isPlaying[row] = false;
      }
    }
  }
}

function playSound(row) {
  let bufferIndex = scaleMappings[row];
  playSoundFromBuffer(audioBuffers[bufferIndex], row);
}

function playSoundFromBuffer(buffer, row) {
  let source = audioContext.createBufferSource();
  source.buffer = buffer;
  let gainNode = audioContext.createGain();
  gainNode.gain.value = 0.3;
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  source.start();
  activeSources[row] = { source: source, gainNode: gainNode };
}

function stopSound(row) {
  let activeSource = activeSources[row];
  if (activeSource) {
    stopSoundWithFadeOut(activeSource);
    activeSources[row] = null;
  }
}

function stopSoundWithFadeOut(activeSource) {
  let gainNode = activeSource.gainNode;
  gainNode.gain.setValueAtTime(gainNode.gain.value, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.025);
  activeSource.source.stop(audioContext.currentTime + 0.025);
}

function resizeCanvasToWindow() {
  resizeCanvas(windowWidth * 2, windowHeight);
  redraw();
}

function initializeGridArray() {
  let newGrid = Array(rows).fill().map(() => Array(cols).fill(false));
  for (let i = 0; i < Math.min(grid.length, rows); i++) {
    for (let j = 0; j < cols; j++) {
      newGrid[i][j] = grid[i][j];
    }
  }
  grid = newGrid;
  cellHeight = (rectHeight - (rows - 1) * 5) / rows;
  isPlaying = Array(rows).fill(false);
  activeSources = Array(rows).fill(null);
  gridChanged = true;
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
  
  console.log("Selected scale:", displayName);
}

function updateIndividualInstrumentArray(indexToUpdate) {
  clearTimeout(debounceTimerArray);
  debounceTimerArray = setTimeout(() => {
    if (indexToUpdate >= 0 && indexToUpdate < individualInstrumentArray.length) {
      indexToUpdate = scaleMappings[indexToUpdate];
      individualInstrumentArray[indexToUpdate] = (individualInstrumentArray[indexToUpdate] % 3) + 1; // error check - was %2, changed to mod 3 but is that correct?
      loadAudioSet(individualInstrumentArray);
      gridChanged = true;
    }
  }, 50); // debounce
}

function scrollToStart() {
  window.scrollTo({
    left: 0,
  });
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

function togglePreset() {
  showPreset = !showPreset;
  showPresetPoints = showPreset;

  if (showPreset) {
    clearGrid(false); // Don't reset scale/instrument
    // Apply Minor scale
    if (scaleMappings !== minorScale) {
      scaleMappings = minorScale;
      scaleButton.elt.src = 'images/minor_icon.jpg';
    }
    presetButton.elt.src = 'images/presetbutton_active.jpg';
    // Optionally: loadPresetSong();
  } else {
    clearGrid(); // Full reset
  }
}



