const https = require('https');
const fs = require('fs');

const CHAIN_IDS = {
    'eth': 1,
    'bnb': 56,
    'arb': 42161,
    'mnt': 5000,
    'avax': 43114,
    'base': 8453
};

const MANUAL_CHAINS = {
    'mon': {
        name: 'Monad Mainnet',
        chainId: 143,
        rpcs: [
            "https://rpc.monad.xyz",
            "https://monad-mainnet.drpc.org",
            "https://rpc-mainnet.monadinfra.com"
        ]
    },
    'hype': {
        name: 'Hyperliquid EVM Mainnet',
        chainId: 999,
        rpcs: [
            "https://rpc.hyperliquid.xyz/evm",
            "https://hyperliquid.drpc.org",
            "https://rpc.hypurrscan.io"
        ]
    }
};

function fetchChains() {
    return new Promise((resolve, reject) => {
        https.get('https://chainid.network/chains.json', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function main() {
    console.log("Fetching chains...");
    const chains = await fetchChains();

    const config = {
        port: 3000,
        chains: {}
    };

    // Process standard chains
    for (const [key, id] of Object.entries(CHAIN_IDS)) {
        const chainData = chains.find(c => c.chainId === id);
        if (chainData) {
            // Filter good RPCs (https only, no API keys usually preferred but we take what we get)
            let rpcs = chainData.rpc.filter(url => url.startsWith('https://') && !url.includes('${INFURA_API_KEY}'));

            // Limit to top 5 to avoid clutter
            rpcs = rpcs.slice(0, 5);

            config.chains[key] = {
                mainnet: rpcs
            };
            console.log(`Found ${key}: ${rpcs.length} RPCs`);
        } else {
            console.warn(`Chain ${key} (ID ${id}) not found!`);
        }
    }

    // Process manual chains
    for (const [key, data] of Object.entries(MANUAL_CHAINS)) {
        config.chains[key] = {
            mainnet: data.rpcs
        };
        console.log(`Added manual ${key}: ${data.rpcs.length} RPCs`);
    }

    console.log("Writing config.json...");
    fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
    console.log("Done!");
}

main();
