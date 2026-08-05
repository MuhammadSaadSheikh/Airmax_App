import type { PropsWithChildren } from 'react';
import {
  ScrollView,
  type ScrollViewProps,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { colors } from '@/theme';
import { getScreenMetrics } from '@/utils/responsive';

type AppScreenProps = PropsWithChildren<{
  scroll?: boolean;
  contentContainerStyle?: ViewStyle | ViewStyle[];
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
}>;

export function AppScreen({
  children,
  scroll = true,
  contentContainerStyle,
  keyboardShouldPersistTaps = 'handled',
}: AppScreenProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const metrics = getScreenMetrics(width, insets.bottom);
  const responsiveStyle: ViewStyle = {
    width: '100%',
    maxWidth: metrics.maxWidth,
    alignSelf: 'center',
    paddingHorizontal: metrics.horizontalPadding,
    paddingBottom: metrics.bottomPadding,
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={[
            styles.content,
            responsiveStyle,
            contentContainerStyle,
          ]}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, responsiveStyle, contentContainerStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1 },
});
