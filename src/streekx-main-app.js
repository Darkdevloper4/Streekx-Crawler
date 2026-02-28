const { executeCrawl } = require('./streekx-engine-core');

const SEED_URLS = ['https://news.google.com', 'https://www.wikipedia.org'];
const MAX_DEPTH = 3; // Kitna gehra jana hai (Page -> Link -> Link)
const visited = new Set();

async function startStreekxEngine() {
    console.log("--- Streekx Independent Crawler Initialized ---");
    
    let queue = SEED_URLS.map(url => ({ url, depth: 0 }));

    while (queue.length > 0) {
        const { url, depth } = queue.shift();

        if (visited.has(url) || depth > MAX_DEPTH) continue;
        visited.add(url);

        const newLinks = await executeCrawl(url, depth);

        // Naye links ko queue mein add karein
        const nextLinks = newLinks.map(link => ({ url: link, depth: depth + 1 }));
        queue.push(...nextLinks.slice(0, 20)); // Limit per page to avoid memory overflow

        // Respectful delay (Politeness)
        await new Promise(r => setTimeout(r, 2000));
    }
}

startStreekxEngine();

