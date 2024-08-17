import React, { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import "./CSS/NewInterviewComponent.css";

const APP_ID = "3c5bdbbea07141098c76dac3603f312e";

const NewInterviewComponent = ({ uid, displayName, roomId, client, setClient }) => {
    const [localTracks, setLocalTracks] = useState([]);
    const [remoteUsers, setRemoteUsers] = useState({});
    const [localScreenTracks, setLocalScreenTracks] = useState(null);
    const [sharingScreen, setSharingScreen] = useState(false);
    const [userIdInDisplayFrame, setUserIdInDisplayFrame] = useState(null);

    const streamsContainerRef = useRef(null);
    const displayFrameRef = useRef(null);

  useEffect(() => {
    const initClient = async () => {
      const rtcClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

      try {
        await rtcClient.join(APP_ID, roomId, null, uid); // Using null for UID to let Agora generate one
        rtcClient.on("user-published", handleUserPublished);
        rtcClient.on("user-left", handleUserLeft);
        setClient(rtcClient);
    } catch (error) {
        console.error("Failed to join the channel:", error);
    }
};

    initClient();

    return () => {
      leaveStream();
    };
  }, [uid, roomId, setClient, client]);

  const joinStream = async () => {
    try {
        const tracks = await AgoraRTC.createMicrophoneAndCameraTracks(
            {},
            {
                encoderConfig: {
                    width: { min: 640, ideal: 1920, max: 1920 },
                    height: { min: 480, ideal: 1080, max: 1080 },
                },
            }
        );

        setLocalTracks(tracks);

        const player = `
                <div className="video__container" id="user-container-${uid}">
                    <div className="video-player" id="user-${uid}"></div>
                </div>
            `;

        streamsContainerRef.current.insertAdjacentHTML("beforeend", player);
        document.getElementById(`user-container-${uid}`).addEventListener("click", expandVideoFrame);

        tracks[1].play(`user-${uid}`);
        await client.publish([tracks[0], tracks[1]]);
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
                        <div className="video-player" id="user-${user.uid}"></div>
                    </div>
                `;

            streamsContainerRef.current.insertAdjacentHTML("beforeend", player);
            document.getElementById(`user-container-${user.uid}`).addEventListener("click", expandVideoFrame);
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
        setUserIdInDisplayFrame(target.id.replace('user-container-', ''));
        displayFrameRef.current.style.display = "block";
    }
};

const toggleMic = async (e) => {
    try {
        let button = e.currentTarget;

        if (localTracks[0].muted) {
            await localTracks[0].setMuted(false);
            button.classList.add("active");
        } else {
            await localTracks[0].setMuted(true);
            button.classList.remove("active");
        }
    } catch (error) {
        console.error("Error toggling mic:", error);
    }
};

const toggleCamera = async (e) => {
    try {
        let button = e.currentTarget;

        if (localTracks[1].muted) {
            await localTracks[1].setMuted(false);
            button.classList.add("active");
        } else {
            await localTracks[1].setMuted(true);
            button.classList.remove("active");
        }
    } catch (error) {
        console.error("Error toggling camera:", error);
    }
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
            document.getElementById(`user-container-${uid}`).addEventListener("click", expandVideoFrame);

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

        const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
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
        document.getElementsByClassName("stream__actions")[0].style.display = "none";

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

  return (
    <div className="interview-container">
      <div className="interview-main-content">
        <h2>New Interview</h2>

        <div className="interview-conntainer">
            <div className="video__container" ref={streamsContainerRef}></div>
            <div className="video__container" ref={displayFrameRef} style={{ display: 'none' }}></div>
            <div className="stream__actions">
                <button id="mic-btn" onClick={toggleMic}>Toggle Mic</button>
                <button id="camera-btn" onClick={toggleCamera}>Toggle Camera</button>
                <button id="screen-btn" onClick={toggleScreen}>Toggle Screen</button>
                <button id="leave-btn" onClick={leaveStream}>Leave</button>
            </div>
            <div id="display-frame" ref={displayFrameRef} className="video__container"></div>
        </div>

        <div className="interview-header">
        <p className="translation-results">
            Translation Results, Translation Results, Translation Results,
            Translation Results, Translation Results.
          </p>
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
      </div>

      <div className="interview-chat-panel">
        <div className="tabs">
          <button className="tab active">Translation</button>
          <button className="tab">Chat</button>
        </div>
        <div className="chat-content">
          <div className="chat-bubble other">The other party's statement</div>
          <div className="chat-bubble self">Your statement</div>
        </div>
        <div className="chat-input">
          <input type="text" placeholder="Enter text" />
          <button className="send-btn">➤</button>
        </div>
      </div>
    </div>
  );
};

export default NewInterviewComponent;
