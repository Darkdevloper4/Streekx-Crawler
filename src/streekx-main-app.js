const { executeCrawl } = require('./streekx-engine-core');
const { supabase } = require('./streekx-database-client');

// SAFE LIMIT: Ek saath sirf 2 ya 3 pages (taki block hone ka darr na ho)
const CONCURRENCY_LIMIT = 2; 

async function fetchFromQueue() {
    const { data, error } = await supabase
        .from('streekx_crawl_queue')
        .select('url')
        .eq('is_crawled', false)
        .order('priority', { ascending: false })
        .limit(CONCURRENCY_LIMIT);
    
    return data || [];
}

async function processUrl(url) {
    try {
        console.log(`[Streekx] Safely Indexing: ${url}`);
        
        // 1. Pehle hi mark karein taki doosra thread ise na uthaye
        await supabase.from('streekx_crawl_queue').update({ is_crawled: true }).eq('url', url);

        // 2. Crawl karein (Multimedia, Favicons, Links sab nikalega)
        const newLinks = await executeCrawl(url, 1);

        // 3. Naye links ko queue mein add karein (Sirf top 10 links)
        if (newLinks && newLinks.length > 0) {
            const queueData = newLinks.slice(0, 10).map(link => ({ 
                url: link, 
                is_crawled: false,
                priority: 1 
            }));
            await supabase.from('streekx_crawl_queue').upsert(queueData, { onConflict: 'url' });
        }
    } catch (e) {
        console.error(`Skipping ${url} due to error.`);
    }
}

async function startStreekxEngine() {
    console.log("--- Streekx Stable Engine Live ---");
    
    while (true) {
        const batch = await fetchFromQueue();

        if (batch.length === 0) {
            console.log("Queue empty. Reseeding with News sites...");
            await supabase.from('streekx_crawl_queue').upsert([
                { url: 'https://news.google.com', is_crawled: false },
                { url: 'https://en.wikipedia.org/wiki/Special:Random', is_crawled: false }
            ], { onConflict: 'url' });
            await new Promise(r => setTimeout(r, 5000));
            continue;
        }

        // Ek saath 2 pages crawl karega (Safe speed)
        await Promise.all(batch.map(item => processUrl(item.url)));
        
        // Insani gap (2 second ka break taki server ko load na pade)
        await new Promise(r => setTimeout(r, 2000));
    }
}

startStreekxEngine();
