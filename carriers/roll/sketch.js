p5.disableFriendlyErrors = true;
let addButton, removeButton;
let helpButton;
let helpDiv;

let offsetX_OVERALL = 250;

let touchMovedOccurred = false;
let previousTouchY;
let touchX, touchY;
let lastState = '';

let angle = 0;

let touchStartTime;
let touchStartX, touchStartY;
const MOVE_THRESHOLD = 10; // pixels
const TIME_THRESHOLD = 300; // ms

let loadedInstrumentSetBuffers = {};
let individualInstrumentArray = new Array(37).fill(1);

let presetButton;
let presetVisualPoints = [];
let showPresetPoints = false;

let instrumentButtons = [];
let instruments = [
  { name: "Comb", icon: "images/comb_icon.jpg", whiteIcon: "images/comb_icon_white.jpg" },
  { name: "Piano", icon: "images/piano_icon.jpg", whiteIcon: "images/piano_icon_white.jpg" },
  { name: "Bells", icon: "images/bells_icon.jpg", whiteIcon: "images/bells_icon_white.jpg" }
];
let selectedInstrument = 0; // 0 = Comb, 1 = Piano, 2 = Bells

let debounceTimer;
let debounceTimerArray; 
let buttonSize = 20;
let ellipseButtons = [];
let ellipseColors = [
  [108,142,93], // dark green 
  [173, 200, 159], // light Green
  [159, 129, 177], // purple now
];

let barColors = [];
let clearButton;
let numEllipses = 13;
let preventNoteCreation;
let rectX, rectY, rectWidth, rectHeight;

let randomButton;

let rightGrotesk;
let discLink;
let cylinderLink;
let bookLink;
let rollLink;

// Audio
let audioBuffers = [];
let audioContext;
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
      instrumentSet = 'comb';
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
      instrumentSet = 'comb';
    } else if (setNumber === 2) {
      instrumentSet = 'piano';
    } else if (setNumber === 3) {
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
        instrumentSet = 'comb';
      } else if (setNumber === 2) {
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

const ellipseWidth = 0;
let centerY;
let ellipses = [];
let isPlaying = false;
let playStopButton;
let speedSlider;
const minDistance = 5;
let clickProximityX;
let ellipseHeight;
let clickProximityY;
let pointSize;

let buffer;
let textureBuffer;
let textureY = 0;

function setup() {
  
  noScroll();
  
  // Suspend the AudioContext
  audioContext.suspend().then(() => {
    console.log('AudioContext suspended in setup:', audioContext.state);
  }).catch((err) => {
    console.error('Error suspending AudioContext:', err);
  });
  
  createCanvas(windowWidth, windowHeight);
  window.addEventListener('resize', resizeCanvasToWindow);
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
  discLink.style('color', '#A8B69A');
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
  rollLink.style('color', 'white');
  rollLink.style('text-decoration', 'underline');
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
    
  clearButton = createImg('images/bin_icon.jpg', '✖');
  clearButton.size(60, 60);
  clearButton.position(320, 160);
  clearButton.touchStarted(clearNotes);

  // Create the play/stop button
  playStopButton = createImg('images/play_icon.jpg', '▶');
  playStopButton.size(55, 55); 
  playStopButton.position(322, 65); 
  playStopButton.touchStarted(togglePlayStop);

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
  
  let sliderWrapper = select('.slider-wrapper');
  speedSlider = createSlider(0.01, 0.03, 0.01, 0.001);
  speedSlider.position(65, 40);
  speedSlider.parent(sliderWrapper);
  speedSlider.style('width', '90px');
  speedSlider.hide();
  
  createEllipses();
  
  for (let i = 0; i < numEllipses; i++) {
    barColors[i] = color(0, 60);
  }  
  
  buffer = createGraphics(width, height);
  buffer.background('#ECEFE9');
  buffer.fill(180, 180, 180, 80);
  buffer.noStroke();
  buffer.rect(windowWidth*0.2 + offsetX_OVERALL, windowHeight*0.36, windowWidth *0.5, windowHeight*0.4, 10);
  
  // was 0.05, 0.36, 0.89, 0.476, 10
  
  buffer.stroke(0, 50);
  buffer.strokeWeight(3);
  buffer.noFill();
  buffer.rect(0, 0, windowWidth, windowHeight);
  
  let rectWidth = windowWidth * 0.5;
  let rectHeight = windowHeight * 0.4;
  
  textureBuffer = createGraphics(rectWidth, rectHeight);
  let rectX = windowWidth * 0.2;
  let rectY = windowHeight * 0.36;
  textureBuffer.noStroke();
  
  initializePointsArray();
}

function draw() {
  background('#ECEFE9');
  image(buffer, 0, 0);
  
  let rectX = windowWidth * 0.2;
  let rectY = windowHeight * 0.36;
  let rectWidth = windowWidth * 0.5;
  let rectHeight = windowHeight * 0.4;  
  
  // was 0.05; 0.36; 0.89; 0.476;   
  
  centerY = rectY + rectHeight / 2;
  let xBarOffset = 18;
  let yBarOffset = 0;

  if (isPlaying) {
    textureY -= speedSlider.value() * 140;
    if (textureY <= -textureBuffer.height) {
      textureY += textureBuffer.height;
    }
  }

  textureBuffer.clear();
  textureBuffer.fill(0, 0, 0, 2);
  for (let y = textureY % 20; y < textureBuffer.height + 20; y += 20) {
    textureBuffer.rect(0, y, textureBuffer.width, 5);
  }
  push();
  translate(windowWidth * 0.2 + offsetX_OVERALL, windowHeight * 0.36);
  copy(textureBuffer, 0, 0, round(textureBuffer.width), round(textureBuffer.height), 0, 0, round(textureBuffer.width), round(textureBuffer.height));
  pop();
  
  
  if (isPlaying || touchMovedOccurred) {
    for (let preset of presetVisualPoints) {
      if (isPlaying) {
        preset.angle += speedSlider.value();
        preset.angle %= TWO_PI;
      }

      if (touchMovedOccurred) {
        let deltaY = touchY - previousTouchY;
        if (deltaY > 0) {
          preset.angle += 0.03;
          preset.angle = ((preset.angle % TWO_PI) + TWO_PI) % TWO_PI;
        }
        if (deltaY < 0) {
          preset.angle -= 0.03;
          preset.angle = ((preset.angle % TWO_PI) + TWO_PI) % TWO_PI;
        }
      }
    }
  }  
  
  if (showPresetPoints) {
    for (let preset of presetVisualPoints) {
      let i = preset.band;
      if (i < ellipses.length) { // Make sure the band exists
        let ellipseData = ellipses[i];
        let angle = preset.angle;
        let pointX = ellipseData.centerX + ellipseWidth / 2 * Math.cos(angle);
        let pointY = centerY + ellipseHeight / 2 * Math.sin(angle);
        let verticalSize = map(1 - pow(abs(Math.sin(angle)), 10), 0, 1, 1, 10);

        // Draw preset points as faint outlines
        let adjustment = -2.5;
        let alpha;
        if (angle > HALF_PI + adjustment && angle < PI + HALF_PI - adjustment) {
          if (angle < PI) {
            alpha = map(angle, HALF_PI + adjustment, PI, -25, 255);
          } else {
            alpha = map(angle, PI, PI + HALF_PI - adjustment, 255, -25);
          }
        } else {
          alpha = 0;
        }     
        
        // colour change goes here
        
        let originalIndex = scaleMappings[i];
        let colIndex = individualInstrumentArray[originalIndex] - 1;   
        let newColor = color(ellipseColors[colIndex]);
        let r = red(newColor);
        let g = green(newColor);
        let b = blue(newColor);
        
        stroke(180, 180, 180, alpha);
        strokeWeight(0);

        fill(r, g, b, alpha);    
        rectMode(CENTER);
        rect(pointX, pointY, pointSize, verticalSize);
      }
    }
  }  

  let baseX = windowWidth * 0.23; // Original base position without offset
  let spacing = (windowWidth - baseX * 2.44) / (numEllipses - 1); // Calculate spacing based on original layout
  
  // Apply offset after calculating spacing
  let firstEllipseX = baseX + offsetX_OVERALL;
  
  for (let i = 0; i < numEllipses; i++) {
    let ellipseData = ellipses[i];
    ellipseData.centerX = firstEllipseX + spacing * i; // Now maintains proper spacing
  }
  
  let bar_thickness = 6;
  for (let i = 0; i < numEllipses; i++) {
    stroke(barColors[i]);
    strokeWeight(bar_thickness);
    let startX = ellipses[i].centerX;
    let startY = windowHeight * 0.335; // this is the bar height
    let endX = startX;
    let endY = startY - windowHeight*0.15 + i*4.8;
    line(startX, startY, endX, endY);
    
    let buttonSize = 20;
    let buttonX = startX;
    let buttonY = endY;
    ellipseButtons.push({ id: i, x: buttonX, y: buttonY, size: buttonSize });
    
    let originalIndex = scaleMappings[i];
    let colIndex = individualInstrumentArray[originalIndex] - 1;
    
    fill(ellipseColors[colIndex]);
    stroke(barColors[i]);
    strokeWeight(0);
    ellipse(buttonX, buttonY, buttonSize, buttonSize);         

    
  }  
  for (let i = 0; i < ellipses.length; i++) {
    let ellipseData = ellipses[i];
    ellipseData.centerX = firstEllipseX + spacing * i;
    ellipseData.centerY = centerY;
    noFill();
    noStroke();
    ellipse(ellipseData.centerX, centerY, ellipseWidth, ellipseHeight);
    pointSize = windowWidth * 0.15 / numEllipses;
    for (let j = ellipseData.points.length - 1; j >= 0; j--) {
      let band_point = ellipseData.points[j];
      let { angle } = band_point;
      let pointX = ellipseData.centerX + ellipseWidth / 2 * Math.cos(angle);
      let pointY = centerY + ellipseHeight / 2 * Math.sin(angle);
      let verticalSize = map(1 - pow(abs(Math.sin(angle)), 10), 0, 1, 1, 10);

      let adjustment = -2.5;

      let alpha;
      if (angle > HALF_PI + adjustment && angle < PI + HALF_PI - adjustment) {
        if (angle < PI) {
          alpha = map(angle, HALF_PI + adjustment, PI, -25, 255);
        } else {
          alpha = map(angle, PI, PI + HALF_PI - adjustment, 255, -25);
        }
      } else {
        alpha = 0;
      }
      fill(0, 0, 0, alpha);
      rectMode(CENTER);
      noStroke();
      rect(pointX, pointY, pointSize, verticalSize);

      if (angle >= PI + PI / 2 && angle < PI + PI / 2 + speedSlider.value()) {
        let bufferIndex = scaleMappings[i];
        playSound(audioBuffers[bufferIndex]);
        if (!touchMovedOccurred) {
          flashBar(i);
        }
        
        
      }

      if (isPlaying) {
        band_point.angle += speedSlider.value();
        band_point.angle %= TWO_PI;
      }
      
      if (touchMovedOccurred) {
        let deltaY = touchY - previousTouchY;
        
        if (deltaY > 0) {
          band_point.angle += 0.03;
          band_point.angle = ((band_point.angle % TWO_PI) + TWO_PI) % TWO_PI;
          
          textureY -= 0.03 * 140;
          if (textureY <= -textureBuffer.height) {
            textureY += textureBuffer.height;
          }          
        }
        if (deltaY < 0) {
          band_point.angle -=0.03;
          band_point.angle = ((band_point.angle % TWO_PI) + TWO_PI) % TWO_PI;
          textureY += 0.03 * 140;
          if (textureY <= -textureBuffer.height) {
            textureY += textureBuffer.height;
          }                
        }
      }
    }
  }
}

function togglePlayStop() {
  isPlaying = !isPlaying;
  if (isPlaying) {
    playStopButton.elt.src = 'images/pause_icon.jpg';
  } else {
    playStopButton.elt.src = 'images/play_icon.jpg';
  }
}

function touchStarted() {
  touchX = touches[0].x;
  touchY = touches[0].y;
  touchStartX = touchX;
  touchStartY = touchY;
  touchStartTime = Date.now();
  touchMovedOccurred = false;
  return true;
}

function touchMoved(event) {
  event.preventDefault();
  if (preventNoteCreation) return;
  if (isPlaying) return;
  
  // Get the current touch position
  let currentTouchY = touches[0].y;
  let currentTouchX = touches[0].x;
  
  let rectX = windowWidth * 0.2 + offsetX_OVERALL;
  let rectY = windowHeight * 0.36;
  let rectWidth = windowWidth * 0.5;
  let rectHeight = windowHeight * 0.4;    
  
  if (currentTouchX >= rectX && currentTouchX <= rectX + rectWidth &&
      currentTouchY >= rectY && currentTouchY <= rectY + rectHeight) {  
    // Calculate distance from start position
    const dx = currentTouchX - touchStartX;
    const dy = currentTouchY - touchStartY;
    const distance = Math.sqrt(dx*dx + dy*dy);
    
    // If moved beyond threshold, set the flag
    if (distance > MOVE_THRESHOLD) {
      touchMovedOccurred = true;
    }
    
    // Update previous touch position
    previousTouchY = currentTouchY;
    return false;
  }
  
  return true;
}

function touchEnded() {
  // Check if it was a quick tap (not a drag)
  const isQuickTap = !touchMovedOccurred && 
                    (Date.now() - touchStartTime < TIME_THRESHOLD);
  
  if (!isQuickTap) {
    touchMovedOccurred = false;
    return;
  }

  if (audioContext.state !== 'running') {
    userStartAudio().then(() => {
      audioContext.resume().then(() => {
        console.log('AudioContext resumed on touchEnded:', audioContext.state);
      }).catch((err) => {
        console.error('Error resuming AudioContext:', err);
      });
    }).catch((err) => {
      console.error('Error starting user audio:', err);
    });
  }

  if (preventNoteCreation) return;

  let buttonClicked = false;

  clickProximityX = windowWidth * 0.15 / numEllipses;
  for (let i = 0; i < ellipses.length; i++) {
    let ellipseData = ellipses[i];
    let dXLeft = abs(touchX - (ellipseData.centerX - clickProximityX));
    let dXRight = abs(touchX - (ellipseData.centerX + clickProximityX));
    let dY = abs(touchY - centerY);

    if ((dXLeft <= clickProximityX || dXRight <= clickProximityX) && dY <= clickProximityY) {
      let newAngle = asin((touchY - centerY) / (ellipseHeight / 2));
      newAngle = PI - newAngle;
      let canAdd = true;

      // Check against both actual points and preset points
      for (let band_point of ellipseData.points) {
        let distance = abs(newAngle - band_point.angle);
        if (distance < minDistance * (PI / 180)) {
          canAdd = false;
          break;
        }
      }

      if (canAdd) {
        ellipseData.points.push({ angle: newAngle });
        break;
      }
    }

    for (let j = ellipseData.points.length - 1; j >= 0; j--) {
      let band_point = ellipseData.points[j];
      let { angle } = band_point;

      let pointX = ellipseData.centerX + ellipseWidth / 2 * Math.cos(angle);
      let pointY = centerY + ellipseHeight / 2 * Math.sin(angle);

      if (dist(touchX, touchY, pointX, pointY) <= pointSize / 2) {
        ellipseData.points.splice(j, 1);
        break;
      }
    }
  }
}

function playSound(buffer) {
  if (isPlaying) {

    let source = audioContext.createBufferSource();
    source.buffer = buffer;
    let gainNode = audioContext.createGain();
    gainNode.gain.value = 0.2;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    source.start(0);
  }
}

function flashBar(barIndex) {
  barColors[barIndex] = color(255, 75);
  setTimeout(() => {
    barColors[barIndex] = color(0, 60);
  }, 70);
}

function resizeCanvasToWindow() {
  resizeCanvas(windowWidth, windowHeight);
  createEllipses();
  redraw();
}

function positionrandomButton() {
  randomButton.position(windowWidth - 50, 80);
}

function createEllipses() {
  let spacing = windowWidth *0.9 / numEllipses;
  ellipseHeight = windowHeight * 0.4; // was 0.425
  clickProximityY = ellipseHeight;
  for (let i = 0; i < numEllipses; i++) {
    ellipses.push({ centerX: spacing * i + spacing, points: [] });
  }
}

function initializePointsArray() {
  let newEllipses = [];
  let spacing = windowWidth * 0.9 / numEllipses;
  ellipseHeight = windowHeight * 0.4; // was 0.425
  clickProximityY = ellipseHeight;

  for (let i = 0; i < numEllipses; i++) {
    let existingPoints = (ellipses[i] && ellipses[i].points) ? ellipses[i].points : [];
    newEllipses.push({ centerX: spacing * i + spacing, points: existingPoints });
  }

  ellipses = newEllipses;
  barColors = [];
  for (let i = 0; i < numEllipses; i++) {
    barColors[i] = color(0, 60);
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

// Function to calculate the difference between two angles in radians
function angleDifference(angle1, angle2) {
  let diff = angle1 - angle2;
  diff = ((diff + Math.PI) % (2 * Math.PI)) - Math.PI;
  return abs(diff);
}

function noScroll() {
  document.body.style.overflow = 'hidden';
}

function clearVisualNotes() {
  for (let i = 0; i < ellipses.length; i++) {
    ellipses[i].points = [];
  }
}

function clearNotes(turnOffPreset = true) {
  clearVisualNotes();

  // If clearing manually, and not as part of loadPresetSong
  if (turnOffPreset) {
    showPresetPoints = false;
    presetVisualPoints = [];
    presetButton.elt.src = 'images/presetbutton_inactive.jpg';
  }
}

function loadPresetSong() {
  clearNotes(false); // clear notes, but don't turn off preset flag

  showPresetPoints = !showPresetPoints;

  if (showPresetPoints) {
    presetVisualPoints = [];

    if (scaleMappings !== majorScale) {
      scaleMappings = majorScale;
      scaleButton.elt.src = 'images/major_icon.jpg';
    }

    presetVisualPoints = [
      { band: 2, angle: PI + PI/2 - 0.6 },
      { band: 2, angle: PI + PI/2 - 0.9 },
      { band: 3, angle: PI + PI/2 - 1.2 },
      { band: 4, angle: PI + PI/2 - 1.5 },
      { band: 4, angle: PI + PI/2 - 1.8 },
      { band: 3, angle: PI + PI/2 - 2.1 },
      { band: 2, angle: PI + PI/2 - 2.4 },
      { band: 1, angle: PI + PI/2 - 2.7 },
      { band: 0, angle: PI + PI/2 - 3.0 },
      { band: 0, angle: PI + PI/2 - 3.3 },
      { band: 1, angle: PI + PI/2 - 3.6 },
      { band: 2, angle: PI + PI/2 - 3.9 },
      { band: 2, angle: PI + PI/2 - 4.2 },
      { band: 1, angle: PI + PI/2 - 4.6 },
      { band: 1, angle: PI + PI/2 - 4.8 }
    ];

    presetButton.elt.src = 'images/presetbutton_active.jpg';
  } else {
    presetVisualPoints = [];
    presetButton.elt.src = 'images/presetbutton_inactive.jpg';
  }
}