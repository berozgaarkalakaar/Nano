const fetch = require('node-fetch'); // Assuming node-fetch is available or using built-in fetch in newer node
// If node-fetch isn't available, I'll use https module, but let's try fetch first as it's common in Next.js envs.
// Actually, to be safe and dependency-free, I'll use https.

const https = require('https');

const apiKey = "1253c01d1484bee9e8f2d41845e61e70";
const url = "https://api.kie.ai/api/v1/jobs/createTask";

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

const req = https.request(url, options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('Create Task Response:', body);
        const json = JSON.parse(body);
        if (json.data && json.data.taskId) {
            const taskId = json.data.taskId;
            console.log('Polling for task:', taskId);

            const endpoints = [
                { method: 'POST', url: `https://api.kie.ai/api/v1/jobs/getTask`, body: { taskId, model: "nano-banana-pro" } },
                { method: 'POST', url: `https://api.kie.ai/api/v1/jobs/checkTask`, body: { taskId } },
                { method: 'POST', url: `https://api.kie.ai/api/v1/task/get`, body: { taskId } },
                { method: 'POST', url: `https://api.kie.ai/api/v1/task/info`, body: { taskId } },
                { method: 'GET', url: `https://api.kie.ai/api/v1/jobs/fetch?taskId=${taskId}` },
            ];

            endpoints.forEach((ep, index) => {
                setTimeout(() => {
                    const opts = {
                        method: ep.method,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`
                        }
                    };
                    if (ep.body) {
                        opts.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(ep.body));
                    }

                    console.log(`Trying ${ep.method} ${ep.url}...`);
                    const req2 = https.request(ep.url, opts, (res2) => {
                        let body2 = '';
                        res2.on('data', (chunk) => body2 += chunk);
                        res2.on('end', () => {
                            console.log(`Response from ${ep.url}: ${res2.statusCode}`);
                            if (res2.statusCode === 200) {
                                console.log('Body:', body2);
                            }
                        });
                    });
                    req2.on('error', (e) => console.error(`Error ${ep.url}:`, e.message));
                    if (ep.body) req2.write(JSON.stringify(ep.body));
                    req2.end();
                }, index * 1000 + 2000);
            });
        }
    });
});

req.on('error', (e) => {
    console.error('Problem with request:', e.message);
});

req.write(data);
req.end();
