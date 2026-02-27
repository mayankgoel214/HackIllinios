class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.chunks = [];
    this.stream = null;
  }

  getMimeType() {
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus';
    if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
    if (MediaRecorder.isTypeSupported('audio/ogg')) return 'audio/ogg';
    return '';
  }

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = this.getMimeType();
    const options = mimeType ? { mimeType } : {};
    this.mediaRecorder = new MediaRecorder(this.stream, options);
    this.chunks = [];
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.mediaRecorder.start();
  }

  stop() {
    return new Promise((resolve) => {
      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(this.chunks, { type: mimeType });
        this.stream.getTracks().forEach((t) => t.stop());
        resolve(blob);
      };
      this.mediaRecorder.stop();
    });
  }

  async transcribe(blob) {
    const ext = blob.type.includes('mp4') ? 'audio.mp4' : 'audio.webm';
    const formData = new FormData();
    formData.append('audio', blob, ext);
    const response = await fetch('/api/whisper', { method: 'POST', body: formData });
    if (!response.ok) throw new Error('Transcription failed');
    const data = await response.json();
    return data.text;
  }
}
