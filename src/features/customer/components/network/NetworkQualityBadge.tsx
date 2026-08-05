import { memo } from 'react';
import { StatusBadge } from '@/components';
import type { NetworkQuality } from '@/services/network';

function NetworkQualityBadgeComponent({ quality }: { quality: NetworkQuality }) {
  const tone =
    quality === 'excellent' || quality === 'good'
      ? 'success'
      : quality === 'fair'
        ? 'warning'
        : 'danger';
  return <StatusBadge label={quality} tone={tone} />;
}

export const NetworkQualityBadge = memo(NetworkQualityBadgeComponent);
