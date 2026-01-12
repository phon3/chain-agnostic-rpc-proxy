const request = require('supertest');
const axios = require('axios');

// Mock Axios
jest.mock('axios');

// We need to delay importing app until axios is mocked if the app uses it at top level?
// No, but we need to ensure the mock is in place before the app handles requests.
const app = require('../index');

describe('RPC Proxy API', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        // Just let it finish
    });

    it('should return health status', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('status', 'ok');
        expect(res.body.chains).toContain('ethereum');
    });

    it('should route to valid chain/network and return result', async () => {
        // Mock successful axios response
        axios.mockResolvedValue({
            data: {
                result: '0x123',
                id: 1,
                jsonrpc: '2.0'
            }
        });

        const res = await request(app)
            .post('/ethereum/mainnet')
            .send({
                jsonrpc: '2.0',
                method: 'eth_blockNumber',
                params: [],
                id: 1
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.result).toEqual('0x123');
        expect(axios).toHaveBeenCalled();
        // Check that it called one of the configured URLs
        const calledUrl = axios.mock.calls[0][0].url;
        expect(calledUrl).toBeDefined();
    });

    it('should handle failover when provider fails', async () => {
        // First call fails, second succeeds
        axios.mockRejectedValueOnce(new Error('Network Error'))
            .mockResolvedValueOnce({ data: { result: '0x456' } });

        const res = await request(app)
            .post('/ethereum/mainnet')
            .send({ jsonrpc: '2.0', method: 'eth_blockNumber', id: 1 });

        expect(res.statusCode).toEqual(200);
        expect(res.body.result).toEqual('0x456');
        expect(axios).toHaveBeenCalledTimes(2);
    });

    it('should return 404 for invalid chain', async () => {
        const res = await request(app)
            .post('/invalid_chain/mainnet')
            .send({ jsonrpc: '2.0', method: 'eth_blockNumber', id: 1 });
        expect(res.statusCode).toEqual(404);
    });

    it('should return 404 for invalid network', async () => {
        const res = await request(app)
            .post('/ethereum/bad_network')
            .send({ jsonrpc: '2.0', method: 'eth_blockNumber', id: 1 });
        expect(res.statusCode).toEqual(404);
    });
});
