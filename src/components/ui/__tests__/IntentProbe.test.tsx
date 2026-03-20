// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { IntentProbe } from '../IntentProbe';

describe('IntentProbe', () => {
  const onComplete = vi.fn();
  const onSkip = vi.fn();

  beforeEach(() => {
    onComplete.mockReset();
    onSkip.mockReset();
  });

  afterEach(() => cleanup());

  function renderProbe() {
    return render(<IntentProbe onComplete={onComplete} onSkip={onSkip} />);
  }

  it('renders step 1 with intent options', () => {
    renderProbe();
    expect(screen.getByText('How are you planning to use Meridian?')).toBeInTheDocument();
    expect(screen.getByText('Evaluate retrieval behavior')).toBeInTheDocument();
    expect(screen.getByText('Build a production system')).toBeInTheDocument();
    expect(screen.getByText('Test locally (on-prem / private)')).toBeInTheDocument();
    expect(screen.getByText('Explore capabilities')).toBeInTheDocument();
  });

  it('advances to step 2 after selecting intent', () => {
    renderProbe();
    fireEvent.click(screen.getByText('Build a production system'));
    expect(screen.getByText('Where will this run?')).toBeInTheDocument();
    expect(screen.getByText('Cloud')).toBeInTheDocument();
    expect(screen.getByText('Hybrid')).toBeInTheDocument();
    expect(screen.getByText('On-prem')).toBeInTheDocument();
  });

  it('completes after selecting topology and calls onComplete', () => {
    renderProbe();
    fireEvent.click(screen.getByText('Evaluate retrieval behavior'));
    fireEvent.click(screen.getByText('On-prem'));
    expect(onComplete).toHaveBeenCalledWith('evaluate', 'on-prem');
    expect(screen.getByText('Selection saved')).toBeInTheDocument();
    expect(screen.getByText(/on-prem environments/i)).toBeInTheDocument();
  });

  it('calls onSkip when skip button is clicked on step 1', () => {
    renderProbe();
    fireEvent.click(screen.getByLabelText('Skip setup'));
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it('calls onSkip when skip button is clicked on step 2', () => {
    renderProbe();
    fireEvent.click(screen.getByText('Explore capabilities'));
    fireEvent.click(screen.getByLabelText('Skip setup'));
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it('shows contextual response for cloud + build combination', () => {
    renderProbe();
    fireEvent.click(screen.getByText('Build a production system'));
    fireEvent.click(screen.getByText('Cloud'));
    expect(onComplete).toHaveBeenCalledWith('build', 'cloud');
    expect(screen.getByText(/Azure managed services/i)).toBeInTheDocument();
  });
});
