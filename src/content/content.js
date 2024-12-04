
console.log("loaded");

(function initAudioRecorder() {
  // Encapsulate variables to prevent global scope pollution
  let mediaRecorder = null;
  let audioChunks = [];
  let audioStream = null;
  let isRecording = false; // Track recording state
  let submitButton = null; // Submit button for sending transcript
  let transcript = null; // Global variable to store the transcript

  // Function to create the recorder UI
  function createRecorderUI() {
    // Create the recorder UI container
    const recorderContainer = document.createElement('div');
    recorderContainer.id = 'todoist-mic-recorder';

    // Create the recording toggle button
    const recButton = document.createElement('button');
    recButton.id = 'recButton';
    recButton.classList.add('notRec'); // Initial state

    // Create status display
    const statusDisplay = document.createElement('div');
    statusDisplay.id = 'status';
    statusDisplay.textContent = 'Idle';

    // Create transcript box
    const transcriptBox = document.createElement('textarea');
    transcriptBox.id = 'transcript-box';
    transcriptBox.placeholder = 'Transcript will appear here...';
    transcriptBox.disabled = true; // Initially disabled

    // Create submit button
    submitButton = document.createElement('button');
    submitButton.id = 'submitButton';
    submitButton.textContent = 'allons-y🎉';
    submitButton.style.display = 'none'; // Initially hidden
    submitButton.disabled = true; // Disabled until transcript is available

    // Append elements to the container
    recorderContainer.appendChild(recButton);
    recorderContainer.appendChild(statusDisplay);
    recorderContainer.appendChild(transcriptBox);
    recorderContainer.appendChild(submitButton);

    // Append the container to the body
    document.body.appendChild(recorderContainer);

    // Return references to the UI elements
    return {
      recButton,
      statusDisplay,
      transcriptBox,
      submitButton,
    };
  }

  // Function to update UI state
  function updateUI(isRecording, uiElements) {
    const { recButton, statusDisplay, transcriptBox, submitButton } = uiElements;
    if (isRecording) {
      statusDisplay.textContent = 'Recording...';
      recButton.classList.remove('notRec');
      recButton.classList.add('Rec');
      submitButton.style.display = 'none'; // Hide submit button while recording
    } else {
      statusDisplay.textContent = 'Idle';
      recButton.classList.remove('Rec');
      recButton.classList.add('notRec');
      if (transcript) {
        submitButton.disabled = false; // Enable submit button if transcript is available
      }
    }
  }

  // Function to handle submit button click
  function handleSubmitButtonClick() {
    console.log('Submitting the transcript...');
    if (transcript) {
      const workerUrl = "https://transcribe-audio-todoist.ebaadforrandomstuff.workers.dev?action=actions";
      fetch(workerUrl, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript: transcript }),
      })
      .then(response => response.json())
      .then(data => {
        try {
          const parsedData = JSON.parse(data.summary.replace(/```json|```/g, '').trim());
          parsedData.forEach(task => console.log(task));
        } catch (error) {
          console.error('Error parsing JSON:', error);
        }
      })
      .catch(error => console.error('Error:', error));
    } else {
      console.log('No transcript available to submit.');
    }
  }

  // Function to start recording
  async function startRecording(uiElements) {
    const { statusDisplay } = uiElements;
    try {
      statusDisplay.textContent = 'Requesting microphone access...';
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(audioStream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstart = () => {
        console.log('Recording started.');
        isRecording = true;
        updateUI(isRecording, uiElements);
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped.');
        handleRecordingStop(uiElements);
      };

      mediaRecorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      statusDisplay.textContent = `Error: ${error.message}`;
    }
  }

  // Function to handle recording stop
  async function handleRecordingStop(uiElements) {
    const { transcriptBox, submitButton } = uiElements;
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });

    if (!audioBlob) {
      console.error('audioBlob is null or undefined');
      return;
    }

    console.log('audioBlob size:', audioBlob.size);

    // Process the audioBlob (e.g., send to server)
    testCloudflareWorker(audioBlob)
      .then(result => {
        console.log('Transcription result:', result);
        transcript = result; // Store the transcript globally
        transcriptBox.value = result; // Populate the transcript box with the result
        transcriptBox.disabled = false; // Enable the transcript box
        submitButton.style.display = 'block'; // Show submit button after transcript is received
        submitButton.disabled = false; // Enable submit button
        updateUI(isRecording, uiElements); // Update UI
      })
      .catch(error => {
        console.error('Error:', error);
      });

    // Release microphone resources
    audioStream.getTracks().forEach((track) => track.stop());

    isRecording = false;
    updateUI(isRecording, uiElements);
  }

  // Function to stop recording
  function stopRecording(uiElements) {
    const { statusDisplay } = uiElements;
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      statusDisplay.textContent = 'Stopping recording...';
    }
  }

  // Function to set up recording functionality
  function setupRecording(uiElements) {
    const { recButton, submitButton } = uiElements;

    // Event listener for the recording button
    recButton.addEventListener('click', () => {
      if (isRecording) {
        stopRecording(uiElements);
      } else {
        startRecording(uiElements);
      }
    });

    // Event listener for the submit button
    submitButton.addEventListener('click', handleSubmitButtonClick);
  }

  // Function to test the Cloudflare Worker by sending a POST request
  const testCloudflareWorker = async (audioBlob) => {
    const workerUrl = "https://transcribe-audio-todoist.ebaadforrandomstuff.workers.dev?action=transcribe";
  
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "voice_file.wav");
  
      const response = await fetch(workerUrl, {
        method: "POST",
        body: formData,
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
      }
  
      const result = await response.json();
      return result.text || "No transcription received.";
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  // Initialize the recorder UI and set up recording
  const uiElements = createRecorderUI();
  setupRecording(uiElements);
})();
