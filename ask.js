const fetch = require('node-fetch');

exports.handler = async (event) => {
    const { question } = JSON.parse(event.body);
    if (!question) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'No question provided' })
        };
    }

    try {
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.xai-s8mkh9zj2ZIEcsryuRkqP36gH9Nb5YDeudJf0PdLYwWxchsc52gzkRwurpk3MgmgiTgMhTvxthG5vlvE}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'grok-4-0709',
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

        const data = await response.json();
        if (!response.ok) {
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: data.error?.message || 'API request failed' })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ answer: data.choices[0].message.content })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
