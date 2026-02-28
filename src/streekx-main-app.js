const { executeCrawl } = require('./streekx-engine-core');
const { supabase } = require('./streekx-database-client');

const CONCURRENCY = 3; // Safe but fast parallel crawling

async function startStreekxEngine() {
    console.log("--- STREEKX POWER CRAWLER LIVE ---");
    
    while (true) {
        // Fetch fresh URLs from queue
        const { data: queue } = await supabase
            .from('streekx_crawl_queue')
            .select('url')
            .eq('is_crawled', false)
            .limit(CONCURRENCY);

        if (!queue || queue.length === 0) {
            console.log("Queue empty. Reseeding with Global News...");
            await supabase.from('streekx_crawl_queue').upsert([
                { url: 'https://www.bbc.com/news', is_crawled: false },
                { url: 'https://www.reuters.com', is_crawled: false },
                { url: 'https://news.google.com', is_crawled: false }
            ], { onConflict: 'url' });
            await new Promise(r => setTimeout(r, 5000));
            continue;
        }

        // Process URLs in Parallel
        await Promise.all(queue.map(async (item) => {
            const url = item.url;
            // Mark as crawled immediately
            await supabase.from('streekx_crawl_queue').update({ is_crawled: true }).eq('url', url);
            
            const newLinks = await executeCrawl(url, 1);

            // Add new discovered links to queue
            if (newLinks && newLinks.length > 0) {
                const batch = [...new Set(newLinks)].slice(0, 20).map(link => ({
                    url: link, is_crawled: false
                }));
                await supabase.from('streekx_crawl_queue').upsert(batch, { onConflict: 'url' });
            }
        }));

        await new Promise(r => setTimeout(r, 2000)); // Safe delay
    }
}

startStreekxEngine();
