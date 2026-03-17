// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { config } from './config';

let appInsights: ApplicationInsights | null = null;

export function initTelemetry(): void {
  if (!config.appInsightsConnectionString) return;

  appInsights = new ApplicationInsights({
    config: {
      connectionString: config.appInsightsConnectionString,
      enableAutoRouteTracking: true,
      disableCookiesUsage: false,
    },
  });

  appInsights.loadAppInsights();
}

export function getAppInsights(): ApplicationInsights | null {
  return appInsights;
}
