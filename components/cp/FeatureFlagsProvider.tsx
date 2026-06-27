'use client';

import { createContext, useContext } from 'react';
import { DEFAULT_FEATURE_FLAGS } from '@/lib/feature-flags';
import type { FeatureFlags } from '@/lib/feature-flags';

const FeatureFlagsContext = createContext<FeatureFlags>(DEFAULT_FEATURE_FLAGS);

export function FeatureFlagsProvider({
  value,
  children,
}: {
  value: FeatureFlags;
  children: React.ReactNode;
}) {
  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
}

export function useFeatureFlags(): FeatureFlags {
  return useContext(FeatureFlagsContext);
}
