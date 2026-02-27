const multer = require('multer');
const { toFile } = require('openai');
const upload = multer({ storage: multer.memoryStorage() });

module.exports = function (app, openai) {
  app.post('/api/whisper', upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No audio file provided' });
      }

      const file = await toFile(req.file.buffer, 'audio.webm', {
        type: req.file.mimetype || 'audio/webm',
      });

      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
      });

      res.json({ text: transcription.text });
    } catch (error) {
      console.error('Whisper error:', error.message);
      res.status(500).json({ error: 'Transcription failed' });
    }
  });
};
