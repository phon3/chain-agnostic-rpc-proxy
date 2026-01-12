# Multi-Chain RPC Proxy

A robust, chain-agnostic JSON-RPC proxy that routes requests to multiple providers with built-in failover and load balancing.

## Features
- **Multi-Chain Support**: Configure multiple chains (Ethereum, Arbitrum, Optimism, etc.) and networks (Mainnet, Sepolia).
- **Automatic Failover**: Tries the next provider if one fails or returns a specific RPC error.
- **Load Balancing**: Randomly shuffles providers for each request.
- **Container Ready**: Includes Dockerfile for easy deployment.
- **Configurable**: Simple `config.json` for managing RPC endpoints.

## Installation

```bash
npm install
```

## Configuration

Edit `config.json` to add your chains and providers:

```json
{
  "port": 3000,
  "chains": {
    "ethereum": {
      "mainnet": [
        "https://rpc.ankr.com/eth",
        "https://cloudflare-eth.com"
      ]
    },
    "arbitrum": {
      "mainnet": [
        "https://arb1.arbitrum.io/rpc"
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
curl -X POST http://localhost:3000/ethereum/mainnet \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**Example: Arbitrum Mainnet**
```bash
curl -X POST http://localhost:3000/arbitrum/mainnet \
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
