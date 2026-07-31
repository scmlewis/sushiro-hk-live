import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from './busyness.js';

vi.mock('./_lib/busyness-cache.js', () => ({
  getBusynessData: vi.fn(),
}));

import { getBusynessData } from './_lib/busyness-cache.js';

function createMockReq(query: Record<string, string>, method = 'GET'): VercelRequest {
  return { query, method } as unknown as VercelRequest;
}

function createMockRes(): VercelResponse & { _status: number; _body: any; _headers: Record<string, string> } {
  const res = {
    _status: 200,
    _body: null,
    _headers: {} as Record<string, string>,
    setHeader(name: string, value: string) {
      res._headers[name] = value;
      return res;
    },
    status(code: number) {
      res._status = code;
      return res;
    },
    json(body: any) {
      res._body = body;
      return res;
    },
    end() {
      return res;
    },
  } as unknown as VercelResponse & { _status: number; _body: any; _headers: Record<string, string> };
  return res;
}

describe('/api/busyness endpoint', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 400 when storeid is missing', async () => {
    const req = createMockReq({ name: '荃灣廣場', lat: '22.37', lng: '114.11' });
    const res = createMockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
  });

  it('returns 400 when name is missing', async () => {
    const req = createMockReq({ storeid: '1', lat: '22.37', lng: '114.11' });
    const res = createMockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
  });

  it('returns 400 when lat is missing', async () => {
    const req = createMockReq({ storeid: '1', name: '荃灣廣場', lng: '114.11' });
    const res = createMockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
  });

  it('returns 400 when lng is missing', async () => {
    const req = createMockReq({ storeid: '1', name: '荃灣廣場', lat: '22.37' });
    const res = createMockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
  });

  it('returns 400 when lat is not a number', async () => {
    const req = createMockReq({ storeid: '1', name: '荃灣廣場', lat: 'abc', lng: '114.11' });
    const res = createMockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
  });

  it('returns 200 with busyness data on success', async () => {
    vi.mocked(getBusynessData).mockResolvedValue({
      data: { live: 50, popularTimes: null, currentHour: 14 },
      cached: false,
      timestamp: Date.now(),
    });

    const req = createMockReq({ storeid: '1', name: '荃灣廣場', lat: '22.37', lng: '114.11' });
    const res = createMockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);
    expect(res._body.busyness.live).toBe(50);
    expect(getBusynessData).toHaveBeenCalledWith(1, '荃灣廣場', 22.37, 114.11, false);
  });

  it('passes force=true to getBusynessData', async () => {
    vi.mocked(getBusynessData).mockResolvedValue({
      data: null,
      cached: false,
      timestamp: Date.now(),
    });

    const req = createMockReq({ storeid: '1', name: '荃灣廣場', lat: '22.37', lng: '114.11', force: 'true' });
    const res = createMockRes();
    await handler(req, res);

    expect(getBusynessData).toHaveBeenCalledWith(1, '荃灣廣場', 22.37, 114.11, true);
  });

  it('returns 502 when getBusynessData throws', async () => {
    vi.mocked(getBusynessData).mockRejectedValue(new Error('API failure'));

    const req = createMockReq({ storeid: '1', name: '荃灣廣場', lat: '22.37', lng: '114.11' });
    const res = createMockRes();
    await handler(req, res);

    expect(res._status).toBe(502);
    expect(res._body.success).toBe(false);
    expect(res._body.error).toBe('無法取得人流資料');
  });

  it('sets CORS headers', async () => {
    vi.mocked(getBusynessData).mockResolvedValue({
      data: null,
      cached: false,
      timestamp: Date.now(),
    });

    const req = createMockReq({ storeid: '1', name: '荃灣廣場', lat: '22.37', lng: '114.11' });
    const res = createMockRes();
    await handler(req, res);

    expect(res._headers['Access-Control-Allow-Origin']).toBe('*');
  });

  it('handles OPTIONS preflight', async () => {
    const req = createMockReq({}, 'OPTIONS');
    const res = createMockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
  });
});
