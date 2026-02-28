const axios = require('axios');
const { parsePage } = require('./streekx-multimedia-parser');
const { isAllowed } = require('./streekx-robots-handler');
const { supabase } = require('./streekx-database-client');

async function executeCrawl(url, depth) {
    const allowed = await isAllowed(url);
    if (!allowed) return [];

    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'StreekxBot/1.0 (+https://streekx.com/bot)' },
            timeout: 10000
        });

        const extracted = parsePage(response.data, url);

        // Saving to the high-level Index table
        await supabase.from('streekx_index').upsert({
            url: url,
            domain: new URL(url).hostname,
            title: extracted.title,
            meta_description: extracted.description,
            raw_content: response.data.substring(0, 30000), 
            favicon: extracted.favicon,
            og_image: extracted.og_image,
            images: extracted.images,
            videos: extracted.videos,
            discovered_links: extracted.links,
            outlinks_count: extracted.links.length
        }, { onConflict: 'url' });

        console.log(`[Index Saved] ${url}`);
        return extracted.links;

    } catch (error) {
        console.error(`[Skip] ${url}: ${error.message}`);
        return [];
    }
}

module.exports = { executeCrawl };
