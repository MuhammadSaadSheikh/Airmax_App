import { AppText as Text } from '@/components/foundation/AppText';
import Ionicons from '@react-native-vector-icons/ionicons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthNavigation } from '@/navigation';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Card, Input, Screen, ui } from '@/components';
import { colors } from '@/theme';
import { loginSchema, type LoginValues } from '@/features/auth/schema';
import { useAuthStore } from '@/store/auth.store';
import { environment } from '@/config/environment';

export default function Login() {
  const navigation = useAuthNavigation();
  const login = useAuthStore(s => s.login);
  const authStatus = useAuthStore(s => s.status);
  const authError = useAuthStore(s => s.error);
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
      role: 'customer',
    },
  });
  const role = useWatch({ control, name: 'role' });
  const submit = async (v: LoginValues) => {
    try {
      await login({
        identifier: v.identifier,
        password: v.password,
        mockRole: environment.allowsMockAuth ? v.role : undefined,
      });
    } catch {
      // The store owns the user-facing authentication error.
    }
  };
  return (
    <Screen>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Ionicons name="wifi" size={31} color={colors.primary} />
        </View>
        <Text style={styles.name}>AIRMAX</Text>
        <Text style={ui.body}>Faster Connection, Better Life</Text>
      </View>
      <Card>
        <Text style={styles.heading}>Welcome back</Text>
        <Text style={[ui.body, { marginTop: 5, marginBottom: 20 }]}>
          Sign in to manage your connection.
        </Text>
        {environment.allowsMockAuth ? (
          <View style={styles.switch}>
            <Pressable
              onPress={() => setValue('role', 'customer')}
              style={[styles.switchItem, role === 'customer' && styles.active]}
            >
              <Text
                style={[
                  styles.switchText,
                  role === 'customer' && styles.activeText,
                ]}
              >
                Customer
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setValue('role', 'admin')}
              style={[styles.switchItem, role === 'admin' && styles.active]}
            >
              <Text
                style={[
                  styles.switchText,
                  role === 'admin' && styles.activeText,
                ]}
              >
                Admin
              </Text>
            </Pressable>
          </View>
        ) : null}
        <Controller
          control={control}
          name="identifier"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Phone or email"
              icon="person-outline"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="none"
              error={errors.identifier?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Password"
              icon="lock-closed-outline"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              error={errors.password?.message}
            />
          )}
        />
        {!environment.isProduction ? (
          <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgot}>Forgot password?</Text>
          </Pressable>
        ) : null}
        {authError ? <Text style={styles.error}>{authError}</Text> : null}
        <Button
          title="Sign in"
          icon="arrow-forward"
          loading={isSubmitting || authStatus === 'authenticating'}
          onPress={handleSubmit(submit)}
        />
        <Button
          title="Sign in with OTP"
          variant="secondary"
          icon="phone-portrait-outline"
          onPress={() => navigation.navigate('Otp')}
        />
      </Card>
      <Pressable onPress={() => navigation.navigate('InstallationRequest')}>
        <Text style={styles.install}>
          New to AIRMAX?{' '}
          <Text style={{ color: colors.primary, fontWeight: '800' }}>
            Request installation
          </Text>
        </Text>
      </Pressable>
    </Screen>
  );
}
const styles = StyleSheet.create({
  brand: { alignItems: 'center', paddingTop: 34, paddingBottom: 28 },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.surfaceBrand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  name: {
    fontSize: 29,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 4,
    marginTop: 12,
  },
  heading: { color: colors.text, fontSize: 23, fontWeight: '800' },
  switch: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  switchItem: { flex: 1, padding: 11, alignItems: 'center', borderRadius: 9 },
  active: { backgroundColor: colors.surface2 },
  switchText: { color: colors.muted, fontWeight: '700' },
  activeText: { color: colors.primary },
  forgot: {
    color: colors.primary,
    textAlign: 'right',
    fontWeight: '700',
    fontSize: 13,
    marginTop: -4,
    marginBottom: 4,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: 10,
  },
  install: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: 22,
    fontSize: 13,
  },
});
