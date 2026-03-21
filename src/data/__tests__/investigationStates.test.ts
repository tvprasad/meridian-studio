// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { describe, it, expect } from 'vitest';
import {
  STATUS_META,
  TIMELINE_STATES,
  APPROVAL_GATE_INDEX,
  AGENT_ROLE_META,
  STATUS_GROUPS,
} from '../investigationStates';

describe('investigationStates data', () => {
  it('defines metadata for all 13 statuses', () => {
    const allStatuses = [
      'INTAKE', 'RESEARCH', 'DATA_ANALYSIS', 'POLICY_EVALUATE',
      'AWAITING_APPROVAL', 'APPROVED', 'EXECUTING',
      'COMPLETED', 'NO_ACTION_REQUIRED', 'INSUFFICIENT_DATA',
      'REJECTED', 'EXPIRED', 'FAILED',
    ];
    allStatuses.forEach((s) => {
      expect(STATUS_META[s as keyof typeof STATUS_META]).toBeDefined();
      expect(STATUS_META[s as keyof typeof STATUS_META].label).toBeTruthy();
      expect(STATUS_META[s as keyof typeof STATUS_META].color).toBeTruthy();
    });
  });

  it('has 8 happy-path timeline states', () => {
    expect(TIMELINE_STATES).toHaveLength(8);
    expect(TIMELINE_STATES[0]).toBe('INTAKE');
    expect(TIMELINE_STATES[7]).toBe('COMPLETED');
  });

  it('places approval gate at index 4 (AWAITING_APPROVAL)', () => {
    expect(APPROVAL_GATE_INDEX).toBe(4);
    expect(TIMELINE_STATES[APPROVAL_GATE_INDEX]).toBe('AWAITING_APPROVAL');
  });

  it('defines agent role metadata for all roles', () => {
    const roles = ['intake', 'research', 'analysis', 'policy', 'execution', 'machine', 'system'];
    roles.forEach((r) => {
      expect(AGENT_ROLE_META[r]).toBeDefined();
      expect(AGENT_ROLE_META[r].label).toBeTruthy();
    });
  });

  it('status groups cover all 13 statuses without overlap', () => {
    const allGrouped = [...STATUS_GROUPS.active, ...STATUS_GROUPS.awaiting, ...STATUS_GROUPS.terminal];
    expect(allGrouped).toHaveLength(13);
    const unique = new Set(allGrouped);
    expect(unique.size).toBe(13);
  });

  it('timeline states are in ascending order', () => {
    for (let i = 1; i < TIMELINE_STATES.length; i++) {
      const prev = STATUS_META[TIMELINE_STATES[i - 1]].order;
      const curr = STATUS_META[TIMELINE_STATES[i]].order;
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });
});
