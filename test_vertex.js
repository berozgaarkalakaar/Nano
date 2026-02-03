
const API_KEY = "AQ.Ab8RN6IynES0kT02OM25ecwIZ0ZktWo3oNxgmZ6ZWPqUQqqm7w";

async function testModel(modelName) {
    const url = `https://aiplatform.googleapis.com/v1/publishers/google/models/${modelName}:generateContent?key=${API_KEY}`;
    console.log(`Testing ${modelName}...`);

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: "Hello" }] }]
            })
        });

        if (response.ok) {
            console.log(`SUCCESS: ${modelName} responded 200 OK.`);
            const data = await response.json();
            // console.log(JSON.stringify(data, null, 2));
        } else {
            console.log(`FAILURE: ${modelName} responded ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.log("Error Body:", text);
        }
    } catch (e) {
        console.error("Exception:", e);
    }
    console.log("---");
}

async function run() {
    await testModel("gemini-2.5-flash-lite");
    await testModel("gemini-3-pro-image-preview");
}

run();
