const axios = require('axios');
const { parsePage } = require('./streekx-multimedia-parser');
const { supabase } = require('./streekx-database-client');

/**
 * Ye function ek URL uthata hai, uska sara content/images nikalta hai 
 * aur use 'streekx_index' table mein 15+ columns ke saath save karta hai.
 */
async function executeCrawl(url) {
    try {
        // 1. Website ka raw HTML fetch karna
        const response = await axios.get(url, {
            headers: { 
                'User-Agent': 'StreekxBot/1.0 (+https://streekx.com/bot)',
                'Accept': 'text/html,application/xhtml+xml,xml;q=0.9'
            },
            timeout: 12000 // Thoda extra time badi sites ke liye
        });

        // 2. Multimedia Parser se Title, Images, aur Videos nikalna
        const extracted = parsePage(response.data, url);

        // 3. FULL DATA SAVING: Ye sabse zaroori part hai jo 'streekx_index' ko bharta hai
        const { error } = await supabase.from('streekx_index').upsert({
            url: url,
            domain: new URL(url).hostname,
            title: extracted.title || "No Title",
            meta_description: extracted.description || "",
            raw_content: response.data.substring(0, 40000), // Searchable text limit
            favicon: extracted.favicon || "",
            og_image: extracted.og_image || "",
            images: extracted.images || [], // JSON format for gallery
            videos: extracted.videos || [], // JSON format for video search
            discovered_links: extracted.links || [],
            outlinks_count: extracted.links ? extracted.links.length : 0 // Ranking power
        }, { onConflict: 'url' });

        if (error) {
            console.error(`[DB Error] Failed to save ${url}:`, error.message);
        } else {
            console.log(`[Success] Full Index Saved: ${url}`);
        }
        
        // Naye links return karna taki crawler aage badh sake
        return extracted.links || [];

    } catch (error) {
        console.error(`[Crawl Failed] ${url}: ${error.message}`);
        return [];
    }
}

module.exports = { executeCrawl };
