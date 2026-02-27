module.exports = function (app, supermemory) {
  // Get all memories for the constellation visualization
  app.get('/api/graph', async (req, res) => {
    try {
      // Search with a broad query to get all memories
      const results = await supermemory.search.execute({
        q: 'Eleanor life family memories places hobbies friends',
        containerTag: process.env.PATIENT_CONTAINER_TAG,
        limit: 30,
        searchMode: 'hybrid',
      });

      // Transform results into nodes and edges for visualization
      const nodes = [];
      const edges = [];
      const peopleMap = {};

      (results.results || []).forEach((doc, i) => {
        const content =
          doc.chunks && doc.chunks[0] ? doc.chunks[0].content : '';
        const metadata = doc.metadata || {};
        const category = metadata.category || 'general';
        const people = metadata.people || [];

        // Create a node for this memory
        nodes.push({
          id: doc.documentId || `node-${i}`,
          label: doc.title || content.substring(0, 40) + '...',
          content: content,
          category: category,
          people: people,
          places: metadata.places || [],
          emotions: metadata.emotions || [],
          dates: metadata.dates || [],
        });

        // Track people for creating connections
        people.forEach((person) => {
          if (!peopleMap[person]) peopleMap[person] = [];
          peopleMap[person].push(doc.documentId || `node-${i}`);
        });
      });

      // Create edges between memories that share people
      Object.values(peopleMap).forEach((nodeIds) => {
        for (let i = 0; i < nodeIds.length; i++) {
          for (let j = i + 1; j < nodeIds.length; j++) {
            const edgeId = `${nodeIds[i]}-${nodeIds[j]}`;
            if (!edges.find((e) => e.id === edgeId)) {
              edges.push({
                id: edgeId,
                source: nodeIds[i],
                target: nodeIds[j],
              });
            }
          }
        }
      });

      res.json({ nodes, edges });
    } catch (error) {
      console.error('Graph error:', error.message);
      res.status(500).json({ error: 'Failed to load memory graph' });
    }
  });
};
