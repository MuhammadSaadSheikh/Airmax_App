import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon, AppText, Surface } from '@/components';
import type { CustomerPackageOption as PackageOption } from '@/services/api/customers.models';
import { animation, colors, money, radius, spacing, typography } from '@/theme';

export function CustomerPackageOption({
  option,
  selected,
  current,
  onPress,
}: {
  option: PackageOption;
  selected: boolean;
  current: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${option.name}, ${option.speedMbps} Mbps`}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Surface style={[styles.card, selected && styles.selected]}>
        <View style={styles.header}>
          <View style={styles.copy}>
            <AppText style={styles.name}>{option.name}</AppText>
            <AppText style={styles.speed}>{option.speedMbps} Mbps</AppText>
          </View>
          <View style={styles.meta}>
            {current ? <AppText style={styles.current}>CURRENT</AppText> : null}
            <AppIcon
              name={selected ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={selected ? colors.primary : colors.muted}
            />
          </View>
        </View>
        <AppText style={styles.price}>{money(option.price)} / month</AppText>
        <AppText style={styles.features} numberOfLines={2}>
          {option.features.join(' · ')}
        </AppText>
      </Surface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: animation.opacity.pressed },
  card: { borderColor: colors.border },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceSelected,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  copy: { flex: 1 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { ...typography.sectionTitle, color: colors.text },
  speed: { ...typography.label, color: colors.primary, marginTop: spacing.xs },
  current: {
    ...typography.small,
    color: colors.success,
    borderRadius: radius.pill,
  },
  price: { ...typography.label, color: colors.text, marginTop: spacing.md },
  features: { ...typography.small, color: colors.muted, marginTop: spacing.sm },
});
