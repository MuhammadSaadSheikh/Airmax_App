import { AppText as Text } from '@/components/foundation/AppText';
import Ionicons from '@react-native-vector-icons/ionicons';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { useEffect } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { useAuthStore } from '@/store/auth.store';
import { animation, colors, fonts, gradients } from '@/theme';
import { navigationActions } from '@/navigation';
import splashBackground from '../../../../assets/images/splash.png';

export default function Splash() {
  const { user, hydrated } = useAuthStore();
  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(
      () =>
        user
          ? navigationActions.showPortal(user.role)
          : navigationActions.showAuth(),
      animation.duration.splash,
    );
    return () => clearTimeout(timer);
  }, [hydrated, user]);
  return (
    <ImageBackground
      source={splashBackground}
      style={styles.page}
      resizeMode="cover"
    >
      <LinearGradient
        colors={[...gradients.splashOverlay]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Ionicons name="wifi" size={37} color={colors.primary} />
        </View>
        <Text style={styles.name}>AIRMAX</Text>
        <Text style={styles.service}>INTERNET SERVICES</Text>
      </View>
      <View style={styles.footer}>
        <View style={styles.line} />
        <Text style={styles.tagline}>Faster Connection, Better Life</Text>
      </View>
    </ImageBackground>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  brand: { alignItems: 'center', marginTop: -120 },
  logo: {
    width: 78,
    height: 78,
    borderRadius: 24,
    backgroundColor: colors.overlayBrand,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.8,
    shadowRadius: 24,
  },
  name: {
    color: colors.white,
    fontSize: 44,
    fontFamily: fonts.display,
    letterSpacing: 5,
    marginTop: 20,
  },
  service: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 4,
    marginTop: 4,
  },
  footer: { position: 'absolute', bottom: 62, alignItems: 'center' },
  line: {
    width: 42,
    height: 2,
    backgroundColor: colors.primary,
    marginBottom: 14,
  },
  tagline: { color: colors.textSplash, fontSize: 14, letterSpacing: 0.5 },
});
