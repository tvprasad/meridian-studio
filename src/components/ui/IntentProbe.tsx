// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import {
  INTENT_OPTIONS,
  TOPOLOGY_OPTIONS,
  getIntentResponse,
  type IntentKey,
  type TopologyKey,
} from '../../data/intentResponses';

interface IntentProbeProps {
  onComplete: (intent: IntentKey, topology: TopologyKey) => void;
  onSkip: () => void;
}

export function IntentProbe({ onComplete, onSkip }: IntentProbeProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [intent, setIntent] = useState<IntentKey | null>(null);
  const [topology, setTopology] = useState<TopologyKey | null>(null);

  function selectIntent(key: IntentKey) {
    setIntent(key);
    setStep(2);
  }

  function selectTopology(key: TopologyKey) {
    setTopology(key);
    setStep(3);
    if (intent) {
      onComplete(intent, key);
    }
  }

  return (
    <div className="bg-white/[0.04] rounded-xl border border-white/10 p-6 backdrop-blur-sm max-w-sm w-full">
      {/* Header with skip */}
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs uppercase tracking-widest text-white/30">
          {step === 1 && 'Quick setup'}
          {step === 2 && 'One more'}
          {step === 3 && 'Got it'}
        </p>
        <button
          onClick={onSkip}
          className="text-white/25 hover:text-white/50 transition-colors p-0.5 -mr-1 -mt-1"
          aria-label="Skip setup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Step 1: Intent */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-white/70 font-medium">
            How are you planning to use Meridian?
          </p>
          <div className="space-y-2">
            {INTENT_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => selectIntent(key)}
                className="w-full text-left px-3.5 py-2.5 rounded-lg border border-white/10 text-sm text-white/60 hover:text-white/90 hover:border-violet-500/40 hover:bg-violet-500/10 transition-all flex items-center justify-between group"
              >
                {label}
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Topology */}
      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm text-white/70 font-medium">
            Where will this run?
          </p>
          <div className="flex gap-2">
            {TOPOLOGY_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => selectTopology(key)}
                className="flex-1 px-3 py-2.5 rounded-lg border border-white/10 text-sm text-white/60 hover:text-white/90 hover:border-teal-500/40 hover:bg-teal-500/10 transition-all text-center"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Response */}
      {step === 3 && intent && topology && (
        <div className="space-y-3">
          <p className="text-sm text-white/60 leading-relaxed">
            {getIntentResponse(intent, topology)}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-white/25">
            <span className="inline-block w-1 h-1 rounded-full bg-teal-400/50" />
            Selection saved
          </div>
        </div>
      )}

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              s === step
                ? 'bg-violet-400/70'
                : s < step
                  ? 'bg-teal-400/40'
                  : 'bg-white/10'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
