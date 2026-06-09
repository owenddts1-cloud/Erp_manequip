const apiKey = 'AIzaSyDpXJp2HzNbb61_QmW-PN5DV4_8yPShsC0';
const models = [
    'gemini-2.0-flash-lite',
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-3.5-flash',
    'gemini-2.0-flash'
];

async function testModels() {
    for (const model of models) {
        console.log(`\nTesting model: ${model}...`);
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: "Olá, responda com apenas uma palavra: OK."
                        }]
                    }]
                }),
            });

            const data = await response.json();
            console.log('Status Code:', response.status);
            if (response.ok) {
                console.log('Success!', data.candidates?.[0]?.content?.parts?.[0]?.text);
            } else {
                console.log('Error Message:', data.error?.message);
            }
        } catch (e) {
            console.error('Fetch error:', e.message);
        }
    }
}

testModels();
