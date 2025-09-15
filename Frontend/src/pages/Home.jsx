import React, { useContext, useEffect, useRef, useState } from "react";
import { userDataContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import aiImg from "../assets/ai.gif";
import { CgMenuRight } from "react-icons/cg";
import { RxCross1 } from "react-icons/rx";
import userImg from "../assets/user.gif";

function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse } =
    useContext(userDataContext);
  const navigate = useNavigate();

  const [listening, setListening] = useState(false);
  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("");
  const [ham, setHam] = useState(false);

  const recognitionRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const synth = window.speechSynthesis;

  // ---------------- LOGOUT ----------------
  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true });
      setUserData(null);
      navigate("/signin");
    } catch (error) {
      setUserData(null);
      console.error(error);
    }
  };

  // ---------------- SPEECH ----------------
  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";

    const voices = synth.getVoices();
    const hindiVoice = voices.find((v) => v.lang === "hi-IN");
    if (hindiVoice) utterance.voice = hindiVoice;

    isSpeakingRef.current = true;
    utterance.onend = () => (isSpeakingRef.current = false);

    synth.cancel();
    synth.speak(utterance);
  };

  // ---------------- HANDLE COMMAND ----------------
  const handleCommand = (data) => {
    const { type, userInput, response } = data;
    speak(response);
    setAiText(response);

    const query = encodeURIComponent(userInput);
    switch (type) {
      case "google-search":
        window.open(`https://www.google.com/search?q=${query}`, "_blank");
        break;
      case "calculator-open":
        window.open("https://www.google.com/search?q=calculator", "_blank");
        break;
      case "instagram-open":
        window.open("https://www.instagram.com/`, '_blank");
        break;
      case "facebook-open":
        window.open("https://www.facebook.com/", "_blank");
        break;
      case "weather-show":
        window.open("https://www.google.com/search?q=weather", "_blank");
        break;
      case "youtube-search":
      case "youtube-play":
        window.open(`https://www.youtube.com/results?search_query=${query}`, "_blank");
        break;
      default:
        break;
    }
  };

  // ---------------- INITIALISE RECOGNITION ----------------
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false; // ⭐ push-to-talk, not continuous

    recognitionRef.current = recognition;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onerror = (e) =>
      console.warn("Recognition error:", e.error);

    recognition.onresult = async (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim();
      if (
        userData &&
        transcript.toLowerCase().includes(userData.assistantName.toLowerCase())
      ) {
        setUserText(transcript);
        setAiText("");
        const data = await getGeminiResponse(transcript);
        handleCommand(data);
        setUserText("");
      }
    };

    // Greeting once voices load
    const greet = () => {
      if (!userData) return;
      const u = new SpeechSynthesisUtterance(
        `Hello ${userData.name}, tap the mic and ask me something!`
      );
      u.lang = "hi-IN";
      synth.speak(u);
    };
    if (synth.getVoices().length === 0) synth.onvoiceschanged = greet;
    else greet();

    return () => {
      recognition.stop();
      synth.cancel();
    };
  }, [userData, getGeminiResponse]);

  // ---------------- BUTTON HANDLER ----------------
  const handleTalkClick = () => {
    if (!isSpeakingRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        if (e.name !== "InvalidStateError") console.error(e);
      }
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="w-full h-[100vh] bg-gradient-to-t from-[black] to-[#02023d] flex flex-col items-center justify-center gap-4 overflow-hidden relative">
      <CgMenuRight
        className="lg:hidden text-white absolute top-5 right-5 w-6 h-6"
        onClick={() => setHam(true)}
      />

      {/* Slide menu */}
      <div
        className={`absolute lg:hidden top-0 w-full h-full bg-[#00000053] backdrop-blur-lg p-5 flex flex-col gap-5 items-start ${
          ham ? "translate-x-0" : "translate-x-full"
        } transition-transform`}
      >
        <RxCross1
          className="text-white absolute top-5 right-5 w-6 h-6"
          onClick={() => setHam(false)}
        />
        <button
          className="min-w-[150px] h-[60px] text-black font-semibold bg-white rounded-full text-[19px]"
          onClick={handleLogOut}
        >
          Log Out
        </button>
        <button
          className="min-w-[150px] h-[60px] text-black font-semibold bg-white rounded-full text-[19px] px-5 py-2"
          onClick={() => navigate("/customize")}
        >
          Customize your Assistant
        </button>

        <div className="w-full h-px bg-gray-400"></div>
        <h1 className="text-white font-semibold text-[19px]">History</h1>
        <div className="w-full h-[400px] overflow-y-auto flex flex-col gap-2">
          {userData?.history?.map((his, i) => (
            <div key={i} className="text-gray-200 text-[18px] truncate">
              {his}
            </div>
          ))}
        </div>
      </div>

      {/* Desktop buttons */}
      <button
        className="hidden lg:block absolute top-5 right-5 min-w-[150px] h-[60px] text-black font-semibold bg-white rounded-full"
        onClick={handleLogOut}
      >
        Log Out
      </button>
      <button
        className="hidden lg:block absolute top-[100px] right-5 min-w-[150px] h-[60px] text-black font-semibold bg-white rounded-full px-5 py-2"
        onClick={() => navigate("/customize")}
      >
        Customize your Assistant
      </button>

      {/* Assistant card */}
      <div className="w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-4xl shadow-lg">
        <img
          src={userData?.assistantImage}
          alt=""
          className="h-full object-cover"
        />
      </div>

      <h1 className="text-white text-lg font-semibold">
        I'm {userData?.assistantName}
      </h1>

      {!aiText && <img src={userImg} alt="" className="w-[200px]" />}
      {aiText && <img src={aiImg} alt="" className="w-[200px]" />}

      <h1 className="text-white text-lg font-semibold text-center px-4">
        {userText || aiText}
      </h1>

      {/* ⭐ Push-to-talk mic button */}
      <button
        onClick={handleTalkClick}
        className={`mt-6 px-6 py-3 rounded-full font-semibold ${
          listening ? "bg-red-600 text-white" : "bg-white text-black"
        }`}
      >
        {listening ? "Listening..." : "🎤 Talk"}
      </button>
    </div>
  );
}

export default Home;
