// Get the HTML element with the ID 'webcam-feed-container'
const webcamFeedContainer = document.getElementById('webcam-feed-container');

// Declare a variable to store an access token
let accessToken;

// Define an async function named 'startRoom'
const startRoom = async () => {
  // Define a room name
  const roomName = 'myRoom';

  // Use the fetch function to send a POST request to '/join-room'
  const response = await fetch('/join-room', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ roomName }),
  });

  // Extract the 'token' from the JSON response
  const { token } = await response.json();

  // Store the extracted token in the 'accessToken' variable
  accessToken = token;

  // Call the 'joinVideoRoom' function with room name and token
  const room = await joinVideoRoom(roomName, token);

  // Call 'handleConnectedParticipant' with the local participant of the room
  handleConnectedParticipant(room.localParticipant);

  // Iterate through all participants and call 'handleConnectedParticipant' for each
  room.participants.forEach(handleConnectedParticipant);

  // Set up an event listener for when a new participant connects
  room.on('participantConnected', handleConnectedParticipant);

  // Set up an event listener for when a participant disconnects
  room.on('participantDisconnected', handleDisconnectedParticipant);

  // Add event listeners to disconnect from the room when the page is hidden or unloaded
  window.addEventListener('pagehide', () => room.disconnect());
  window.addEventListener('beforeunload', () => room.disconnect());
};

// Define an async function named 'joinVideoRoom'
const joinVideoRoom = async (roomName, token) => {
  try {
    // Connect to a video room using Twilio.Video.connect
    const room = await Twilio.Video.connect(token, {
      room: roomName,
    });

    // Return the connected room
    return room;
  } catch (error) {
    // Handle any errors by logging them
    console.log('error', error);
  }
};

// Define a function to handle connected participants
const handleConnectedParticipant = async (participant) => {
  // Create a new <div> element for the participant's video feed
  const participantDiv = document.createElement('div');
  participantDiv.setAttribute('class', 'participantDiv mt-2');
  participantDiv.setAttribute('id', participant.identity);

  // Append the <div> element to the webcam feed container
  webcamFeedContainer.appendChild(participantDiv);

  // Iterate through the participant's tracks and handle each track publication
  participant.tracks.forEach((trackPublication) => {
    handleTrackPublication(trackPublication, participant);
  });

  // Set up an event listener for when a track is published
  participant.on('trackPublished', handleTrackPublication);
};

// Define a function to handle track publications
const handleTrackPublication = (trackPublication, participant) => {
  // Define a function to display the track in the participant's <div> element
  function displayTrack(track) {
    const participantDiv = document.getElementById(participant.identity);
    participantDiv.append(track.attach());
  }

  // If the track publication has a track, display it
  if (trackPublication.track) {
    displayTrack(trackPublication.track);
  }

  // Set up an event listener for when the track is subscribed
  trackPublication.on('subscribed', displayTrack);
};

// Define a function to handle disconnected participants
const handleDisconnectedParticipant = (participant) => {
  // Remove all event listeners associated with the participant
  participant.removeAllListeners();

  // Remove the participant's <div> element from the container
  const participantDiv = document.getElementById(participant.identity);
  participantDiv.remove();
};

// Call the 'startRoom' function to begin the video conferencing setup
startRoom();
