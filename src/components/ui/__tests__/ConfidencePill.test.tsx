// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConfidencePill } from '../ConfidencePill';

describe('ConfidencePill', () => {
  it('renders simple percentage when rawScore is absent', () => {
    const { container } = render(<ConfidencePill score={0.75} />);
    expect(container.textContent).toBe('75.0% confidence');
  });

  it('renders threshold display when threshold is provided', () => {
    const { container } = render(<ConfidencePill score={0.75} threshold={0.6} />);
    expect(container.textContent).toBe('75.0% / 60% threshold');
  });

  it('renders calibrated display when rawScore differs from score', () => {
    render(<ConfidencePill score={0.82} rawScore={0.76} />);
    expect(screen.getByText('76.0% → 82.0%')).toBeInTheDocument();
  });

  it('applies emerald styling when score passes threshold', () => {
    const { container } = render(<ConfidencePill score={0.75} threshold={0.6} />);
    const pill = container.firstChild as HTMLElement;
    expect(pill.className).toContain('bg-emerald-50');
  });

  it('applies red styling when score fails threshold', () => {
    const { container } = render(<ConfidencePill score={0.35} threshold={0.6} />);
    const pill = container.firstChild as HTMLElement;
    expect(pill.className).toContain('bg-red-50');
  });

  it('does not show calibrated display when rawScore matches score', () => {
    const { container } = render(<ConfidencePill score={0.75} rawScore={0.75} />);
    expect(container.textContent).toBe('75.0% confidence');
  });
});
