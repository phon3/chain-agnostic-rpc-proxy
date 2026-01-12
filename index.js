const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());

// Load Config
let config;
try {
    const configFile = fs.readFileSync('./config.json');
    config = JSON.parse(configFile);
} catch (e) {
    console.error("Failed to load config.json", e);
    process.exit(1);
}

const PORT = config.port || 3000;

// Helper to shuffle array (Fisher-Yates)
function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

// Proxy function
async function proxyRequest(url, method, body) {
    const start = performance.now();
    try {
        const response = await axios({
            method: method,
            url: url,
            data: body,
            timeout: 5000, // 5 second timeout
            headers: { 'Content-Type': 'application/json' }
        });

        const end = performance.now();
        console.log(`[${url}] Success (${(end - start).toFixed(2)}ms)`);
        return response.data;
    } catch (error) {
        const end = performance.now();
        console.error(`[${url}] Failed (${(end - start).toFixed(2)}ms):`, error.message);
        throw error;
    }
}

// Dynamic Route Handler
app.post('/:chain/:network', async (req, res) => {
    const { chain, network } = req.params;

    // Validate Chain/Network
    if (!config.chains[chain] || !config.chains[chain][network]) {
        return res.status(404).json({ error: `Chain '${chain}' or network '${network}' not configured.` });
    }

    const providers = config.chains[chain][network];
    if (!providers || providers.length === 0) {
        return res.status(500).json({ error: "No providers configured for this chain/network." });
    }

    // Shuffle providers for simple load balancing/failover
    const shuffledProviders = shuffleArray([...providers]);

    let lastError = null;

    for (const providerUrl of shuffledProviders) {
        try {
            const result = await proxyRequest(providerUrl, 'POST', req.body);

            // Check for specific RPC errors that usually imply node issues (syncing, etc)
            if (result.error && (result.error.code === -32002 || result.error.code === -32603)) {
                console.warn(`[${providerUrl}] RPC Error ${result.error.code}, failing over...`);
                throw new Error(`RPC Error: ${result.error.message}`);
            }

            return res.json(result);
        } catch (error) {
            lastError = error;
            // Continue to next provider
        }
    }

    // All providers failed
    return res.status(502).json({
        error: "All providers failed.",
        details: lastError ? lastError.message : "No available providers"
    });
});

// Health/Status check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', chains: Object.keys(config.chains) });
});

// Only start server if run directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Multi-Chain RPC Proxy listening on port ${PORT}`);
        console.log(`Available Chains: ${Object.keys(config.chains).join(', ')}`);
    });
}

// Export for testing
module.exports = app;
