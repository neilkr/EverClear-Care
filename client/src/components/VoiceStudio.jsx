import { useRef, useState } from "react";
import {
  VOICE_SLOTS,
  getSlotRecording,
  saveSlotRecording,
  deleteSlotRecording,
  playDataUrl,
} from "../voice.js";

export default function VoiceStudio({ onClose }) {
  const [recordingSlot, setRecordingSlot] = useState(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [, forceRefresh] = useState(0);

  async function toggleRecording(slotId) {
    if (recordingSlot === slotId) {
      recorderRef.current?.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Voice recording is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          saveSlotRecording(slotId, reader.result);
          forceRefresh((n) => n + 1);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
        setRecordingSlot(null);
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecordingSlot(slotId);
    } catch {
      alert("Microphone access is needed to record your voice.");
    }
  }

  return (
    <div className="voice-studio-overlay" onClick={onClose}>
      <div className="voice-studio-modal" onClick={(e) => e.stopPropagation()}>
        <div className="voice-studio-header">
          <h2>🎙️ My Voice Studio</h2>
          <button type="button" className="btn-text-action" onClick={onClose}>
            ✖ Close
          </button>
        </div>
        <p className="voice-studio-desc">
          Read each script out loud and record it in your own voice. From then on, the app will play
          your recordings everywhere it speaks.
        </p>
        <div className="voice-slot-list">
          {VOICE_SLOTS.map((slot) => {
            const recorded = !!getSlotRecording(slot.id);
            const isRecording = recordingSlot === slot.id;
            return (
              <div key={slot.id} className={`voice-slot-card ${recorded ? "recorded" : ""}`}>
                <div className="voice-slot-info">
                  <strong>{slot.label}</strong>
                  <p className="voice-slot-script">"{slot.script}"</p>
                </div>
                <div className="voice-slot-actions">
                  <button
                    type="button"
                    className={`btn-card-record ${isRecording ? "recording-active" : ""}`}
                    onClick={() => toggleRecording(slot.id)}
                  >
                    {isRecording ? "⏹️ Stop" : "🎙️ Record"}
                  </button>
                  {recorded && (
                    <>
                      <button
                        type="button"
                        className="btn-card-audio"
                        onClick={() => playDataUrl(getSlotRecording(slot.id))}
                      >
                        ▶️ Play
                      </button>
                      <button
                        type="button"
                        className="btn-card-delete"
                        onClick={() => {
                          deleteSlotRecording(slot.id);
                          forceRefresh((n) => n + 1);
                        }}
                        title="Delete this recording"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
