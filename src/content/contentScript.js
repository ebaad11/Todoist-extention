chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'requestMic') {
    requestMicrophoneAccess()
      .then(() => {
        console.log('Microphone access granted.');
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('Failed to get microphone access:', error);
        sendResponse({ success: false, error: error.message });
      });
    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
});

function requestMicrophoneAccess() {
  return navigator.mediaDevices.getUserMedia({ audio: true })
    .then((stream) => {
      // Stop all tracks to release the microphone
      stream.getTracks().forEach((track) => track.stop());
    });
}
