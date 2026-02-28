const express = require('express');
const { supabase } = require('./streekx-database-client');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 1. ALL SEARCH (Web Results + Multimedia Snippets)
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: "Search query required" });

    try {
        console.log(`[Streekx Search] Query: ${query}`);

        // Ranking Logic: Title match ko Content match se zyada priority deta hai
        const { data, error } = await supabase
            .from('streekx_index')
            .select(`
                url, title, meta_description, favicon, og_image, images, created_at
            `)
            .or(`title.ilike.%${query}%,meta_description.ilike.%${query}%,raw_content.ilike.%${query}%`)
            .order('outlinks_count', { ascending: false }) // Authority ranking
            .limit(20);

        if (error) throw error;

        res.json({
            status: "success",
            results: data.map(item => ({
                title: item.title,
                link: item.url,
                description: item.meta_description || "No description available.",
                favicon: item.favicon,
                thumbnail: item.og_image || (item.images[0] ? item.images[0].url : null),
                date: item.created_at
            }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. IMAGE SEARCH FILTER
app.get('/api/images', async (req, res) => {
    const query = req.query.q;
    try {
        const { data, error } = await supabase
            .from('streekx_index')
            .select('images, url, title')
            .ilike('title', `%${query}%`)
            .limit(40);

        if (error) throw error;

        // Extracting all images from JSONB
        const allImages = data.flatMap(item => 
            item.images.map(img => ({
                image_url: img.url,
                alt: img.alt || item.title,
                source_link: item.url
            }))
        );

        res.json({ status: "success", images: allImages });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. VIDEO SEARCH FILTER
app.get('/api/videos', async (req, res) => {
    const query = req.query.q;
    try {
        const { data, error } = await supabase
            .from('streekx_index')
            .select('videos, url, title, meta_description')
            .ilike('title', `%${query}%`)
            .limit(20);

        if (error) throw error;

        const allVideos = data.flatMap(item => 
            item.videos.map(v => ({
                video_url: v,
                title: item.title,
                source_link: item.url
            }))
        );

        res.json({ status: "success", videos: allVideos });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Streekx Search Engine API live at http://localhost:${PORT}`);
});
