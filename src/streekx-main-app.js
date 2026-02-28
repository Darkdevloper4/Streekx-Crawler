// src/streekx-main-app.js ka ye hissa update karein
const CONCURRENCY = 2; // Safe speed for stability

// Jab queue khali ho, toh zyada diverse sites add karein
if (!queue || queue.length === 0) {
    console.log("Queue empty. Expanding search horizons...");
    await supabase.from('streekx_crawl_queue').upsert([
        { url: 'https://www.thehindu.com', is_crawled: false },
        { url: 'https://www.ndtv.com', is_crawled: false },
        { url: 'https://en.wikipedia.org/wiki/Special:Random', is_crawled: false },
        { url: 'https://news.ycombinator.com', is_crawled: false }
    ], { onConflict: 'url' });
    
    // 10 second ka lamba wait taki naye links database mein stable ho jayein
    await new Promise(r => setTimeout(r, 10000)); 
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
