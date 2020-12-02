'use strict';

// Video element where stream will be placed.
const localVideo = document.querySelector('video#current-video');

// Local stream that will be reproduced on the video.
let localStream;

let output = new MediaStream();
let mediaSource = new MediaSource();

mediaSource.addEventListener('sourceopen', handleSourceOpen, false);

let mediaRecorder;
let recordedBlobs;
let sourceBuffer;

let recordedVideo = document.querySelector('video#recorded');
let recordButton = document.querySelector('button#record');
let playButton = document.querySelector('button#play');
let downloadButton = document.querySelector('button#download');

recordButton.onclick = toggleRecording;
playButton.onclick = play;
downloadButton.onclick = download;

let isSecureOrigin = location.protocol === 'https:' || location.hostname === 'localhost';

if (!isSecureOrigin) {
  alert('getUserMedia() must be run from a secure origin: HTTPS or localhost.' + '\n\nChanging protocol to HTTPS');
  location.protocol = 'HTTPS';
}

let constraints = {
  audio: true,
  video: true
};

function handleSuccess(stream) {
  recordButton.disabled = false;
  console.log('getUserMedia() got stream : ', stream);
  window.stream = stream;
  // LocalVideo Stream
  console.log('LocalVideo Stream.');
  localStream = stream;
  localVideo.srcObject = localStream;
}

function handleError(error) {
  console.log('navigator.getUserMedia error : ', error);
}

navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);

function handleSourceOpen(event) {
  console.log('Mediasource opened');
  sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="VP9"');
  console.log('Source buffer:', sourceBuffer);
}

recordedVideo.addEventListener('error', function(ev) {
  console.error('MediaRecording.recordedMedia.error()');
  alert('Your browser can not play\n\n' + recordedVideo.src + '\n\n media clip. event : ' + JSON.stringify(ev));
}, true);

function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function handleStop(event) {
  console.log('Recorder stopped: ', event);
}

function toggleRecording() {
  if (recordButton.textContent === 'Start Recording') {
    startRecording();
  } else {
    stopRecording();
    recordButton.textContent = 'Start Recording';
    playButton.disabled = false;
    downloadButton.disabled = false;
  }
}

function startRecording() {
  recordedBlobs = [];
  var options = {mimeType: 'video/webm;codecs=VP9'};
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    console.log(options.mimeType + ' is not Supported');
    options = { mimeType: 'video/webm;codecs=VP9' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.log(options.mimeType + ' is not Supported');
      options = { mimeType: 'video/webm' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.log(options.mimeType + ' is not Supported');
        options = {mimeType: ''};
      }
    }
  }
  try{
    mediaRecorder = new MediaRecorder(window.stream, options);
  } catch (e) {
    console.error('Exception while creating MediaRecorder: ' + e);
    alert('Exception while creating MediaRecorder: ' + e + '. mimeType: ' + options.mimeType);
    return;
  }

  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
  recordButton.textContent = 'Stop Recording';
  playButton.disabled = true;
  downloadButton.disabled = true;
  mediaRecorder.onstop = handleStop;
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start(10); // collect 10ms of data
  console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
  mediaRecorder.stop();
  console.log('Recorded Blobs: ', recordedBlobs);
  recordedVideo.controls = true;
}

function play() {
  let superBuffer = new Blob(recordedBlobs, {type:'video/webm'});
  recordedVideo.src = window.URL.createObjectURL(superBuffer);
}

function download(){
  let blob = new Blob(recordedBlobs, {type:'video/webm'});
  let url = window.URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'test.webm';
  document.body.appendChild(a);
  a.click();
  setTimeout(function () {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}