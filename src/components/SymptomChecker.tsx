import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../types";
import { Send, Sparkles, AlertTriangle, ArrowLeft, Mic, MicOff, Square, Loader2, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SymptomCheckerProps {
  onBack: () => void;
  language?: "en" | "hi";
}

export const SymptomChecker: React.FC<SymptomCheckerProps> = ({ onBack, language = "en" }) => {
  const isHindi = language === "hi";
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "ai",
      text: isHindi
        ? "नमस्ते! मैं हॉस्पिन का AI लक्षण सहायक हूँ। मुझे बताएं कि आप क्या लक्षण अनुभव कर रहे हैं, और मैं आपको संभावित कारणों और सही विशेषज्ञ डॉक्टरों के मार्गदर्शन में मदद करूंगा।"
        : "Hello! I am Hospyn's AI Symptom Assistant. Tell me what symptoms you are experiencing, and I'll help guide you to potential clinical causes and the correct specialists.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Audio recording & Speech-to-Text states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeSuccess, setTranscribeSuccess] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const liveTranscriptRef = useRef<string>("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const startRecording = async () => {
    setAudioError(null);
    setTranscribeSuccess(null);
    audioChunksRef.current = [];
    liveTranscriptRef.current = "";

    try {
      // 1. Initiate Web Speech API if supported for INSTANT live real-time typing
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = language === "hi" ? "hi-IN" : "en-US";

          const initialValue = inputValue;

          recognition.onresult = (event: any) => {
            let currentSpeech = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
              currentSpeech += event.results[i][0].transcript;
            }
            if (currentSpeech.trim()) {
              liveTranscriptRef.current = currentSpeech.trim();
              setInputValue(initialValue ? `${initialValue} ${currentSpeech.trim()}` : currentSpeech.trim());
            }
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (e) {
          console.log("Web Speech API note:", e);
        }
      }

      // 2. Initiate lightweight MediaRecorder with low bitrate (24kbps) for fast gemini-3.5-transcribe
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(isHindi ? "आपका ब्राउज़र ऑडियो रिकॉर्डिंग का समर्थन नहीं करता है।" : "Microphone access is not supported by your browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      let mimeType = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      }

      // Use low 24kbps audio bitrate for ultra-fast upload & processing
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType,
        audioBitsPerSecond: 24000
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
          mediaStreamRef.current = null;
        }
        transcribeAudioBlob(audioBlob);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      setAudioError(err.message || (isHindi ? "माइक एक्सेस की अनुमति दें।" : "Please grant microphone permissions to use voice input."));
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const transcribeAudioBlob = async (blob: Blob) => {
    // If live transcript or input text already captured speech, user has instant result
    const hasLiveText = liveTranscriptRef.current.trim().length > 0 || inputValue.trim().length > 0;

    if (hasLiveText) {
      setTranscribeSuccess(isHindi ? "आवाज को पाठ में सफलतापूर्वक बदला गया!" : "Speech transcribed into text!");
      setTimeout(() => setTranscribeSuccess(null), 3000);
    } else {
      setIsTranscribing(true);
    }
    setAudioError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;

        const response = await fetch("/api/ai/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType: blob.type || "audio/webm",
            language: language
          })
        });

        const data = await response.json();

        if (response.ok && data.text) {
          const transcribedText = data.text.trim();
          if (transcribedText) {
            // Refine input value if Gemini 3.5 Transcribe yields better accuracy or if no live text
            setInputValue(prev => {
              if (!prev || !hasLiveText) return transcribedText;
              return prev; // keep existing text if user already has text
            });
            setTranscribeSuccess(isHindi ? "ऑडियो को पाठ में बदला गया!" : "Speech transcribed into text!");
            setTimeout(() => setTranscribeSuccess(null), 3000);
          }
        } else if (!hasLiveText) {
          throw new Error(data.error || (isHindi ? "ऑडियो ट्रांसक्रिप्शन विफल रहा।" : "Could not transcribe audio."));
        }
        setIsTranscribing(false);
      };
    } catch (err: any) {
      console.error("Transcription error:", err);
      if (!hasLiveText) {
        setAudioError(err.message || (isHindi ? "ऑडियो रूपांतरण विफल रहा।" : "Failed to transcribe audio speech."));
      }
      setIsTranscribing(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || loading || isRecording) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "patient",
      text: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    const promptToSend = inputValue;
    setInputValue("");
    setLoading(false);
    setLoading(true);

    try {
      const response = await fetch("/api/ai/symptom-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          symptoms: promptToSend,
          language: language
        })
      });

      const data = await response.json();
      
      if (response.ok && data.text) {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: "ai",
            text: data.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        throw new Error(data.error || "Failed to fetch response");
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: "ai",
          text: `Error: ${err.message || "I experienced an error connecting to my servers. Please try again shortly."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 shadow-sm" id="symptom-checker-root">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white px-4 py-3 border-b border-slate-100" id="symptom-checker-header">
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-slate-50 rounded-full transition-colors" onClick={onBack} id="btn-back">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-blue-600 fill-blue-100" /> 
              {isHindi ? "AI लक्षण जांचकर्ता" : "AI Symptom Checker"}
            </h3>
            <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Gemini 3.5 Transcribe & Flash
            </span>
          </div>
        </div>
      </div>

      {/* Safety Warning */}
      <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-start gap-2 text-xs text-amber-800" id="safety-alert">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-tight">
          <strong>{isHindi ? "क्लिनिकल नोट:" : "Clinical Note:"}</strong>{" "}
          {isHindi 
            ? "यह लक्षण जांचकर्ता केवल शैक्षणिक मार्गदर्शन प्रदान करता है और डॉक्टर की सलाह का विकल्प नहीं है।" 
            : "This symptom checker provides educational guidance and is not a substitute for professional medical advice or emergency care."}
        </p>
      </div>

      {/* Message Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" id="symptom-chat-thread">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col max-w-[85%] ${m.sender === "patient" ? "ml-auto items-end" : "mr-auto items-start"}`}
          >
            <div
              className={`p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                m.sender === "patient"
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-white text-slate-800 border border-slate-100 rounded-tl-none markdown-body"
              }`}
            >
              {m.sender === "ai" ? (
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                </div>
              ) : (
                m.text
              )}
            </div>
            <span className="text-[9px] text-slate-400 font-bold mt-1 px-1">{m.timestamp}</span>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold pl-1" id="ai-loading">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            <span>{isHindi ? "लक्षणों का विश्लेषण किया जा रहा है..." : "Analyzing symptoms..."}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Speech Audio Status Banner */}
      {isRecording && (
        <div className="bg-red-50 border-t border-red-100 px-4 py-2.5 flex items-center justify-between text-xs text-red-700 animate-pulse" id="recording-status">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping"></span>
            <Mic className="w-4 h-4 text-red-600" />
            <span className="font-bold">
              {isHindi ? "बोलें... लक्षण रिकॉर्ड हो रहे हैं" : "Listening... Speak your symptoms"} ({formatTime(recordingSeconds)})
            </span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white font-semibold text-[11px] px-2.5 py-1 rounded-lg transition-colors shadow-sm"
            id="btn-stop-recording"
          >
            <Square className="w-3 h-3 fill-current" />
            {isHindi ? "रोकें एवं बदलें" : "Stop & Transcribe"}
          </button>
        </div>
      )}

      {isTranscribing && !inputValue.trim() && (
        <div className="bg-blue-50 border-t border-blue-100 px-4 py-2.5 flex items-center gap-2 text-xs text-blue-700" id="transcribing-status">
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          <span className="font-medium">
            {isHindi ? "Gemini 3.5 Transcribe आपकी आवाज़ को पाठ में बदल रहा है..." : "Gemini 3.5 Transcribe converting voice to text..."}
          </span>
        </div>
      )}

      {transcribeSuccess && (
        <div className="bg-emerald-50 border-t border-emerald-100 px-4 py-2 flex items-center gap-2 text-xs text-emerald-700" id="transcribe-success">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-medium">{transcribeSuccess}</span>
        </div>
      )}

      {audioError && (
        <div className="bg-rose-50 border-t border-rose-100 px-4 py-2 flex items-center gap-2 text-xs text-rose-700" id="transcribe-error">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span className="font-medium">{audioError}</span>
        </div>
      )}

      {/* Input bar with Voice Microhpone Button */}
      <form onSubmit={handleSendMessage} className="flex gap-2 p-3 bg-white border-t border-slate-100 items-center" id="symptom-input-form">
        <input
          type="text"
          className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          placeholder={isHindi ? "लक्षण लिखें या माइक बटन दबाकर बोलें..." : "Describe symptoms or click mic to speak..."}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={loading || isRecording || (isTranscribing && !inputValue.trim())}
          id="chat-input"
        />

        {/* Voice Input Microphone Button */}
        {isRecording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-xl transition-all shadow active:scale-95 animate-bounce"
            title={isHindi ? "रिकॉर्डिंग रोकें" : "Stop Recording"}
            id="btn-voice-recording-active"
          >
            <Square className="w-4 h-4 fill-white" />
          </button>
        ) : isTranscribing && !inputValue.trim() ? (
          <button
            type="button"
            disabled
            className="bg-blue-100 text-blue-600 p-2 rounded-xl transition-all opacity-80"
            id="btn-voice-transcribing"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            disabled={loading}
            className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-xl transition-all border border-blue-200 active:scale-95 disabled:opacity-50 flex items-center justify-center"
            title={isHindi ? "बोलकर लक्षण दर्ज करें" : "Speak symptoms with microphone"}
            id="btn-voice-mic"
          >
            <Mic className="w-4 h-4" />
          </button>
        )}

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl transition-all shadow active:scale-95 disabled:opacity-50"
          disabled={!inputValue.trim() || loading || isRecording}
          id="btn-send"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

