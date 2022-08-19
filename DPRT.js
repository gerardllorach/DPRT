// import {initDPRT, drawDPRT, getTOT_DPRT, endDPRT} from './DPRT.js';
// import * as DPRT from './DPRT.js';

// Declare DPRT variables
let canvas;
let canvas2d;
let ctx;
let rootDiv;


// Ellipse variables
let ellipseEcc;// = 1.8; // Ellipse eccentricity (how elliptic-circular is it)
let ellipseRadius;// = 220; // Ellipse movement radius (how big is the ellipse movement)
let phaseRand = 2 * Math.PI * Math.random(); // Random start ellipse trajectory
const rCircle = 25; // Radius circle
let RPM = 3.4; // Revolutions per minute

// Inicial pause 
let once = false; // initial pause (3 sec delay - Kemper 2009)
let timePause = 3;
let tt = 0; // Time running
let time = 0; // Get app clock


// Output structure
const out = {};
out.isInCirc = []; // Is inside the circle
out.posMouse = []; // Mouse position
out.posCircle = []; // Center circle
out.tmst = []; // Timestamps


// Track mouse position
let xm, ym;
//onmousemove = (e) => {xm = e.clientX; ym = e.clientY;} // moved to the canvas





// Initialize variables
export function initDPRT(appClock, inRPM, inTimePause) {
  console.log("Start DPRT");
  // Input RPM
  RPM = inRPM || RPM;
  // Initial pause before starting audio
  timePause = inTimePause || timePause;
  once = false;
  // Randomize circle init point
  phaseRand = 2 * Math.PI * Math.random();

  // Hide current canvas (PIXI) a create a new one (2d canvas, not webgl)
  canvas = document.getElementsByTagName("canvas")[0];
  canvas2d = canvas.cloneNode(false);
  canvas.hidden = true;
  canvas.parentElement.appendChild(canvas2d);

  canvas2d.style.zIndex = 2;
  canvas2d.onmousemove = (e) => { xm = e.clientX; ym = e.clientY; };

  ctx = canvas2d.getContext("2d");

  //DPRTClock.reset(); // clock
  time = appClock;//DPRTClock.getTime();//performance.now()/1000; // Get app clock


  // Clear out arrays
  resetOut();
}


// Draw circle and compute in/out circle
export function drawDPRT(appClock) {

  // Clear canvas
  ctx.clearRect(0, 0, canvas2d.width, canvas2d.height);

  // Timer
  tt = appClock - time;//DPRTClock.getTime() - time;

  // Initial pause (timePause)
  if (!once) {
    if (tt > timePause) {
      // START movement
      time = appClock; //DPRTClock.getTime();
      once = true;
      console.log("Start running ball");
    }
    tt = 0;
  }

  // Elliptic movement
  ellipseRadius = canvas2d.height / 2 * 0.75;
  ellipseEcc = canvas2d.width / canvas2d.height;
  // For painting
  let x = canvas2d.width / 2 + ellipseRadius * ellipseEcc * Math.cos(2 * Math.PI * tt * RPM / 60 + phaseRand);
  let y = canvas2d.height / 2 + ellipseRadius * Math.sin(2 * Math.PI * tt * RPM / 60 + phaseRand);

  // Mouse is inside or outside the circle
  let circColor;

  // Correct mouse position
  var rect = canvas2d.getBoundingClientRect(); // abs. size of element
  var scaleX = canvas2d.width / rect.width; // relationship bitmap vs. element for X
  var scaleY = canvas2d.height / rect.height; // relationship bitmap vs. element for Y

  let xmC = (xm - rect.left) * scaleX;
  let ymC = (ym - rect.top) * scaleY;

  let isInside = ((xmC - x) * (xmC - x) + (ymC - y) * (ymC - y)) <= (rCircle * rCircle);
  if (isInside)// this will set circle color based on mouse location relative to circle
    circColor = "rgb(0, 255, 0)"; //the mouse is inside the circle or on the perimeter,
  else // the mouse is outside the circle
    circColor = "rgb(255, 255, 255)";

  // If mouse is too far away from circle
  if (((xmC - x) * (xmC - x) + (ymC - y) * (ymC - y)) > (ellipseRadius * ellipseRadius)) {
    // Paint text
    ctx.fillStyle = "red";
    ctx.textAlign = "center";
    ctx.font = "30px Arial";
    ctx.fillText("Atention! You must follow the circle!", canvas2d.width / 2, canvas2d.height / 2 - 100);
  }


  // Keeps track of whether or not mouse is in circle
  if (once) {
    out.isInCirc.push(isInside);
    out.posMouse.push([xmC, ymC]);
    out.posCircle.push([x, y]);
    out.tmst.push(tt);
  }

  // Paint circle
  ctx.fillStyle = circColor;
  ctx.beginPath();
  ctx.arc(x, y, rCircle, 0, 2 * Math.PI);
  ctx.fill();
}


export function drawText(inText) {
  // Paint text
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.font = "30px Arial";
  ctx.fillText(inText, canvas2d.width / 2, canvas2d.height / 2);
}


// Returns Time On Target and resets out arrays
export function getTOT_DPRT() {

  // Calculate TOT
  let count = 0;
  for (let i = 0; i < out.isInCirc.length; ++i) {
    count += out.isInCirc[i] ? 1 : 0;
  }
  let TOT = 100 * count / out.isInCirc.length;

  // Reset out
  resetOut();

  return TOT;
}


// Empties arrays
export function resetOut() {
  out.isInCirc = []; // Is inside the circle
  out.posMouse = []; // Mouse position
  out.posCircle = []; // Center circle
  out.tmst = []; // Timestamps
}



// Restore app canvas
export function endDPRT() {
  console.log("End DPRT");
  //canvas2d.hidden = true;
  canvas2d.parentElement.removeChild(canvas2d);
  canvas.hidden = false;
}

/*


let dprtStep = 0; // 0-> silence playing; 1-> playing; 2 -> listening;

// Speech recognition
// TODO: MOVE INTO MAIN CONTEXT
window.SpeechRecognition = (window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition);
if (window.SpeechRecognition == undefined){
  alert("Speech Recognition API not supported. Please use Google Chrome.");
}
const recognition = new window.SpeechRecognition();

recognition.lang = 'es';
recognition.interimResults = false;
recognition.maxAlternatives = 5;

recognition.onresult = function(event) {
    console.log('You said: ', event.results[0][0].transcript);
    console.log(event);
    dprtStep = 3;
};



// Draw circle and track mouse
    drawDPRT();

    // Play audios control
    sentenceT = DPRTClock.getTime() - sentenceTimer;
    switch (dprtStep){
      case 0: // Playing initial silence
        if (sentenceT > timeBefore){ // wait until silence finishes
          dprtStep = 3;
        }
        break;
      case 1: // Playing audio
        if (sentenceT > audioBuffers[audioCurrentIndex].duration + timeStartBeepToSentence){ // wait until sentence finishes
          audioCurrentIndex++;
          dprtStep = 2;
          console.log("End of audio. SPEAK NOW");
          recognition.start();
          // TODO: SPEECH RECOGNTION, show mic button?
          // TODO: store values of sentences in out
          // End DPRT task when audios have been played
          if (audioCurrentIndex == audioSources.length){
            continueRoutine = false;
            console.log("All sentences played!");
          }
        }
        break;
      case 2: // Listening/Replying
        // TODO: SPEECH RECOGNITION
        // Force end if not replying
        if (sentenceT > audioBuffers[audioCurrentIndex].duration + timeStartBeepToSentence + timeAfter){
          console.log("Forced end of speech recognizer");
          // TODO get speechrecognition interim results
          recognition.stop();
        }
        break;
      case 3: // Replyied
        console.log("Starting audio " + audioCurrentIndex + ". Duration: " + audioBuffers[audioCurrentIndex].duration);
        audioSources[audioCurrentIndex].start();
        sentenceTimer = DPRTClock.getTime();
        dprtStep = 1;
       break;
    }*/
