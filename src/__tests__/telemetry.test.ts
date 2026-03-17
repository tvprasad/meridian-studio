// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockLoadAppInsights = vi.fn();

vi.mock('@microsoft/applicationinsights-web', () => ({
  ApplicationInsights: class MockApplicationInsights {
    config: unknown;
    constructor(cfg: unknown) {
      this.config = cfg;
    }
    loadAppInsights = mockLoadAppInsights;
  },
}));

const mockConfig = {
  appInsightsConnectionString: '',
  apiBaseUrl: 'http://localhost:8000',
  mcpBaseUrl: 'http://localhost:8001',
  authEnabled: false,
  azure: { clientId: '', tenantId: '', redirectUri: '', apiScope: '' },
};

vi.mock('../config', () => ({ config: mockConfig }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('telemetry', () => {
  it('does not initialize when connection string is empty', async () => {
    mockConfig.appInsightsConnectionString = '';

    const { initTelemetry, getAppInsights } = await import('../telemetry');
    initTelemetry();

    expect(mockLoadAppInsights).not.toHaveBeenCalled();
    expect(getAppInsights()).toBeNull();
  });

  it('initializes Application Insights when connection string is set', async () => {
    mockConfig.appInsightsConnectionString = 'InstrumentationKey=test-key';

    const { initTelemetry, getAppInsights } = await import('../telemetry');
    initTelemetry();

    expect(mockLoadAppInsights).toHaveBeenCalledOnce();
    expect(getAppInsights()).not.toBeNull();
  });
});
