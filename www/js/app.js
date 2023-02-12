//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var blobObj = {

}

var gumStream; 						//stream from getUserMedia()
var rec; 							//Recorder.js object
var input; 							//MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb. 
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext //audio context to help us record

var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");

//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);

const UUIDGeneratorBrowser = () =>
  ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  );
// console.log(UUIDGeneratorBrowser());

function startRecording() {
	console.log("recordButton clicked");
	stopButton.disabled = false;
	recordButton.disabled = true;
	/*
		Simple constraints object, for more advanced audio features see
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/
    
    var constraints = { audio: true, video:false }

 	/*
    	Disable the record button until we get a success or fail from getUserMedia() 
	*/

	// resetRecording()
	// pauseButton.disabled = false

	/*
    	We're using the standard promise based getUserMedia() 
    	https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	*/

	navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
		console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

		/*
			create an audio context after getUserMedia is called
			sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
			the sampleRate defaults to the one set in your OS for your playback device

		*/
		audioContext = new AudioContext();

		//update the format 
		document.getElementById("formats").innerHTML="Format: 1 channel pcm @ "+audioContext.sampleRate/1000+"kHz"

		/*  assign to gumStream for later use  */
		gumStream = stream;
		
		/* use the stream */
		input = audioContext.createMediaStreamSource(stream);

		/* 
			Create the Recorder object and configure to record mono sound (1 channel)
			Recording 2 channels  will double the file size
		*/
		rec = new Recorder(input,{numChannels:1})

		//start the recording process
		rec.record()

		console.log("Recording started");

	}).catch(function(err) {
		resetRecording()
	});
}

function stopRecording() {
	console.log("stopButton clicked");
	
	//disable the stop button, enable the record too allow for new recordings
	stopButton.disabled = true;
	recordButton.disabled = false;
	// pauseButton.disabled = true;
	// recordButton.disabled = true;

	//reset button just in case the recording is stopped while paused
	// pauseButton.innerHTML="Pause";
	
	//tell the recorder to stop the recording
	rec.stop();

	//stop microphone access
	gumStream.getAudioTracks()[0].stop();

	//create the wav blob and pass it on to createDownloadLink
	rec.exportWAV(createDownloadLink);
}
function htmlToElement(au, uuid) {
	var tr = document.createElement('tr');

	var td_id = document.createElement('td');

	var td_audio = document.createElement('td');

	var td_btn = document.createElement('td');
	

	var spch_btn = document.createElement('button');
	spch_btn.innerText = "Generate Speech"

	var span = document.createElement('span');
	span.innerHTML = uuid
	td_id.appendChild(span)
	td_audio.appendChild(au)
	td_btn.appendChild(spch_btn)


	tr.appendChild(td_id)
	tr.appendChild(td_audio)
	tr.appendChild(td_btn)

	
	td_btn.addEventListener("click",  function (e) {
		e.preventDefault();
		$("#overlay").fadeIn(300);
        saveRecording(blobObj[uuid], uuid)
		td_btn.disabled = true
	})

    return tr;
}

function createDownloadLink(blob) {
	var recId = UUIDGeneratorBrowser()
	var url = URL.createObjectURL(blob);
	var au = document.createElement('audio');
	var tbd = document.getElementById("tbd");
	au.controls = true;
	au.src = url;
	tbd.appendChild(htmlToElement(au, recId));
	blobObj[recId] = blob;
}

function saveRecording(audioBlob, name) {
	const formData = new FormData();
	formData.append('audio', audioBlob, name+'.wav');
	fetch('/upload', {
	  method: 'POST',
	  body: formData,
	})
	  .then((response) => response.json())
	  .then(() => {
		resetRecording();
		$("#overlay").fadeOut(300);
	  })
	  .catch((err) => {
		console.error(err);
		resetRecording();
		$("#overlay").fadeOut(300);
	  });
  }

var resetRecording = () => {
	console.log("resetRecording clicked");
	stopButton.disabled = true;
	recordButton.disabled = false;
	// pauseButton.disabled = true;
	// window.location.reload()
}