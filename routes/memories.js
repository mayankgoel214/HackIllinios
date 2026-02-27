module.exports = function (app, supermemory) {
  // Add a memory
  app.post('/api/memories/add', async (req, res) => {
    try {
      const { content, type, metadata } = req.body;

      const result = await supermemory.add({
        content: content,
        containerTag: process.env.PATIENT_CONTAINER_TAG,
        metadata: {
          type: type || 'longterm',
          timestamp: new Date().toISOString(),
          ...metadata,
        },
      });

      res.json(result);
    } catch (error) {
      console.error('Memory add error:', error.message);
      res.status(500).json({ error: 'Failed to store memory' });
    }
  });

  // Search memories
  app.post('/api/memories/search', async (req, res) => {
    try {
      const { query, limit = 10 } = req.body;

      const results = await supermemory.search.execute({
        q: query,
        containerTag: process.env.PATIENT_CONTAINER_TAG,
        limit: limit,
        searchMode: 'hybrid',
      });

      res.json(results);
    } catch (error) {
      console.error('Memory search error:', error.message);
      res.status(500).json({ error: 'Search failed' });
    }
  });
};
