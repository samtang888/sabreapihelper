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
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek-chat', // Updated to correct model name
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert on Sabre APIs, referencing developer.sabre.com. Provide detailed, accurate answers about using Sabre APIs, including API options, step-by-step guides, and sample Sabre API code snippets for both REST (JSON) and SOAP (XML) formats for tasks like searching a PNR. Format code snippets in markdown code blocks (```) for clarity.'
                    },
                    { role: 'user', content: question }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        const text = await response.text();
        if (!response.ok) {
            console.error('DeepSeek API Error:', { status: response.status, body: text });
            return {
                statusCode: response.status,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: `DeepSeek API failed: ${text || response.statusText}` })
            };
        }

        const jsonData = JSON.parse(text);
        if (!jsonData.choices || !jsonData.choices[0]?.message?.content) {
            console.error('Invalid DeepSeek Response:', jsonData);
            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Invalid response format from DeepSeek API' })
            };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answer: jsonData.choices[0].message.content })
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
