# Multi-Chain RPC Proxy

A robust, chain-agnostic JSON-RPC proxy that routes requests to multiple providers with built-in failover and load balancing.

## Features
- **Multi-Chain Support**: Pre-configured defaults for **ETH, BNB, ARB, MON, MNT, HYPE, AVAX, BASE, HOOD**. Supports any custom chain via config.
- **Auto-Balancing & Failover**: The proxy **automatically shuffles** your list of providers for every request. This ensures no single provider is overloaded. If a provider fails, it instantly retries the next one in the list.
- **Container Ready**: Includes Dockerfile for easy deployment.
- **Configurable**: Simple `config.json` for managing RPC endpoints.

## Installation

```bash
npm install
```

## Configuration

Edit `config.json` to add your chains and providers. Chain keys are short abbreviations (e.g. `eth`, `arb`, `hood`), not full names:

```json
{
  "port": 3000,
  "chains": {
    "eth": {
      "mainnet": [
        "https://rpc.ankr.com/eth",
        "https://eth.llamarpc.com",
        "https://cloudflare-eth.com",
        "https://1rpc.io/eth"
      ]
    },
    "arb": {
      "mainnet": [
        "https://arb1.arbitrum.io/rpc",
        "https://rpc.ankr.com/arbitrum",
        "https://1rpc.io/arb"
      ]
    }
  }
}
```

## Usage

Start the server:

```bash
node index.js
```

The proxy will listen on the configured port (default: 3000).

### Making Requests

Route your requests to `http://localhost:3000/:chain/:network`.

**Example: Ethereum Mainnet**
```bash
curl -X POST http://localhost:3000/eth/mainnet \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**Example: Arbitrum Mainnet**
```bash
curl -X POST http://localhost:3000/arb/mainnet \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**Example: Robinhood Chain Mainnet**
```bash
curl -X POST http://localhost:3000/hood/mainnet \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## Docker

Build and run with Docker:

```bash
# Build
docker build -t rpc-proxy .

# Run (map port 3000)
docker run -p 3000:3000 --name my-rpc-proxy rpc-proxy
```

## Testing

Run the automated test suite:

```bash
npm test
```

## Railway Deployment

Railway service configuration lives in [`.railway/railway.ts`](./.railway/railway.ts) (Railway Infrastructure as Code, partial `chain-agnostic-rpc-proxy` inside the `defi-swap-agg` project). Legacy `railway.toml` Config as Code is deprecated and stops being read on **2026-12-01**.

```bash
(cd .railway && npm install)
railway link --project defi-swap-agg --environment production
railway config plan --verbose
railway config apply
```
