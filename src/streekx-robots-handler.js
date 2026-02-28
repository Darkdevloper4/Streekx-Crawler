const axios = require('axios');
const robotsParser = require('robots-parser');

async function isAllowed(url) {
    try {
        const urlObj = new URL(url);
        const robotsUrl = `${urlObj.origin}/robots.txt`;
        const response = await axios.get(robotsUrl, { timeout: 5000 });
        const robots = robotsParser(robotsUrl, response.data);
        return robots.isAllowed(url, 'StreekxBot');
    } catch (e) {
        return true; // Agar robots.txt nahi hai toh allow karein
    }
}

module.exports = { isAllowed };

