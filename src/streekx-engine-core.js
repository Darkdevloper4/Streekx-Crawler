const axios = require('axios');
const { parsePage } = require('./streekx-multimedia-parser');
const { isAllowed } = require('./streekx-robots-handler');
const { supabase } = require('./streekx-database-client');

async function executeCrawl(url, depth) {
    // 1. Check Robots.txt
    const allowed = await isAllowed(url);
    if (!allowed) return [];

    try {
        // 2. Fetch HTML directly (Independent)
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'StreekxBot/1.0' },
            timeout: 15000
        });

        // 3. Parse Data
        const extracted = parsePage(response.data, url);

        // 4. Save to Supabase
        await supabase.from('streekx_crawled_data').upsert({
            url: url,
            domain: new URL(url).hostname,
            title: extracted.title,
            meta_description: extracted.description,
            raw_content: response.data.substring(0, 50000), // Limit storage
            multimedia_data: { images: extracted.images, videos: extracted.videos },
            discovered_links: extracted.links,
            depth: depth
        }, { onConflict: 'url' });

        console.log(`[Success] Crawled: ${url}`);
        return extracted.links;

    } catch (error) {
        console.error(`[Failed] ${url}: ${error.message}`);
        return [];
    }
}

module.exports = { executeCrawl };

