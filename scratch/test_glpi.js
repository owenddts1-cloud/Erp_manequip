const apiKey = "Iwvu9abJgOUL9ZKRXedYVC9tV8A7sALkS8Msvv3G";
const glpiUrl = "https://glpi.manequip.com/apirest.php";
const appToken = "aKzY98HjKlM12OpQrStUvWxYz";

async function run() {
    console.log("Starting test connection to GLPI using native fetch...");
    const initHeaders = {
        'Authorization': `user_token ${apiKey}`
    };
    if (appToken) {
        initHeaders['App-Token'] = appToken;
    }

    let cleanUrl = glpiUrl.trim().replace(/\/$/, '');
    const url = `${cleanUrl}/initSession`;
    console.log(`Fetching: ${url}`);
    console.log("Headers:", JSON.stringify(initHeaders, null, 2));

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: initHeaders
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log("Response text:", text);

        if (response.ok) {
            const data = JSON.parse(text);
            const sessionToken = data.session_token;
            console.log(`Session Token: ${sessionToken}`);

            console.log("Fetching tickets...");
            const ticketHeaders = {
                'Session-Token': sessionToken
            };
            if (appToken) {
                ticketHeaders['App-Token'] = appToken;
            }
            const ticketUrl = `${cleanUrl}/Ticket?expand_dropdowns=true&range=0-15`;
            console.log(`Fetching tickets from: ${ticketUrl}`);
            const ticketResponse = await fetch(ticketUrl, {
                method: 'GET',
                headers: ticketHeaders
            });

            console.log(`Tickets status: ${ticketResponse.status} ${ticketResponse.statusText}`);
            const ticketText = await ticketResponse.text();
            console.log("Tickets response:", ticketText);

            // Kill session
            await fetch(`${cleanUrl}/killSession`, {
                method: 'GET',
                headers: ticketHeaders
            });
            console.log("Session closed.");
        }
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

run();
