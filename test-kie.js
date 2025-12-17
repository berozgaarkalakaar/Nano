const https = require('https');

const apiKey = "1253c01d1484bee9e8f2d41845e61e70";
const createUrl = "https://api.kie.ai/api/v1/jobs/createTask";

const data = JSON.stringify({
    model: "nano-banana-pro",
    input: {
        prompt: "A cute robot eating a banana",
        aspect_ratio: "1:1",
        resolution: "1K",
        output_format: "png"
    }
});

const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': data.length
    }
};

console.log("Creating Task at", createUrl);
const req = https.request(createUrl, options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('Create Task Response:', body);
        let taskId;
        try {
            const json = JSON.parse(body);
            if (json.data && json.data.taskId) {
                taskId = json.data.taskId;
                console.log('Task Created ID:', taskId);
            } else {
                console.error("Failed to get taskId");
                return;
            }
        } catch (e) {
            console.error("Error parsing create response", e);
            return;
        }

        // Poll
        const attempts = [
            { method: 'GET', url: `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}` }
        ];

        attempts.forEach((att, idx) => {
            setInterval(() => { // Use setInterval to poll repeatedly
                const urlObj = new URL(att.url);
                const opts = {
                    method: att.method,
                    hostname: urlObj.hostname,
                    path: urlObj.pathname + (urlObj.search || ''),
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                };

                console.log(`\n[${idx}] Requesting ${att.method} ${att.url}`);
                const req2 = https.request(opts, (res2) => {
                    let body2 = '';
                    res2.on('data', c => body2 += c);
                    res2.on('end', () => {
                        console.log(`[${idx}] Status: ${res2.statusCode}`);
                        if (res2.statusCode === 200) {
                            console.log(`[${idx}] Body:`, body2);
                            // Try to parse if success
                            try {
                                const b = JSON.parse(body2);
                                if (b.data && b.data.state === 'success') {
                                    console.log("SUCCESS! Result:", b.data.resultJson);
                                    process.exit(0);
                                }
                            } catch (e) { }
                        } else {
                            if (body2.length < 500) console.log(`[${idx}] Error Body:`, body2);
                        }
                    });
                });
                req2.on('error', e => console.error(`[${idx}] Error: ${e.message}`));
                req2.end();
            }, 2000); // Check every 2s
        });

    });
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
