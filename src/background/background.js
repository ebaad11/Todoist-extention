chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sendAudio') {
    const audioBlob = base64ToBlob(request.audioData);
    sendAudioToCloudflareWorker(audioBlob)
      .then((jsonResult) => {
        if (jsonResult) {
          // Send the combined data back
          sendResponse({
            status: 'success',
            transcript: jsonResult.transcript,
            actions: jsonResult.actions 
          });
        } else {
          sendResponse({
            status: 'failed',
            transcript: '',
            actions: ''
          });
        }
      })
      .catch(error => {
        sendResponse({ 
          status: `Error processing audio: ${error.message}`,
          transcript: '',
          actions: ''
        });
      });
    return true; 
  }
});


async function sendAudioToCloudflareWorker(audioData) {
  const workerUrl = "https://transcribe-audio-todoist.ebaadforrandomstuff.workers.dev?action=transcribe";
  try {
    if (!(audioData instanceof Blob)) {
      throw new TypeError("The provided value is not a Blob.");
    }
    const formData = new FormData();
    formData.append("file", audioData, "voice_file.wav");

    const response = await fetch(workerUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    // The worker now returns JSON that includes both transcript and actions
    const result = await response.json();

    // Return the entire object { transcript, actions }
    return result; 
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}



function base64ToBlob(base64) {
  const byteString = atob(base64.split(',')[1]);
  const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], {type: mimeString});
}



// The problem we're having is the JSON is not being able to query effectively. We need to fix that. Maybe come back and try to do a structured outputs out instead of just the basic ones. 