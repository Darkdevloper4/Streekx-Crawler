const { executeCrawl } = require('./streekx-engine-core');
const { supabase } = require('./streekx-database-client');

const CONCURRENCY = 3; 

async function startStreekxEngine() {
    console.log("--- STREEKX POWER CRAWLER LIVE ---");
    
    while (true) {
        const { data: queue, error: fetchError } = await supabase
            .from('streekx_crawl_queue')
            .select('url')
            .eq('is_crawled', false)
            .limit(CONCURRENCY);

        if (fetchError || !queue || queue.length === 0) {
            console.log("Queue empty. Reseeding with Global Authority Sites...");
            await supabase.from('streekx_crawl_queue').upsert([
                { url: 'https://www.bbc.com/news', is_crawled: false },
                { url: 'https://www.reuters.com', is_crawled: false },
                { url: 'https://en.wikipedia.org/wiki/Special:Random', is_crawled: false },
                { url: 'https://www.thehindu.com', is_crawled: false }
            ], { onConflict: 'url' });
            await new Promise(r => setTimeout(r, 10000)); 
            continue;
        }

        await Promise.all(queue.map(async (item) => {
            const url = item.url;
            await supabase.from('streekx_crawl_queue').update({ is_crawled: true }).eq('url', url);
            
            const newLinks = await executeCrawl(url, 1);

            if (newLinks && newLinks.length > 0) {
                const batch = [...new Set(newLinks)].slice(0, 15).map(link => ({
                    url: link, is_crawled: false
                }));
                await supabase.from('streekx_crawl_queue').upsert(batch, { onConflict: 'url' });
            }
        }));

        await new Promise(r => setTimeout(r, 2000));
    }
}

startStreekxEngine();
