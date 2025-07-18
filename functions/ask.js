const fetch = require('node-fetch');

exports.handler = async (event) => {
    const { question } = JSON.parse(event.body || '{}');
    if (!question) {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'No question provided' })
        };
    }

    const tryFetch = async (retries = 3, delay = 30000) => {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        inputs: `You are an expert on Sabre APIs, referencing developer.sabre.com. Provide concise answers about Sabre APIs, including API options and sample code snippets (REST and SOAP) for tasks like searching a PNR. Use markdown code blocks (```). User question: ${question}`,
                        parameters: {
                            max_length: 500
                        }
                    })
                });

                const text = await response.text();
                if (!response.ok) {
                    let errorData;
                    try {
                        errorData = JSON.parse(text);
                    } catch (e) {
                        errorData = { error: text || 'Unknown error' };
                    }
                    console.error('Hugging Face API Error:', { status: response.status, body: errorData });

                    if ((response.status === 503 || response.status === 502) && i < retries - 1) {
                        console.log(`API error ${response.status}, retrying in ${delay/1000} seconds...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }

                    return {
                        statusCode: response.status,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ error: `Hugging Face API failed: ${errorData.error || text || response.statusText}` })
                    };
                }

                let jsonData;
                try {
                    jsonData = JSON.parse(text);
                } catch (e) {
                    console.error('JSON Parse Error:', { text, error: e.message });
                    return {
                        statusCode: 500,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ error: `Invalid response format: ${text || 'Empty response'}` })
                    };
                }

                if (!jsonData[0]?.generated_text) {
                    console.error('Invalid Hugging Face Response:', jsonData);
                    return {
                        statusCode: 500,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ error: 'Invalid response format from Hugging Face API' })
                    };
                }

                // Trim the response to exclude the input prompt if present
                let answer = jsonData[0].generated_text;
                const promptIndex = answer.indexOf('User question:');
                if (promptIndex !== -1) {
                    answer = answer.substring(promptIndex + question.length + 13).trim();
                }

                return {
                    statusCode: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ answer })
                };
            } catch (error) {
                console.error('Function Error:', error.message);
                return {
                    statusCode: 500,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: `Server error: ${error.message}` })
                };
            }
        }
    };

    return await tryFetch();
};