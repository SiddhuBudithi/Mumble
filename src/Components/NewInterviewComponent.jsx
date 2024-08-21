import React, { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "./CSS/NewInterviewComponent.css";


const APP_ID = "0f3a24a0795741ff862526ab1f67398e";
const GOOGLE_TRANSLATE_API_KEY = "YOUR_GOOGLE_TRANSLATE_API_KEY";

const NewInterviewComponent = () => {
  const [localTracks, setLocalTracks] = useState([]);
  const [client, setClient] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState({});
  const [localScreenTracks, setLocalScreenTracks] = useState(null);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [userIdInDisplayFrame, setUserIdInDisplayFrame] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [translation, setTranslation] = useState([]);
  const [inputText, setInputText] = useState("");
  const [liveTranslation, setLiveTranslation] = useState("");

  const location = useLocation();
  const { uid, roomId, userName: displayName } = location.state || {};

  const chatInputRef = useRef(null);
  const streamsContainerRef = useRef(null);
  const displayFrameRef = useRef(null);

  const getLiveTranslation = async () => {
    try {
      const response = await fetch('https://api.example.com/translate', {
        method: 'GET', // or 'POST', depending on your API
        headers: {
          'Content-Type': 'application/json',
          // Add other necessary headers like authorization if needed
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.translation; // Adjust according to the structure of your response
      // return "This is a live translation caption"; 
    } catch (error) {
      console.error('Error fetching live translation:', error);
      return ''; // Return an empty string or handle the error accordingly
      
    }
  };

  useEffect(() => {
    const fetchLiveTranslation = async () => {
      const liveTranslationText = await getLiveTranslation();
      setLiveTranslation(liveTranslationText);
    };

    fetchLiveTranslation();

    const intervalId = setInterval(fetchLiveTranslation, 1000); // Poll every second

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!roomId || !uid || !displayName) {
      console.error("Room ID, UID, and Display Name are required");
      return;
    }

    const initClient = async () => {
      if (client) return;

      const rtcClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      setClient(rtcClient);

      rtcClient.on("connection-state-change", (curState, prevState) => {
        console.log(
          `Connection state changed from ${prevState} to ${curState}`
        );

        if (curState === "CONNECTED") {
          console.log(
            "Client successfully connected. Now joining the stream..."
          );
          joinStream(); // Ensure the stream is joined once the client is connected
        }
      });

      rtcClient.on("user-published", handleUserPublished);
      rtcClient.on("user-left", handleUserLeft);

      try {
        console.log("Joining channel with roomId:", roomId);
        await rtcClient.join(APP_ID, roomId, null, uid);
      } catch (error) {
        console.error("Failed to join the channel:", error);
      }
    };

    initClient();

    return () => {
      leaveStream();
    };
  }, [uid, roomId, client, setClient]);

  const joinStream = async () => {
    try {
      if (!client) {
        console.error(
          "Client not initialized. Please ensure the client is initialized before joining the stream."
        );
        return;
      }

      // Check if the client is already in a connecting or connected state
      if (
        client.connectionState === "CONNECTING" ||
        client.connectionState === "CONNECTED"
      ) {
        console.warn(
          "Client is already connecting or connected. Skipping join."
        );
        return;
      }

      console.log("Joining channel with APP_ID:", APP_ID);
      console.log("Room ID:", roomId);
      console.log("UID:", uid || "UID will be auto-assigned");

      // Attempt to join the Agora channel
      await client.join(APP_ID, roomId, null, null); // Let Agora auto-assign a UID
      console.log("Successfully joined channel:", roomId);

      // Create microphone and camera tracks
      const tracks = await AgoraRTC.createMicrophoneAndCameraTracks(
        {},
        {
          encoderConfig: {
            width: { min: 640, ideal: 1920, max: 1920 },
            height: { min: 480, ideal: 1080, max: 1080 },
          },
        }
      );

      if (tracks.length > 0) {
        setLocalTracks(tracks);
        const [micTrack, cameraTrack] = tracks;

        if (!micTrack || !cameraTrack) {
          console.error("Error: Microphone or Camera track not found!");
          return;
        }

        console.log("Camera track initialized:", cameraTrack);

        const player = `
          <div className="video__container" id="user-container-${uid}">
            <div className="video-player" id="user-${uid}" style="width: 100%; height: 100%;"></div>
          </div>
        `;

        streamsContainerRef.current.insertAdjacentHTML("beforeend", player);

        setTimeout(() => {
          if (document.getElementById(`user-${uid}`)) {
            cameraTrack.play(`user-${uid}`);
            console.log(`Playing video on element: user-${uid}`);
          } else {
            console.error("Video element not found or not yet rendered for user:", uid);
          }
        }, 100);

        await client.publish([micTrack, cameraTrack]);
        console.log("Successfully published the stream");
      } else {
        console.error("Error: No tracks were created!");
      }
    } catch (error) {
      console.error("Error joining stream:", error);
    }
  };

  const handleUserPublished = async (user, mediaType) => {
    try {
      setRemoteUsers((prevUsers) => ({ ...prevUsers, [user.uid]: user }));
      await client.subscribe(user, mediaType);

      if (!document.getElementById(`user-container-${user.uid}`)) {
        const player = `
                    <div className="video__container" id="user-container-${user.uid}">
                        <div className="video-player" id="user-${uid}" style="width: 100%; height: 100%; background: none;"></div>

                    </div>
                `;

        streamsContainerRef.current.insertAdjacentHTML("beforeend", player);

        document
          .getElementById(`user-container-${user.uid}`)
          .addEventListener("click", expandVideoFrame);
      }

      if (mediaType === "video") {
        user.videoTrack.play(`user-${user.uid}`);
      }

      if (mediaType === "audio") {
        user.audioTrack.play();
      }
    } catch (error) {
      console.error("Error handling user publication:", error);
    }
  };

  const handleUserLeft = (user) => {
    setRemoteUsers((prevUsers) => {
      const updatedUsers = { ...prevUsers };
      delete updatedUsers[user.uid];
      return updatedUsers;
    });

    const item = document.getElementById(`user-container-${user.uid}`);
    if (item) {
      item.remove();
    }

    if (user.uid === userIdInDisplayFrame) {
      displayFrameRef.current.style.display = null;
      const videoFrames = document.getElementsByClassName("video__container");
      for (let i = 0; i < videoFrames.length; i++) {
        videoFrames[i].style.height = "300px";
        videoFrames[i].style.width = "300px";
      }
    }
  };

  const expandVideoFrame = (e) => {
    const target = e.currentTarget;
    const isExpanded = target.classList.contains("expanded");

    if (isExpanded) {
      target.classList.remove("expanded");
      target.style.height = "300px";
      target.style.width = "300px";
    } else {
      target.classList.add("expanded");
      target.style.height = "100%";
      target.style.width = "100%";
      setUserIdInDisplayFrame(target.id.replace("user-container-", ""));
      displayFrameRef.current.style.display = "block";
    }
  };

  const toggleMic = async (e) => {
    let button = e.currentTarget;

    if (localTracks[0].muted) {
      await localTracks[0].setMuted(false);
      button.classList.add("active");
    } else {
      await localTracks[0].setMuted(true);
      button.classList.remove("active");
    }
  };

  const toggleCamera = async (e) => {
    let button = e.currentTarget;

    if (!localTracks[1]) {
      console.error("Camera track is not initialized.");
      return;
    }

    if (localTracks[1].muted) {
      await localTracks[1].setMuted(false);
      button.classList.add("active");
    } else {
      await localTracks[1].setMuted(true);
      button.classList.remove("active");
    }

    console.log("Camera muted state:", localTracks[1].muted); // Debug log
  };

  const toggleScreen = async (e) => {
    try {
      let screenButton = e.currentTarget;
      let cameraButton = document.getElementById("camera-btn");

      if (!sharingScreen) {
        setSharingScreen(true);
        screenButton.classList.add("active");
        cameraButton.classList.remove("active");
        cameraButton.style.display = "none";

        const screenTracks = await AgoraRTC.createScreenVideoTrack();
        setLocalScreenTracks(screenTracks);

        document.getElementById(`user-container-${uid}`).remove();
        displayFrameRef.current.style.display = "block";

        const player = `
                    <div className="video__container" id="user-container-${uid}">
                        <div className="video-player" id="user-${uid}"></div>
                    </div>
                `;
        displayFrameRef.current.insertAdjacentHTML("beforeend", player);
        document
          .getElementById(`user-container-${uid}`)
          .addEventListener("click", expandVideoFrame);

        screenTracks.play(`user-${uid}`);

        await client.unpublish([localTracks[1]]);
        await client.publish([screenTracks]);

        const videoFrames = document.getElementsByClassName("video__container");
        for (let i = 0; i < videoFrames.length; i++) {
          if (videoFrames[i].id !== userIdInDisplayFrame) {
            videoFrames[i].style.height = "100px";
            videoFrames[i].style.width = "100px";
          }
        }
      } else {
        setSharingScreen(false);
        cameraButton.style.display = "block";
        document.getElementById(`user-container-${uid}`).remove();
        await client.unpublish([localScreenTracks]);
        switchToCamera();
      }
    } catch (error) {
      console.error("Error toggling screen share:", error);
    }
  };

  const switchToCamera = async () => {
    if (localScreenTracks) {
      localScreenTracks.stop();
      localScreenTracks.close();
      setLocalScreenTracks(null);

      const [microphoneTrack, cameraTrack] =
        await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalTracks([microphoneTrack, cameraTrack]);
      await client.publish([cameraTrack, microphoneTrack]);

      const videoFrames = document.getElementsByClassName("video__container");
      for (let i = 0; i < videoFrames.length; i++) {
        if (videoFrames[i].id !== `user-container-${uid}`) {
          videoFrames[i].style.height = "300px";
          videoFrames[i].style.width = "300px";
        }
      }
    }
  };

  const leaveStream = async (e) => {
    // e.preventDefault();

    try {
      document.getElementById("join-btn").style.display = "block";
      document.getElementsByClassName("stream__actions")[0].style.display =
        "none";

      localTracks.forEach((track) => {
        track.stop();
        track.close();
      });

      await client.unpublish(localTracks);

      if (localScreenTracks) {
        await client.unpublish([localScreenTracks]);
      }

      document.getElementById(`user-container-${uid}`).remove();

      // channel.sendMessage({ text: JSON.stringify({ type: "user_left", uid }) });

      // If you have a channel object, replace `channel` with the appropriate reference
      // channel.sendMessage({ text: JSON.stringify({ type: "user_left", uid }) });
    } catch (error) {
      console.error("Error leaving stream:", error);
    }
  };

  const handleSendMessage = () => {
    if (inputText.trim()) {
      const newMessage = { text: inputText, sender: "self" };
      const translatedMessage = translateMessage(inputText, "targetLang"); // Translate to targetLang

      setChatMessages([...chatMessages, newMessage]);
      setTranslation([...translation, translatedMessage]);
      setInputText("");
    }
  };

    const translateMessage = async (text, targetLang) => {
      try {
        const response = await axios.post(
          `https://translation.googleapis.com/language/translate/v2`,
          {
            q: text,
            target: targetLang,
            key: GOOGLE_TRANSLATE_API_KEY,
          }
        );

        const translatedText = response.data.data.translations[0].translatedText;
        return translatedText;
      } catch (error) {
        console.error("Error translating message:", error);
        return text; // Return original text if translation fails
      }
    };

    const toggleTranslation = async () => {
      const translated = await Promise.all(
        chatMessages.map(async (msg) => {
          const translatedText = await translateMessage(msg.text, "en");
          return { ...msg, text: translatedText };
        })
      );

      setTranslation(translated);
    };

  // const translateMessage = (text, targetLang) => {
  //   const translations = {
  //     Hello: "こんにちは",
  //     こんにちは: "Hello",
  //     "How are you?": "お元気ですか？",
  //     "お元気ですか？": "How are you?",
  //   };

  //   return translations[text] || text;
  // };

  // const toggleTranslation = () => {
  //   const translated = chatMessages.map((msg) => {
  //     return {
  //       ...msg,
  //       text: translateMessage(msg.text, "en"),
  //     };
  //   });

  //   setTranslation(translated);
  // };

  return (
    <div className="interview-container">
      <div className="interview-main-panel">
        <h2>New Interview</h2>

        <div className="video-container">
          <div className="video__container" ref={streamsContainerRef}></div>
          <div
            className="video__container"
            ref={displayFrameRef}
            style={{ display: "none" }}
          ></div>

          <div
            id="display-frame"
            ref={displayFrameRef}
            className="video__container"
          ></div>
        </div>

        <div className="live-translate-panel">
          <h4>Translation Results</h4>
          <div className="live-translation">
            <p>{liveTranslation}</p>
          </div>
        </div>

        <div className="checklist-section">
          <h4>CheckList</h4>
          <div className="checklist-item">
            <input type="checkbox" id="name1" />
            <label htmlFor="name1">
              Confirm name
              <br />
              <span>Tarou Yamada</span>
            </label>
            <button className="edit-btn">✏️</button>
          </div>
          <div className="checklist-item">
            <input type="checkbox" id="faculty1" />
            <label htmlFor="faculty1">
              Confirm Faculty
              <br />
              <span>computer science</span>
            </label>
            <button className="edit-btn">✏️</button>
          </div>
        </div>

        <div className="stream__actions" >
          <button id="camera-btn" className="active" onClick={toggleCamera}>
            Toggle Camera
          </button>
          <button id="mic-btn" className="active" onClick={toggleMic}>
            Toggle Mic
          </button>
          <button id="screen-btn" onClick={toggleScreen}>
            Toggle Screen
          </button>
          <button id="leave-btn" onClick={leaveStream}>
            Leave
          </button>
          <button id="joi-btn" onClick={joinStream}>
            Join
          </button>
        </div>
      </div>

      <div className="interview-chat-panel">
        <div className="tabs">
          <div className="trans-tab">
            <h3>Translation</h3>
            <div className="translation-resultss">
              {translation.map((msg, index) => (
                <div key={index} className="translation-text">
                  {msg}
                </div>
              ))}
            </div>
          </div>
          <div className="chat-tab">
            <h3>Chat</h3>
            <div className="chat-content">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`chat-bubble ${msg.sender}`}>
                  {msg.text}
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input
                type="text"
                placeholder="Enter text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                ref={chatInputRef}
              />
              <button className="send-btn" onClick={handleSendMessage}>
                ➤
              </button>
              <button className="translate-btn" onClick={toggleTranslation}>
                🌐 Translate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewInterviewComponent;
