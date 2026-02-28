const axios = require('axios');
const { parsePage } = require('./streekx-multimedia-parser');
const { supabase } = require('./streekx-database-client');

/**
 * Ye function data ko 'streekx_index' (Full Column Table) mein save karega.
 */
async function executeCrawl(url) {
    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'StreekxBot/1.0' },
            timeout: 12000 
        });

        const extracted = parsePage(response.data, url);

        // SABSE ZAROORI PART: Ye 'streekx_index' ko target kar raha hai
        const { error } = await supabase.from('streekx_index').upsert({
            url: url,
            domain: new URL(url).hostname,
            title: extracted.title || "No Title",
            meta_description: extracted.description || "",
            raw_content: response.data.substring(0, 35000), 
            favicon: extracted.favicon || "",
            og_image: extracted.og_image || "",
            images: extracted.images || [], 
            videos: extracted.videos || [], 
            outlinks_count: extracted.links ? extracted.links.length : 0 
        }, { onConflict: 'url' });

        if (error) {
            console.error(`[DB Error] ${url}:`, error.message);
        } else {
            console.log(`[Full Index Success] ${url}`);
        }
        
        return extracted.links || [];

    } catch (error) {
        console.error(`[Crawl Failed] ${url}: ${error.message}`);
        return [];
    }
}

module.exports = { executeCrawl };
