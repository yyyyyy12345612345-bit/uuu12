const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\youse\\.gemini\\antigravity-ide\\brain\\a584da28-e64e-41a7-82ad-43dd7dbc86bb\\.system_generated\\logs\\transcript.jsonl';

const rl = readline.createInterface({
    input: fs.createReadStream(logPath),
    crlfDelay: Infinity
});

rl.on('line', (line) => {
    try {
        const data = JSON.parse(line);
        if (data.type === 'USER_INPUT') {
            console.log(`[USER] ${data.content}`);
        } else if (data.type === 'INITIALIZATION') {
            // Find if there is any user information or initial message with URLs
            if (data.content.includes('http')) {
                // Find all URLs in the content
                const urls = data.content.match(/https?:\/\/[^\s"'<>]+/g);
                if (urls) {
                    console.log(`[INIT URLs] ${urls.join(', ')}`);
                }
            }
        }
    } catch (e) {
        // Skip invalid JSON lines
    }
});
