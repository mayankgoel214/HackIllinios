const RECALL_SYSTEM_PROMPT = `You are a gentle, patient memory assistant for someone with Alzheimer's disease named Eleanor.

You have access to Eleanor's memories — both from her life history (long-term memories recorded by her family) and from recent conversations (short-term memories captured today).

Given the question and the relevant memories below, provide a warm, clear, simple answer.

Rules:
- Use short, simple sentences
- Be reassuring and kind
- Address Eleanor directly as "you" (e.g., "Your daughter Sarah lives in Chicago")
- If you find the same name or concept in both recent conversations AND life memories, explicitly note whether they appear to be the same person/thing or different ones. This cross-referencing is critical.
- If the memories don't contain enough information to answer, say so honestly but kindly
- Don't make up information that isn't in the provided memories
- When mentioning people, include their relationship to Eleanor if known
- Keep answers concise — 2-4 sentences is ideal

EMOTION AWARENESS — This is critical:
- If Eleanor sounds confused ("I don't know...", "Where am I?", "What's happening?"), start by REASSURING her: "It's okay, you're safe." Then answer.
- If Eleanor sounds scared or anxious ("I'm scared", "Who are you?", "Help"), be EXTRA gentle: "You're safe, everything is alright. Let me help you."
- If Eleanor sounds sad ("I miss...", "I'm alone"), be WARM and comforting: "You are so loved. Let me tell you about the people who care about you."
- If Eleanor sounds happy or curious, match her energy with warmth.
- Always ground her in something familiar — her home, her family, her routine — when she seems distressed.`;

const BRIEFING_SYSTEM_PROMPT = `You are Eleanor's gentle morning assistant. Create a warm, simple daily briefing.

Given today's date, her recent conversations (short-term memories), and her life context (long-term memories), create a brief morning update.

Format your response like this:
- Start with a warm greeting and today's date/day of week
- Mention any recent events from short-term memories (things that happened today or yesterday)
- Mention upcoming routine events (who visits when, regular activities)
- End with something comforting — a favorite activity she could do today

Keep it to 4-6 short sentences. Speak directly to Eleanor. Be warm and cheerful.`;

module.exports = function (app, openai, supermemory) {
  // --- "Remember This" endpoint ---
  app.post('/api/remember', async (req, res) => {
    try {
      const { content } = req.body;

      const result = await supermemory.add({
        content: `[${new Date().toLocaleTimeString()}] Eleanor said to remember: ${content}`,
        containerTag: process.env.PATIENT_CONTAINER_TAG,
        metadata: {
          type: 'shortterm',
          source: 'voice-command',
          timestamp: new Date().toISOString(),
        },
      });

      res.json({
        answer: `Got it! I'll remember that for you.`,
        stored: true,
        content: content,
      });
    } catch (error) {
      console.error('Remember error:', error.message);
      res.status(500).json({ error: 'Could not save memory' });
    }
  });

  // --- Daily Briefing endpoint ---
  app.post('/api/briefing', async (req, res) => {
    try {
      // Get recent short-term memories
      const recentResults = await supermemory.search.execute({
        q: 'what happened today recently conversation',
        containerTag: process.env.PATIENT_CONTAINER_TAG,
        limit: 5,
        searchMode: 'hybrid',
      });

      // Get routine/family info
      const routineResults = await supermemory.search.execute({
        q: 'daily routine visits schedule family',
        containerTag: process.env.PATIENT_CONTAINER_TAG,
        limit: 5,
        searchMode: 'hybrid',
      });

      const recentMemories = (recentResults.results || [])
        .map((r) => r.content || (r.chunks && r.chunks[0] && r.chunks[0].content) || '')
        .filter((m) => m);

      const routineMemories = (routineResults.results || [])
        .map((r) => r.content || (r.chunks && r.chunks[0] && r.chunks[0].content) || '')
        .filter((m) => m);

      const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: BRIEFING_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Today's date: ${today}\n\nRecent events:\n${recentMemories.join('\n')}\n\nEleanor's routine and family info:\n${routineMemories.join('\n')}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 400,
      });

      // Gather people/places for cards
      const peopleSet = new Set();
      const placesSet = new Set();
      [...(recentResults.results || []), ...(routineResults.results || [])].forEach((r) => {
        const meta = r.metadata || {};
        (meta.people || []).forEach((p) => peopleSet.add(p));
        (meta.places || []).forEach((p) => placesSet.add(p));
      });

      res.json({
        answer: completion.choices[0].message.content,
        memoriesUsed: [...recentMemories, ...routineMemories],
        people: [...peopleSet].filter((p) => p !== 'Eleanor'),
        places: [...placesSet],
      });
    } catch (error) {
      console.error('Briefing error:', error.message);
      res.status(500).json({ error: 'Briefing failed' });
    }
  });

  // --- Main Recall endpoint ---
  app.post('/api/recall', async (req, res) => {
    try {
      const { question } = req.body;

      // Search Supermemory for relevant memories
      const searchResults = await supermemory.search.execute({
        q: question,
        containerTag: process.env.PATIENT_CONTAINER_TAG,
        limit: 8,
        searchMode: 'hybrid',
      });

      const results = searchResults.results || [];

      const memories = results.map(
        (r) => r.content || (r.chunks && r.chunks[0] && r.chunks[0].content) || ''
      );

      // Extract people and places from metadata for AR cards
      const peopleSet = new Set();
      const placesSet = new Set();
      results.forEach((r) => {
        const meta = r.metadata || {};
        (meta.people || []).forEach((p) => peopleSet.add(p));
        (meta.places || []).forEach((p) => placesSet.add(p));
      });

      const memoriesContext = memories
        .filter((m) => m)
        .map((m, i) => `Memory ${i + 1}: ${m}`)
        .join('\n\n');

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: RECALL_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Relevant memories:\n${memoriesContext}\n\nEleanor's question: ${question}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 400,
      });

      res.json({
        answer: completion.choices[0].message.content,
        memoriesUsed: memories.filter((m) => m),
        people: [...peopleSet].filter((p) => p !== 'Eleanor'),
        places: [...placesSet],
      });
    } catch (error) {
      console.error('Recall error:', error.message);
      res.status(500).json({ error: 'Recall failed' });
    }
  });

  // --- Alerts endpoint (for caretaker dashboard) ---
  app.post('/api/alerts', async (req, res) => {
    try {
      // Search for concerning patterns in short-term memories
      const confusionResults = await supermemory.search.execute({
        q: 'confused where am I who are you scared don\'t know don\'t remember',
        containerTag: process.env.PATIENT_CONTAINER_TAG,
        limit: 10,
        searchMode: 'hybrid',
      });

      const results = confusionResults.results || [];
      const alerts = [];

      // Check for repeated similar questions
      const shortTermMemories = results.filter(
        (r) => r.metadata && r.metadata.type === 'shortterm'
      );

      if (shortTermMemories.length > 0) {
        // Count confusion indicators
        const confusionCount = shortTermMemories.filter((r) => {
          const content = (
            r.content ||
            (r.chunks && r.chunks[0] && r.chunks[0].content) ||
            ''
          ).toLowerCase();
          return (
            content.includes('where am i') ||
            content.includes("don't know") ||
            content.includes("don't remember") ||
            content.includes('who are you') ||
            content.includes('confused')
          );
        }).length;

        if (confusionCount >= 2) {
          alerts.push({
            type: 'confusion',
            severity: 'high',
            message: `Eleanor showed signs of confusion ${confusionCount} times recently`,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Check if Eleanor asked about location
      const locationResults = await supermemory.search.execute({
        q: 'where am I what is this place',
        containerTag: process.env.PATIENT_CONTAINER_TAG,
        limit: 5,
        searchMode: 'hybrid',
      });

      const locationQuestions = (locationResults.results || []).filter(
        (r) =>
          r.metadata &&
          r.metadata.source === 'voice-command' &&
          (r.content || '').toLowerCase().includes('where')
      );

      if (locationQuestions.length > 0) {
        alerts.push({
          type: 'disorientation',
          severity: 'medium',
          message: 'Eleanor asked about her location today',
          timestamp: new Date().toISOString(),
        });
      }

      // General activity summary
      const allShortTerm = results.filter(
        (r) => r.metadata && r.metadata.type === 'shortterm'
      );

      alerts.push({
        type: 'activity',
        severity: 'info',
        message: `${allShortTerm.length} conversations captured today`,
        timestamp: new Date().toISOString(),
      });

      res.json({ alerts });
    } catch (error) {
      console.error('Alerts error:', error.message);
      res.status(500).json({ error: 'Alerts failed' });
    }
  });
};
