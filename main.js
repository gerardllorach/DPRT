// https://gitlab.pavlovia.org/tbthomas/dualtask_wm_mem/blob/master/html/DPRT.js

import * as DPRT from './DPRT.js';



/********************************************/
// Speech recognition
const timeToReply = 10;
let replying = false;

window.SpeechRecognition = (window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition);
if (window.SpeechRecognition == undefined) {
	alert("Speech Recognition API not supported. Please use Google Chrome.");
}
var recognition = {};
recognition.hasRecognized = false;
function initRecognition() {
	console.log("Initializing recognition");
	recognition = new window.SpeechRecognition();
	recognition.lang = 'en';
	recognition.interimResults = false;
	recognition.maxAlternatives = 2;

	recognition.onresult = function (event) {
		recognition.result1 = event.results[0][0].transcript;
		if (event.results[0].length == 2)
			recognition.result2 = event.results[0][1].transcript;
		console.log('You said: ', event.results[0][0].transcript);
		console.log(event);
		recognition.hasRecognized = true;
	};

	recognition.onerror = function (event) {
		console.error('There has been an error with the speech recognition: ' + event.error + ". Please notify the researcher.");
	}
}

/********************************************/

// Speech reproduction
const timeBeforeStart = 1;

// Create Beep Signal
const timeBeep = 0.2;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const fs = audioCtx.sampleRate;
// Create beep (beep plus silence) and connect to AudioContext
const beepBuffer = audioCtx.createBuffer(1, fs * timeBeep, fs);
let beepChannel = beepBuffer.getChannelData(0);
for (let i = 0; i < fs * timeBeep; i++) {
	beepChannel[i] = 0.2 * Math.sin(2 * Math.PI * 440 * i / fs);
}

var beepSource = {};
beepSource.isPlaying = false;
function playBeep() {
	beepSource = audioCtx.createBufferSource();
	beepSource.buffer = beepBuffer;
	beepSource.connect(audioCtx.destination);
	beepSource.isPlaying = true;
	beepSource.onended = () => { beepSource.isPlaying = false };
	beepSource.start();
}


// Load audio signals


/********************************************/





// DPRT canvas
const DPRTCanvas = document.getElementsByTagName("canvas")[0];
DPRTCanvas.width = document.body.clientWidth;
DPRTCanvas.height = document.body.clientHeight;


const getTime = () => {
	return new Date().getTime()/1000;
}


const RPM = 3.4;
let stage = 0;
let phase = 0;
let initTime = getTime();
let localInitTime = getTime();
//initDPRT(getTime(), RPM);
//playBeep();

// Loop
const update = () =>{
	// Time differential
	let dt = getTime()-initTime;
	let localdt = getTime() - localInitTime;

	// Stage 0
	switch(stage){
		case 0:
			let timePaused = 2;
			
			if (phase==0){
				// Draw ball
				DPRT.initDPRT(getTime(), RPM, timePaused);
				phase ++;
			} 
			
			else if (phase == 1){
				// Draw DRPT
				DPRT.drawDPRT(getTime());
				// Draw instructions
				DPRT.drawText("Follow the circle." + (timePaused - dt).toFixed(1));
				// Show next instructions
				if (dt > timePaused){
					phase++;
					localInitTime = getTime();
				}
			} 
			
			else if (phase == 2) {
				// Draw DRPT
				DPRT.drawDPRT(getTime());
				// Start beep sound
				playBeep();
				if (timeBeforeStart >= localdt){
					phase++;
					DPRT.resetOut();
					localInitTime = getTime();
				}
			} 
			
			else if (phase == 3) {
				// Draw DRPT
				DPRT.drawDPRT(getTime());
				// Play sentence
				
			}
		break;
		case 1:

		case 2:

		case 3:


	}

	// Draw DRPT
	//drawDPRT(getTime());

	
	requestAnimationFrame(update);
}
update();










// When window loads or resizes
window.onresize = () => {
	DPRTCanvas.width = document.body.clientWidth;
	DPRTCanvas.height = document.document.clientHeight;

}