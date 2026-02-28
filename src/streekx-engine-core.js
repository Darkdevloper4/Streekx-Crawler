const axios = require('axios');
const { parsePage } = require('./streekx-multimedia-parser');
const { isAllowed } = require('./streekx-robots-handler');
const { supabase } = require('./streekx-database-client');

async function executeCrawl(url, depth) {
    const allowed = await isAllowed(url);
    if (!allowed) return [];

    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'StreekxBot/1.0' },
            timeout: 15000
        });

        const extracted = parsePage(response.data, url);

        // DHAYAN SE: Table ka naam 'streekx_index' hona chahiye
        const { error } = await supabase.from('streekx_index').upsert({
            url: url,
            domain: new URL(url).hostname,
            title: extracted.title,
            meta_description: extracted.description,
            raw_content: response.data.substring(0, 50000), 
            favicon: extracted.favicon,
            og_image: extracted.og_image,
            images: extracted.images,
            videos: extracted.videos,
            discovered_links: extracted.links,
            outlinks_count: extracted.links.length
        }, { onConflict: 'url' });

        if (error) console.error("Database Save Error:", error.message);
        
        console.log(`[Success] Data Saved to Index: ${url}`);
        return extracted.links;

    } catch (error) {
        console.error(`[Failed] ${url}: ${error.message}`);
        return [];
    }
}

module.exports = { executeCrawl };
