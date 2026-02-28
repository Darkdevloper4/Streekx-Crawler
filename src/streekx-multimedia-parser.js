const { JSDOM } = require('jsdom');

function parsePage(html, url) {
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;
    const urlObj = new URL(url);

    const data = {
        title: document.title || "",
        description: "",
        favicon: "",
        og_image: "",
        images: [],
        videos: [],
        links: [],
        site_name: urlObj.hostname
    };

    // 1. Favicon Extraction (Google jaisa icon dikhane ke liye)
    const iconSelectors = [
        'link[rel="icon"]',
        'link[rel="shortcut icon"]',
        'link[rel="apple-touch-icon"]'
    ];
    for (let selector of iconSelectors) {
        const icon = document.querySelector(selector);
        if (icon && icon.href) {
            data.favicon = new URL(icon.href, url).href;
            break;
        }
    }
    // Default fallback agar favicon na mile
    if (!data.favicon) data.favicon = `${urlObj.origin}/favicon.ico`;

    // 2. OpenGraph & Meta Description (Rich Previews ke liye)
    data.description = document.querySelector('meta[name="description"]')?.content || 
                       document.querySelector('meta[property="og:description"]')?.content || "";
    
    data.og_image = document.querySelector('meta[property="og:image"]')?.content || "";

    // 3. Image Extraction (with Alt text for Image Search)
    document.querySelectorAll('img').forEach(img => {
        const src = img.src || img.dataset.src;
        if (src && src.startsWith('http')) {
            data.images.push({
                url: new URL(src, url).href,
                alt: img.alt || data.title
            });
        }
    });

    // 4. Video & Media Extraction (YouTube/Vimeo/HTML5)
    document.querySelectorAll('video, source, iframe').forEach(media => {
        const src = media.src || media.dataset.src;
        if (src && src.startsWith('http')) {
            data.videos.push(new URL(src, url).href);
        }
    });

    // 5. Recursive Link Extraction
    document.querySelectorAll('a').forEach(link => {
        try {
            if (link.href && link.href.startsWith('http')) {
                data.links.push(link.href);
            }
        } catch (e) { /* Invalid URL skip */ }
    });

    return data;
}

module.exports = { parsePage };
