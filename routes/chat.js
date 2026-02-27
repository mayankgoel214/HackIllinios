const CHAT_SYSTEM_PROMPT = `You are a compassionate memory assistant helping a family member record memories about their loved one who has Alzheimer's disease.

When the user shares a memory, you should:
1. Acknowledge what they shared warmly and naturally
2. Ask a follow-up question to pull out more detail
3. Extract structured memories from what they said

You MUST respond in this exact JSON format:
{
  "reply": "Your warm, conversational response here",
  "memories": [
    {
      "content": "A complete, self-contained memory statement that could be understood without context",
      "metadata": {
        "people": ["names mentioned"],
        "places": ["places mentioned"],
        "dates": ["dates or time periods mentioned"],
        "emotions": ["emotional themes"],
        "relationships": ["relationship descriptions like 'daughter', 'best friend'"]
      }
    }
  ]
}

If the user's message doesn't contain a specific memory to store (like a greeting or question), set "memories" to an empty array.

Important:
- Each memory in the array should be a COMPLETE, standalone statement
- Include all relevant context in the memory content so it makes sense on its own
- Be warm and encouraging - this is an emotional process for families
- Ask specific follow-up questions: "Who else was there?", "What year was that?", "How did that make her feel?"`;

module.exports = function (app, openai, supermemory) {
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history = [] } = req.body;

      const messages = [
        { role: 'system', content: CHAT_SYSTEM_PROMPT },
        ...history.slice(-10),
        { role: 'user', content: message },
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      });

      let parsed;
      try {
        parsed = JSON.parse(completion.choices[0].message.content);
      } catch {
        // If JSON parsing fails, use raw text
        parsed = {
          reply: completion.choices[0].message.content,
          memories: [],
        };
      }

      // Store each extracted memory in Supermemory
      const stored = [];
      for (const mem of parsed.memories || []) {
        try {
          const result = await supermemory.add({
            content: mem.content,
            containerTag: process.env.PATIENT_CONTAINER_TAG,
            metadata: {
              type: 'longterm',
              source: 'caretaker',
              timestamp: new Date().toISOString(),
              ...mem.metadata,
            },
          });
          stored.push({ content: mem.content, id: result.id });
        } catch (err) {
          console.error('Failed to store memory:', err.message);
        }
      }

      res.json({ reply: parsed.reply, memoriesStored: stored });
    } catch (error) {
      console.error('Chat error:', error.message);
      res.status(500).json({ error: 'Chat failed' });
    }
  });
};
