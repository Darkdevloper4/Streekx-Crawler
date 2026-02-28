const { executeCrawl } = require('./streekx-engine-core');
const { supabase } = require('./streekx-database-client');

async function getNextUrlFromQueue() {
    const { data, error } = await supabase
        .from('streekx_crawl_queue')
        .select('url')
        .eq('is_crawled', false)
        .limit(1)
        .single();
    
    return data ? data.url : null;
}

async function startStreekxEngine() {
    console.log("--- Streekx Infinite Crawler Started ---");
    
    while (true) {
        let url = await getNextUrlFromQueue();
        
        if (!url) {
            console.log("Queue khali hai. Seed URLs se refill kar raha hoon...");
            // Agar queue khali ho toh default sites add karein
            await supabase.from('streekx_crawl_queue').upsert([{ url: 'https://news.google.com' }]);
            await new Promise(r => setTimeout(r, 5000));
            continue;
        }

        console.log(`Processing: ${url}`);
        const newLinks = await executeCrawl(url, 1);

        // Naye links ko queue mein daalein
        if (newLinks && newLinks.length > 0) {
            const queueData = newLinks.slice(0, 15).map(link => ({ url: link, is_crawled: false }));
            await supabase.from('streekx_crawl_queue').upsert(queueData, { onConflict: 'url' });
        }

        // URL ko 'crawled' mark karein
        await supabase.from('streekx_crawl_queue').update({ is_crawled: true }).eq('url', url);

        // Google level politeness (Anti-blocking)
        await new Promise(r => setTimeout(r, 2000));
    }
}

startStreekxEngine();
