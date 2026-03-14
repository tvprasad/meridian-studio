// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse, delay } from 'msw';
import { setupServer } from 'msw/node';
import { api, ApiError } from '../client';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('api client timeout', () => {
  it('throws ApiError when request exceeds timeoutMs', async () => {
    server.use(
      http.get('http://localhost:8000/slow', async () => {
        await delay(5000);
        return HttpResponse.json({ ok: true });
      }),
    );

    await expect(
      api.get('/slow', { timeoutMs: 100 }),
    ).rejects.toThrow(ApiError);

    await expect(
      api.get('/slow', { timeoutMs: 100 }),
    ).rejects.toThrow(/timed out/);
  });

  it('succeeds when response arrives before timeout', async () => {
    server.use(
      http.get('http://localhost:8000/fast', async () => {
        return HttpResponse.json({ ok: true });
      }),
    );

    const result = await api.get('/fast', { timeoutMs: 5000 });
    expect(result).toEqual({ ok: true });
  });
});
