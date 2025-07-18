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

    try {
        const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: `You are an expert on Sabre APIs, referencing developer.sabre.com. Provide concise answers about Sabre APIs, including API options and sample code snippets (REST and SOAP) for tasks like searching a PNR. Use markdown code blocks (```). User question: ${question}`,
                parameters: { max_length: 500, temperature: 0.7 }
            })
        });

        const text = await response.text();
        if (!response.ok) {
            console.error('Hugging Face API Error:', { status: response.status, body: text });
            return {
                statusCode: response.status,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: `Hugging Face API failed: ${text || response.statusText}` })
            };
        }

        const jsonData = JSON.parse(text);
        if (!jsonData[0]?.generated_text) {
            console.error('Invalid Hugging Face Response:', jsonData);
            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Invalid response format from Hugging Face API' })
            };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answer: jsonData[0].generated_text })
        };
    } catch (error) {
        console.error('Function Error:', error.message);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: `Server error: ${error.message}` })
        };
    }
};
