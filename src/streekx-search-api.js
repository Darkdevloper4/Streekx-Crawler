const express = require('express');
const { supabase } = require('./streekx-database-client');
const app = express();
const PORT = 3000;

app.use(express.json());

// Main Search Endpoint
// Example: http://localhost:3000/search?q=technology
app.get('/search', async (req, res) => {
    const query = req.query.q;

    if (!query) {
        return res.status(400).json({ error: "Search query is required" });
    }

    try {
        console.log(`[Streekx Search] User is searching for: ${query}`);

        // Supabase query to find matches in title, description, or content
        const { data, error } = await supabase
            .from('streekx_crawled_data')
            .select('url, title, meta_description, multimedia_data, created_at')
            .or(`title.ilike.%${query}%,meta_description.ilike.%${query}%,raw_content.ilike.%${query}%`)
            .limit(20); // Top 20 results

        if (error) throw error;

        res.json({
            status: "success",
            total_results: data.length,
            results: data.map(item => ({
                title: item.title || "No Title",
                link: item.url,
                description: item.meta_description || "No description available for this page.",
                thumbnail: item.multimedia_data.images[0] || null, // First image as thumbnail
                timestamp: item.created_at
            }))
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Image Search Endpoint
app.get('/images', async (req, res) => {
    const query = req.query.q;
    try {
        const { data, error } = await supabase
            .from('streekx_crawled_data')
            .select('multimedia_data, url')
            .ilike('title', `%${query}%`)
            .limit(30);

        if (error) throw error;

        // Flattening image arrays
        const allImages = data.flatMap(item => 
            item.multimedia_data.images.map(img => ({ url: img, source: item.url }))
        );

        res.json({ status: "success", images: allImages });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Streekx Search API is live at http://localhost:${PORT}`);
});

