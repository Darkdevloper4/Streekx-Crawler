const express = require('express');
const cors = require('cors');
const { supabase } = require('./streekx-database-client');
const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 1. ADVANCED MIDDLEWARE & SECURITY
// ==========================================
app.use(cors()); 
app.use(express.json());

// Aapki Unique Professional API Key
const STREEKX_API_KEY = "STX-PRO-2026-X99"; 

// Security Guard: Jo bina key ke access block karega
const authenticate = (req, res, next) => {
    const userKey = req.headers['x-api-key'];
    if (userKey === STREEKX_API_KEY) return next();
    return res.status(401).json({ 
        error: "Unauthorized", 
        message: "Access Denied: Invalid Streekx API Key." 
    });
};

// ==========================================
// 2. SEARCH ENDPOINTS (Full Multimedia Support)
// ==========================================

// A. Global Web Search (With Authority Ranking)
app.get('/api/v1/search', authenticate, async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: "Search query is required" });

    try {
        const { data, error } = await supabase
            .from('streekx_index')
            .select('url, title, meta_description, favicon, og_image, outlinks_count, created_at')
            .or(`title.ilike.%${query}%,meta_description.ilike.%${query}%,raw_content.ilike.%${query}%`)
            .order('outlinks_count', { ascending: false }) // Authority based ranking
            .limit(20);

        if (error) throw error;
        res.json({ status: "success", count: data.length, results: data });
    } catch (err) {
        res.status(500).json({ error: "Database Error", details: err.message });
    }
});

// B. Professional Image Search
app.get('/api/v1/images', authenticate, async (req, res) => {
    const query = req.query.q;
    try {
        const { data, error } = await supabase
            .from('streekx_index')
            .select('images, url, title')
            .ilike('title', `%${query}%`)
            .limit(40);

        if (error) throw error;
        
        // Formatting images for a clean Gallery UI
        const allImages = data.flatMap(item => 
            item.images.map(img => ({
                url: img.url,
                alt: img.alt || item.title,
                source: item.url
            }))
        );

        res.json({ status: "success", type: "images", results: allImages });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// C. Video Search endpoint
app.get('/api/v1/videos', authenticate, async (req, res) => {
    const query = req.query.q;
    try {
        const { data, error } = await supabase
            .from('streekx_index')
            .select('videos, url, title')
            .ilike('title', `%${query}%`)
            .limit(20);

        if (error) throw error;

        const allVideos = data.flatMap(item => 
            item.videos.map(v => ({
                video_url: v,
                title: item.title,
                source: item.url
            }))
        );

        res.json({ status: "success", type: "videos", results: allVideos });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 3. SYSTEM STATUS (Health Check)
// ==========================================
app.get('/status', (req, res) => {
    res.json({ status: "online", engine: "Streekx-V1-Professional", timestamp: new Date() });
});

// ==========================================
// 4. SERVER EXECUTION
// ==========================================
app.listen(PORT, () => {
    console.log(`
    ███████╗████████╗██████╗ ███████╗███████╗██╗  ██╗██╗  ██╗
    ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██╔════╝██║ ██╔╝╚██╗██╔╝
    ███████╗   ██║   ██████╔╝█████╗  █████╗  █████╔╝  ╚███╔╝ 
    ╚════██║   ██║   ██╔══██╗██╔══╝  ██╔══╝  ██╔═██╗  ██╔██╗ 
    ███████║   ██║   ██║  ██║███████╗███████╗██║  ██╗██╔╝ ██╗
    ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝
    
    🚀 STREEKX PROFESSIONAL API IS LIVE
    -------------------------------------------
    Global Endpoint : http://localhost:${PORT}/api/v1/search
    Access Key      : ${STREEKX_API_KEY}
    Status          : High-Performance / Secure
    -------------------------------------------
    `);
});
