const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Analysis = require('../models/Analysis');

router.get('/', authMiddleware, async (req, res) => {
    try {
        const analyses = await Analysis
            .find({ userId: req.user.id })
            .populate('documentId', 'filename createdAt')
            .sort({ createdAt: -1 });

        // Keep only the most recent analysis per document
        const seenDocuments = new Set();
        const uniqueAnalyses = [];

        for (const analysis of analyses) {
            const docId = analysis.documentId?._id?.toString();
            if (docId && !seenDocuments.has(docId)) {
                seenDocuments.add(docId);
                uniqueAnalyses.push(analysis);
            }
        }

        res.json(uniqueAnalyses);
    } catch (err) {
        res.status(500).json({ error: 'Could not fetch history' });
    }
});

module.exports = router;