// src/content/contentScript.js

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.action === 'requestMic') {
//       injectPermissionIframe()
//         .then(() => {
//           console.log('Iframe injected successfully.');
//           sendResponse({ success: true });
//         })
//         .catch((error) => {
//           console.error('Failed to inject iframe:', error);
//           sendResponse({ success: false });
//         });
//       // Return true to indicate that the response will be sent asynchronously
//       return true;
//     }
//   });
  
//   function injectPermissionIframe() {
//     return new Promise((resolve, reject) => {
//       // Prevent multiple iframes from being injected
//       if (document.getElementById('micPermissionIframe')) {
//         console.log('Permission iframe already exists.');
//         resolve();
//         return;
//       }
  
//       const iframe = document.createElement('iframe');
//       iframe.id = 'micPermissionIframe';
//       iframe.style.display = 'none';
//       iframe.setAttribute('allow', 'microphone');
//       iframe.src = chrome.runtime.getURL('src/permission/permission.html');
  
//       iframe.onload = () => {
//         console.log('Permission iframe loaded.');
//         resolve();
//       };
  
//       iframe.onerror = () => {
//         console.error('Error loading permission iframe.');
//         reject(new Error('Iframe failed to load.'));
//       };
  
//       document.body.appendChild(iframe);
//     });
//   }
  


// src/content/contentScript.js

let mediaRecorder;
let recordedChunks = [];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startRecording') {
    startRecording()
      .then(() => {
        console.log('Recording started successfully.');
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('Failed to start recording:', error);
        sendResponse({ success: false });
      });
    return true; // Keep the message channel open for sendResponse
  } else if (request.action === 'stopRecording') {
    stopRecording()
      .then((audioData) => {
        console.log('Recording stopped successfully.');
        sendResponse({ success: true, audioData: audioData });
      })
      .catch((error) => {
        console.error('Failed to stop recording:', error);
        sendResponse({ success: false });
      });
    return true; // Keep the message channel open for sendResponse
  }
});

async function startRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    console.log('Already recording.');
    return;
  }

  // Request microphone access
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  recordedChunks = [];

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.start();
}

function stopRecording() {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder || mediaRecorder.state !== 'recording') {
      reject(new Error('No recording in progress.'));
      return;
    }

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });

      // Read the Blob as a base64 data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result; // Data URL containing base64-encoded audio
        resolve(base64Data);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(audioBlob);
    };

    mediaRecorder.stop();
  });
}
