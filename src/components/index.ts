export * from './foundation/AppHeader';
export * from './foundation/AppIcon';
export * from './foundation/AppScreen';
export * from './foundation/AppText';
export * from './foundation/Divider';
export * from './foundation/GradientBackground';
export * from './foundation/NetworkBackground';
export * from './foundation/Surface';
export * from './controls/PrimaryButton';
export * from './controls/SearchField';
export * from './controls/SecondaryButton';
export * from './controls/SelectField';
export * from './controls/StatusBadge';
export * from './controls/TextField';
export * from './states/EmptyState';
export * from './states/ErrorState';
export * from './states/LoadingState';
export * from './states/OfflineBanner';
export * from './states/SkeletonCard';
export * from './states/FeatureSkeletons';
export * from './composites/DataDisplay';
export * from './styles';

// Compatibility names keep Phase 1 behavior stable while screens adopt the new primitives.
export { AppHeader as Header } from './foundation/AppHeader';
export { AppScreen as Screen } from './foundation/AppScreen';
export { AppText as Text } from './foundation/AppText';
export { Surface as Card } from './foundation/Surface';
export { StatusBadge as Badge } from './controls/StatusBadge';
export { TextField as Input } from './controls/TextField';

export { ButtonBase as Button } from './controls/ButtonBase';
