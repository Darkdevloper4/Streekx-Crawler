const { JSDOM } = require('jsdom');

function parsePage(html, url) {
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;

    const data = {
        title: document.title || "",
        description: document.querySelector('meta[name="description"]')?.content || "",
        images: [],
        videos: [],
        links: []
    };

    // Advanced Image & Video Extraction
    document.querySelectorAll('img').forEach(img => {
        if (img.src) data.images.push(img.src);
    });

    document.querySelectorAll('video, source, iframe').forEach(media => {
        const src = media.src || media.dataset.src;
        if (src) data.videos.push(src);
    });

    // Link extraction for recursive crawling
    document.querySelectorAll('a').forEach(link => {
        if (link.href && link.href.startsWith('http')) {
            data.links.push(link.href);
        }
    });

    return data;
}

module.exports = { parsePage };

