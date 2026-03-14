// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { useContext } from 'react';
import { DiagnosticsContext } from './DiagnosticsContext';

export function useDiagnostics() {
  const ctx = useContext(DiagnosticsContext);
  if (!ctx) throw new Error('useDiagnostics must be used within DiagnosticsProvider');
  return ctx;
}
