// https://gitlab.pavlovia.org/tbthomas/dualtask_wm_mem/blob/master/html/DPRT.js

import * as DPRT from './DPRT.js';


/********************************************/

// Results
let listeningTOT = [];
let replyingTOT = [];
let recognitionResults = [];


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
	recognition.lang = 'es';
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
		console.error(event);
		recognition.result1 = "Error, recognition did not work."
		recognition.result2 = "Error, recognition did not work."
		recognition.hasRecognized = true;
	}
}
initRecognition();
recognition.start();
setTimeout(() => {
	recognition.abort()
}, 2000);


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

let audioSources = [{
	url: "audioFiles/List1_FA_102.wav",
	source: audioCtx.createBufferSource(),
}, {
	url: "audioFiles/List1_NA_52.wav",
	source: audioCtx.createBufferSource(),
}, {
	url: "audioFiles/List1_RA_91.wav",
	source: audioCtx.createBufferSource(),
}
];

for (let i = 0; i < audioSources.length; i++){
	let url = audioSources[i].url;
	fetch(url)
		.then(res => res.arrayBuffer())
		.then(buffer => audioCtx.decodeAudioData(buffer))
		.then(audioBuffer => {
			audioSources[i].source.buffer = audioBuffer;
			audioSources[i].duration = audioBuffer.duration;
			audioSources[i].source.connect(audioCtx.destination);
			audioSources[i].isPlaying = false;
			audioSources[i].onended = () => { audioSources[i].isPlaying = false }; // WATCH OUT. WARNING, MAYBE DOESNT WORK
			console.log("Audio " + url + " loaded.")
		})
		.catch(e => console.error(e));
}



/********************************************/





// DPRT canvas
const DPRTCanvas = document.getElementsByTagName("canvas")[0];
DPRTCanvas.width = document.body.clientWidth;
DPRTCanvas.height = document.body.clientHeight;


const getTime = () => {
	return new Date().getTime()/1000;
}


let RPM = 3.4;
const timeLimitToRecognize = 15; // Speech recognition time scape

// Control variables
let stage = 0;
let phase = 0;
let initTime = getTime();
let localInitTime = getTime();
let audioIndex = 0;




// Loop
const update = () =>{
	// Time differential
	let dt = getTime()-initTime;
	let localdt = getTime() - localInitTime;

	// Stage 0
	switch(stage){
		// Click to start
		case 0:
			if (phase == 0){
				let firstMouseDownEvent = (e) =>{
					e.preventDefault();
					e.stopPropagation();
					stage++;
					phase = 0;
					//DPRTCanvas.removeEventListener("click", firstMouseDownEvent);
					let divEl = document.getElementById("startDiv");
					let sliderEl = divEl.querySelector("#sliderRPM");
					RPM = parseFloat(sliderEl.value);
					divEl.remove();
					localInitTime = getTime();
				}
				// Create div to setup experiment
				let divEl = document.createElement("div");
				divEl.id ="startDiv";
				divEl.innerHTML = `
				<h2>Dual task paradigm</h3>
				<h3>Listening and speaking effort using a Digital Pursuit Rotor Tracking (DPRT)</h3>
				<p>Instructions: follow the white ball with the mouse while you listen and repeat what you heard.</p>
				<p>Authors: Trisha Thomas, Gerard Llorach, Clara Martin and Sendy Caffarra. Code developed by Gerard Llorach</p>
				<p>Select the speed of the rotating ball (right-end is harder)</p>
				<input id="sliderRPM" type="range" min="2" max="10" value="3.4" step="0.1" class="slider" id="myRange">
				<button id="startButton">Start experiment</button>
				`;
				divEl.style.cssText += `position: absolute;
				color: white;
				align-items: center;
				justify-content: center;
				display: inline-flex;
				flex-direction: column;
				right: 30%;
				left: 30%;
				top: 20%;
					`

				let buttonEl = divEl.querySelector("#startButton");
				buttonEl.addEventListener("click", firstMouseDownEvent);
				document.body.append(divEl);

				phase++;

			} 
			break;
		// DPRT with listening and replying
		case 1:
			let timePaused = 3;
			
			if (phase==0){
				// Draw ball
				DPRT.initDPRT(getTime(), RPM, timePaused);
				phase ++;
			} 
			
			else if (phase == 1){
				// Draw DRPT
				DPRT.drawDPRT(getTime());
				// Draw instructions
				DPRT.drawText("Follow the circle. Starting in: " + (timePaused - localdt).toFixed(0));
				// Show next instructions
				if (localdt > timePaused){
					phase++;
					localInitTime = getTime();
				}
			} 
			
			else if (phase == 2) {
				// Draw DRPT
				DPRT.drawDPRT(getTime());
				// Start beep sound
				playBeep();
				phase++;
			} 

			else if (phase == 3){
				// Draw DRPT
				DPRT.drawDPRT(getTime());
				if (localdt >= timeBeforeStart) {
					phase++;
					DPRT.resetOut();
					localInitTime = getTime();
				}
			}
			
			else if (phase == 4) {
				// Draw DRPT
				DPRT.drawDPRT(getTime());
				// Play sentence
				audioSources[audioIndex].source.start();
				phase++;
			}

			else if (phase == 5){
				// Draw DRPT
				DPRT.drawDPRT(getTime());
				if (localdt >= audioSources[audioIndex].duration + 1) {
					phase++;
					let tot = DPRT.getTOT_DPRT();
					listeningTOT.push(tot.toFixed(0));
					localInitTime = getTime();
					replying = true;
					console.log("Sound ended. Starting speech recognition");
					recognition.start();
					recognition.hasRecognized = false;

				}
			}

			else if (phase == 6){
				// Draw DRPT
				DPRT.drawDPRT(getTime());
				// Repeat the sentence
				DPRT.drawText("Repeat the sentence now.");
				if (recognition.hasRecognized || localdt > timeLimitToRecognize){
					let tot = DPRT.getTOT_DPRT();
					replyingTOT.push(tot.toFixed(0));
					//recognitionResults.push([recognition.result1, recognition.result2]);
					recognitionResults.push(recognition.result1);
					replying = false;

					// Once all the audios have been played, go to the next phase
					if (audioIndex == audioSources.length - 1){
						phase++;
					} 
					// Go through all audios
					else {
						audioIndex++;
						phase = 2;
						localInitTime = getTime();
					}

					console.log(recognitionResults);
					console.log(replyingTOT);
					console.log(listeningTOT);
				}
			}

			else if (phase == 7){
				// End DPRT
				DPRT.endDPRT();
				// Reset phase and set stage
				stage = 2;
				phase = 0;
			}
		break;
		case 2:
			// Create div to show the results of the experiments
			let divEl = document.createElement("div");
			divEl.id = "startDiv";
			divEl.innerHTML = `
				<h2>Dual task paradigm</h3>
				<h3>Results</h3>
				<p>Listening TOT:</p>
				<p id="listeningTOT"></p>
				<p>Replying TOT:</p>
				<p id="replyingTOT"></p>
				<p>Speech recognition results:</p>
				<p id="speechRecResults"></p>
				`;
			divEl.style.cssText += `position: absolute;
				color: white;
				align-items: center;
				justify-content: center;
				display: inline-flex;
				flex-direction: column;
				right: 30%;
				left: 30%;
				top: 20%;
					`

			let listenEl = divEl.querySelector("#listeningTOT");
			let replyEl = divEl.querySelector("#replyingTOT");
			let speechRecEl = divEl.querySelector("#speechRecResults");

			listenEl.innerText = listeningTOT;
			listenEl.innerText = listenEl.innerText.replaceAll(",", "%, ");
			replyEl.innerText = replyingTOT;
			replyEl.innerText = replyEl.innerText.replaceAll(",", "%, ");
			speechRecEl.innerText = recognitionResults;
			speechRecEl.innerText = speechRecEl.innerText.replaceAll(",", "\n");

			document.body.append(divEl);
			document.body.style.overflow = "auto";

			stage = 3;
		case 3:


	}

	
	requestAnimationFrame(update);
}
update();






// When window loads or resizes
window.onresize = () => {
	DPRTCanvas.width = document.body.clientWidth;
	DPRTCanvas.height = document.document.clientHeight;

}