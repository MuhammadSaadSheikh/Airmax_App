import Ionicons from '@react-native-vector-icons/ionicons';
import LinearGradient from 'react-native-linear-gradient';
import type { ComponentProps, PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  type TextInputProps,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Text } from '@/components/AppText';
import { colors, fonts } from '@/constants/theme';
import { getScreenMetrics } from '@/utils/responsive';

type IconName = ComponentProps<typeof Ionicons>['name'];

export function Screen({
  children,
  scroll = true,
}: PropsWithChildren<{ scroll?: boolean }>) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const metrics = getScreenMetrics(width, insets.bottom);
  const responsiveContentStyle = {
    width: '100%' as const,
    maxWidth: metrics.maxWidth,
    alignSelf: 'center' as const,
    paddingHorizontal: metrics.horizontalPadding,
    paddingBottom: metrics.bottomPadding,
  };
  const content = scroll ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={[styles.content, responsiveContentStyle]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, responsiveContentStyle]}>{children}</View>
  );
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {content}
    </SafeAreaView>
  );
}

export function Header({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function Card({
  children,
  style,
}: PropsWithChildren<{ style?: object }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
}) {
  const body = (
    <View style={styles.buttonInner}>
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <>
          {icon ? (
            <Ionicons
              name={icon}
              size={18}
              color={variant === 'secondary' ? colors.primary : colors.text}
            />
          ) : null}
          <Text
            style={[
              styles.buttonText,
              variant === 'secondary' && { color: colors.primary },
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </View>
  );
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'danger' && styles.buttonDanger,
        variant === 'ghost' && styles.buttonGhost,
        (pressed || disabled) && { opacity: 0.65 },
      ]}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={[colors.electric, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {body}
        </LinearGradient>
      ) : (
        body
      )}
    </Pressable>
  );
}

export function Input({
  label,
  error,
  icon,
  style: inputStyle,
  ...props
}: TextInputProps & { label?: string; error?: string; icon?: IconName }) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrap,
          props.multiline && styles.inputWrapMultiline,
          error && { borderColor: colors.danger },
        ]}
      >
        {icon ? <Ionicons name={icon} size={19} color={colors.muted} /> : null}
        <TextInput
          {...props}
          placeholderTextColor="#60759C"
          style={[
            styles.input,
            props.multiline && styles.inputMultiline,
            inputStyle,
          ]}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function Badge({
  label,
  tone = 'info',
}: {
  label: string;
  tone?: 'info' | 'success' | 'warning' | 'danger';
}) {
  const color =
    tone === 'success'
      ? colors.success
      : tone === 'warning'
        ? colors.warning
        : tone === 'danger'
          ? colors.danger
          : colors.primary;
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: `${color}1A`, borderColor: `${color}55` },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>
        {label.toUpperCase().replace('_', ' ')}
      </Text>
    </View>
  );
}

export function IconTile({
  icon,
  color = colors.primary,
}: {
  icon: IconName;
  color?: string;
}) {
  return (
    <View style={[styles.iconTile, { backgroundColor: `${color}1A` }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
  );
}

export function Row({
  icon,
  title,
  subtitle,
  onPress,
  right,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <IconTile icon={icon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {right ??
        (onPress ? (
          <Ionicons name="chevron-forward" size={19} color={colors.muted} />
        ) : null)}
    </Pressable>
  );
}

export function StatCard({
  icon,
  label,
  value,
  color = colors.primary,
  change,
}: {
  icon: IconName;
  label: string;
  value: string;
  color?: string;
  change?: string;
}) {
  return (
    <Card style={styles.stat}>
      <IconTile icon={icon} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {change ? (
        <Text style={{ color: colors.success, fontSize: 11, marginTop: 5 }}>
          {change}
        </Text>
      ) : null}
    </Card>
  );
}

export function LoadingState() {
  return (
    <View style={styles.state}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.subtitle}>Connecting to AIRMAX…</Text>
    </View>
  );
}
export function EmptyState({
  title,
  message,
  icon = 'file-tray-outline',
}: {
  title: string;
  message: string;
  icon?: IconName;
}) {
  return (
    <View style={styles.state}>
      <IconTile icon={icon} />
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={[styles.subtitle, { textAlign: 'center' }]}>{message}</Text>
    </View>
  );
}
export function ErrorState({ retry }: { retry?: () => void }) {
  return (
    <View style={styles.state}>
      <IconTile icon="cloud-offline-outline" color={colors.danger} />
      <Text style={styles.rowTitle}>Couldn’t load this</Text>
      <Text style={styles.subtitle}>Check your connection and try again.</Text>
      {retry ? (
        <Button title="Try again" onPress={retry} variant="secondary" />
      ) : null}
    </View>
  );
}

export const ui = StyleSheet.create({
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
    fontFamily: fonts.bold,
  },
  body: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fonts.regular,
  },
  small: { color: colors.muted, fontSize: 12, fontFamily: fonts.regular },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  label: { color: '#BED0EE', fontSize: 13, fontFamily: fonts.semibold },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 18,
  },
  title: {
    color: colors.text,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.6,
    fontFamily: fonts.display,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
    fontFamily: fonts.regular,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 16,
  },
  button: {
    minHeight: 52,
    borderRadius: 15,
    overflow: 'hidden',
    justifyContent: 'center',
    marginTop: 10,
  },
  gradient: { minHeight: 52, justifyContent: 'center' },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  buttonText: { color: colors.text, fontSize: 15, fontFamily: fonts.bold },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#071C35',
  },
  buttonDanger: { backgroundColor: '#4C1624' },
  buttonGhost: { backgroundColor: 'transparent' },
  field: { gap: 7, marginBottom: 15 },
  label: { color: '#BED0EE', fontSize: 13, fontFamily: fonts.semibold },
  inputWrap: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 15,
    gap: 10,
  },
  inputWrapMultiline: {
    height: undefined,
    minHeight: 112,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.regular,
  },
  inputMultiline: { minHeight: 86, textAlignVertical: 'top' },
  error: { color: colors.danger, fontSize: 12, fontFamily: fonts.regular },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 50,
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 10, letterSpacing: 0.5, fontFamily: fonts.bold },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 13,
  },
  rowTitle: { color: colors.text, fontSize: 15, fontFamily: fonts.bold },
  rowSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
    fontFamily: fonts.regular,
  },
  stat: { width: '48%', minHeight: 150 },
  statValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 14,
    fontFamily: fonts.extraBold,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
    fontFamily: fonts.regular,
  },
  state: {
    flex: 1,
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
});
