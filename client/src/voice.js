// Shared voice engine: kid-style TTS plus user-recorded custom voice slots

export const VOICE_SLOTS = [
  { id: "readSchedule", label: "Read Today's Schedule", script: "Here is your schedule for today. Let's see what you have planned!" },
  { id: "reminder", label: "Task Reminder", script: "It is time for your activity! Please tap 'I Did This' when you are finished." },
  { id: "taskComplete", label: "Task Completed", script: "Wonderful! You did it. Great job!" },
  { id: "checkin", label: "Check-in Sent", script: "All done! I have let your caregiver know that you are okay." },
  { id: "emergency", label: "Emergency Alert Sent", script: "Your caregiver has been notified and will check on you very soon." },
  { id: "recordingStart", label: "Recording Started", script: "Recording has started. Speak clearly, then tap stop when you are done." },
];

function pickKidVoice() {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const kidKeywords = ["child", "kid", "junior", "young"];
  const femaleKeywords = ["female", "girl", "samantha", "zira", "victoria", "karen", "moira", "tessa"];
  return (
    voices.find((v) => kidKeywords.some((k) => v.name.toLowerCase().includes(k))) ||
    voices.find((v) => femaleKeywords.some((k) => v.name.toLowerCase().includes(k))) ||
    voices.find((v) => v.lang.startsWith("en")) ||
    voices[0]
  );
}

export function speak(text) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.8;
    const kidVoice = pickKidVoice();
    if (kidVoice) utterance.voice = kidVoice;
    window.speechSynthesis.speak(utterance);
  }
}

if ("speechSynthesis" in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

export function playDataUrl(dataUrl) {
  const audio = new Audio(dataUrl);
  return audio.play();
}

export function getSlotRecording(slotId) {
  return localStorage.getItem(`sc_voice_slot_${slotId}`);
}

export function saveSlotRecording(slotId, dataUrl) {
  localStorage.setItem(`sc_voice_slot_${slotId}`, dataUrl);
}

export function deleteSlotRecording(slotId) {
  localStorage.removeItem(`sc_voice_slot_${slotId}`);
}

export function getTaskRecording(taskId) {
  return localStorage.getItem(`sc_voice_rec_${taskId}`);
}

export function saveTaskRecording(taskId, dataUrl) {
  localStorage.setItem(`sc_voice_rec_${taskId}`, dataUrl);
}

export function deleteTaskRecording(taskId) {
  localStorage.removeItem(`sc_voice_rec_${taskId}`);
}

// Plays the user's custom recording for this slot when present, else kid TTS
export function playVoice(slotId, fallbackText) {
  const rec = getSlotRecording(slotId);
  if (rec) {
    playDataUrl(rec).catch(() => speak(fallbackText));
  } else {
    speak(fallbackText);
  }
}
