let starting = null;
let ending = null;
(function initAudioRecorder() {
  // Encapsulate variables to prevent global scope pollution
  let mediaRecorder = null;
  let audioChunks = [];
  let audioStream = null;
  let isRecording = false; // Track recording state

  // Function to create the recorder UI
  function createRecorderUI(apiKeyAvailable) {
    // Create the recorder UI container
    const recorderContainer = document.createElement('div');
    recorderContainer.id = 'todoist-mic-recorder';
    
    
   
    makeContainerDraggable(recorderContainer);

    // Create the recording toggle button
    const recButton = document.createElement('button');
    recButton.id = 'recButton';
    recButton.classList.add('notRec'); // Initial state

      
  
    // Create status display
    const statusDisplay = document.createElement('div');
    statusDisplay.id = 'status';
    statusDisplay.textContent = 'Idle!';


    // Append elements to the container
    recorderContainer.appendChild(recButton);
    recorderContainer.appendChild(statusDisplay);


    // Append the container to the body
    document.body.appendChild(recorderContainer);
    if (!apiKeyAvailable) {
      recButton.style.display = 'none'; // Hide the recording button if API key is not available
      statusDisplay.textContent = 'API key not available. Recording disabled.';
  }
    // Create notification container
    const notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.style.position = 'absolute'; // adjust as needed
    notificationContainer.style.top = '0';
    notificationContainer.style.right = '0';
    notificationContainer.style.width = '300px';
    // You can set z-index, padding, etc., if desired

    notificationContainer.style.display = 'flex';
    notificationContainer.style.flexDirection = 'column-reverse';
    // Append it to the recorderContainer (or document.body)
    recorderContainer.appendChild(notificationContainer);

    // Return references to the UI elements
    return {
      recButton,
      statusDisplay,
      notificationContainer 
      
    };
  }

  // Function to update UI state
  function updateUI(isRecording, uiElements) {
    const { recButton, statusDisplay, transcriptBox, submitButton } = uiElements;
    if (isRecording) {
      statusDisplay.textContent = 'Rec..';
      recButton.classList.remove('notRec');
      recButton.classList.add('Rec');
      
    } else {
      // statusDisplay.textContent = 'Idle';
      recButton.classList.remove('Rec');
      recButton.classList.add('notRec');
     
    }
  }

  
  // Function to start recording
  async function startRecording(uiElements) {
    const { statusDisplay } = uiElements;
    try {
      statusDisplay.textContent = 'Accessing\n mic...';
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(audioStream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstart = () => {
        isRecording = true;
        updateUI(isRecording, uiElements);
        document.getElementById('todoist-mic-recorder').classList.add('forced-open');
      };

      mediaRecorder.onstop = async () => {
        starting = new Date();
        
        // console.log('Recording stopped.');
        handleRecordingStop(uiElements);
      };

      mediaRecorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      statusDisplay.textContent = `Error: ${error.message}`;
    }
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result;
            // Extract Base64 string from Data URL
            const base64 = dataUrl.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

  // Function to handle recording stop
  async function handleRecordingStop(uiElements) {
    const { statusDisplay } = uiElements;
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });

    if (!audioBlob) {
      console.error('audioBlob is null or undefined');
      return;
    }

    // console.log('audioBlob size:', audioBlob.size);
    // console.log("Current time:", new Date().toLocaleTimeString());
    // console.log("Sending the message to test Background script!");
    const base64Audio = await blobToBase64(audioBlob);
    chrome.runtime.sendMessage({ action: 'sendAudio', audioData: base64Audio })
      .then(response => {
        if (response) {

          const extractedActions = extractJson(response.actions);
  
          extractedActions.forEach(action => {
            performTodoistAction(action, uiElements);
          })
          
        } else {
          // console.log('No response received from background script.');
          return Promise.reject('No response received');
        }
      })
      .then(() => {
        uiElements.statusDisplay.textContent = "added";
        setTimeout(() => {
          uiElements.statusDisplay.textContent = "Idle!";
        }, 3000); // 3000 milliseconds = 3 seconds

        setTimeout(() => {
          document.getElementById('todoist-mic-recorder').classList.remove('forced-open');
        }, 5000); // 5000 milliseconds = 5 seconds
        
      })
      .catch(error => {
        console.error('Error processing actions:', error);
      });

    audioStream.getTracks().forEach((track) => track.stop());

    isRecording = false;
    updateUI(isRecording, uiElements);
  }

  // Function to stop recording
  function stopRecording(uiElements) {
    const { statusDisplay } = uiElements;
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      statusDisplay.textContent = 'Adding..';
      
    }
  }


function extractJson(response) {
    const jsonStart = response.indexOf("[");
    const jsonEnd = response.lastIndexOf("]");
    return JSON.parse(response.slice(jsonStart, jsonEnd + 1));
}

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
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

    
  }



  function getTodoistApiKey() {
    chrome.storage.sync.get(["todoistApiKey"], function(result) {
      API_KEY = result.todoistApiKey;
      apiKeyAvailable = false;
      // console.log("running");
      if (API_KEY) {
        // console.log("API Key found");
        apiKeyAvailable = true;
        const uiElements = createRecorderUI(apiKeyAvailable);
        setupRecording(uiElements); // Setup recording after UI has been initialized based on API key availability
      } else {
        // console.log("API Key not found");
        createRecorderUI(apiKeyAvailable); // API key is not available, disable recording functionality
      }
      // Initialize the recorder UI with the API key availability status
   
    });
  }
  getTodoistApiKey();
})();

// add the fetch instead of the actual library 



function performTodoistAction(action,uiElements) {
  function showSuccessNotification(message, uiElements) {
    const { notificationContainer } = uiElements;
  
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.backgroundColor = '#b19cd9'; // Light purple color
    notification.style.color = 'white';
    notification.style.margin = '5px';
    notification.style.padding = '10px'; // Adjusted padding for a squarer appearance
    notification.style.borderRadius = '8px'; // Adjusted for a squarer shape
    
    // Set initial opacity to 0
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 1s ease-in-out';
    // Append notification immediately, but it starts invisible
    notificationContainer.appendChild(notification);
  
    ending = new Date();
        // Calculate the difference in seconds
    let timeDifference = (ending - starting) / 1000;
    console.log(timeDifference)

    setTimeout(() => {
      notification.style.opacity = '1';
    }, 1);
  
    // After 4 seconds total, fade out over 1 second, then remove
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        notificationContainer.removeChild(notification);
      }, 1000);
    }, 4000);
  }
  const { statusDisplay } = uiElements;
  const url = 'https://api.todoist.com/rest/v2/tasks';
  // Prepare the request payload
  const payload = {
    content: action.content,
    due_string: action.due_string || "today",
    due_lang: action.due_lang
  };

  // console.log('Payload:', payload);

  // Make the fetch call
  fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    // console.log('Task created successfully:', data);
    // Add this line:
    showSuccessNotification(`"${payload.content}" created! Due: ${payload.due_string}`, uiElements);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
}

function makeContainerDraggable(container) {
  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;

  // Listen for mousedown on the entire container
  container.addEventListener('mousedown', (e) => {
    // If user clicked the red button, don't drag
    if (e.target.id === 'recButton') {
      return;
    }
    // container.classList.add('dragging');

    isDragging = true;
    offsetX = e.clientX - container.offsetLeft;
    offsetY = e.clientY - container.offsetTop;
    container.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    container.classList.remove('dragging');
    let newLeft = e.clientX - offsetX;
    let newTop = e.clientY - offsetY;

    // Constrain movement inside the viewport
    const maxLeft = window.innerWidth - container.offsetWidth;
    const maxTop = window.innerHeight - container.offsetHeight;

    newLeft = Math.min(Math.max(0, newLeft), maxLeft);
    newTop = Math.min(Math.max(0, newTop), maxTop);

    container.style.left = newLeft + 'px';
    container.style.top = newTop + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
        container.classList.remove('dragging'); // Ensure this line is added
        isDragging = false;
        container.style.cursor = 'grab';
    }
});
}
