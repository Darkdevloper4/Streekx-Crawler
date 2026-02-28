const express = require('express');
const cors = require('cors'); // Replit se connect karne ke liye zaroori hai
const { supabase } = require('./streekx-database-client');
const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 1. SECURITY & CONFIGURATION
// ==========================================
app.use(cors()); // Isse aapka frontend (Replit) is API se baat kar payega
app.use(express.json());

// Ye aapki unique Professional API Key hai
const STREEKX_API_KEY = "STX-PRO-2026-X99"; 

// Middleware: Har request par key check karega
const verifyApiKey = (req, res, next) => {
    const userKey = req.headers['x-api-key'];
    if (userKey === STREEKX_API_KEY) {
        next();
    } else {
        res.status(401).json({ 
            error: "Unauthorized", 
            message: "Invalid or Missing Streekx API Key." 
        });
    }
};

// ==========================================
// 2. SEARCH ENDPOINTS (With Ranking)
// ==========================================

// A. Web Search (All Results)
app.get('/api/v1/search', verifyApiKey, async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: "Query is required" });

    try {
        const { data, error } = await supabase
            .from('streekx_index')
            .select('url, title, meta_description, favicon, og_image, outlinks_count')
            .or(`title.ilike.%${query}%,meta_description.ilike.%${query}%`)
            .order('outlinks_count', { ascending: false }) // Authority Ranking
            .limit(20);

        if (error) throw error;
        res.json({ source: "Streekx Engine", results: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// B. Image Search Filter
app.get('/api/v1/images', verifyApiKey, async (req, res) => {
    const query = req.query.q;
    try {
        const { data, error } = await supabase
            .from('streekx_index')
            .select('images, url, title')
            .ilike('title', `%${query}%`)
            .limit(30);

        if (error) throw error;
        const formattedImages = data.flatMap(item => 
            item.images.map(img => ({ url: img.url, alt: img.alt, origin: item.url }))
        );
        res.json({ type: "images", results: formattedImages });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// C. Video Search Filter
app.get('/api/v1/videos', verifyApiKey, async (req, res) => {
    const query = req.query.q;
    try {
        const { data, error } = await supabase
            .from('streekx_index')
            .select('videos, url, title')
            .ilike('title', `%${query}%`)
            .limit(15);

        if (error) throw error;
        const formattedVideos = data.flatMap(item => 
            item.videos.map(vid => ({ url: vid, title: item.title, origin: item.url }))
        );
        res.json({ type: "videos", results: formattedVideos });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 3. SERVER START
// ==========================================
app.listen(PORT, () => {
    console.log(`
    🚀 STREEKX PROFESSIONAL API IS LIVE
    ----------------------------------
    Endpoint: http://localhost:${PORT}/api/v1/search
    API Key:  ${STREEKX_API_KEY}
    Mode:     High-Performance
    `);
});
