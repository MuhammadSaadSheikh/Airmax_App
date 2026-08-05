import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { colors, gradients } from '@/theme';
import { GradientBackground } from './GradientBackground';

export function NetworkBackground({
  children,
  style,
  ...props
}: PropsWithChildren<ViewProps>) {
  return (
    <GradientBackground
      {...props}
      colors={[...gradients.networkBackground]}
      style={[styles.root, style]}
    >
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.line, styles.lineOne]} />
        <View style={[styles.line, styles.lineTwo]} />
        <View style={[styles.node, styles.nodeOne]} />
        <View style={[styles.node, styles.nodeTwo]} />
        <View style={[styles.node, styles.nodeThree]} />
      </View>
      {children}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  line: {
    position: 'absolute',
    height: 1,
    backgroundColor: colors.borderStrong,
    opacity: 0.3,
  },
  lineOne: {
    width: '70%',
    top: '24%',
    left: '-5%',
    transform: [{ rotate: '18deg' }],
  },
  lineTwo: {
    width: '65%',
    right: '-10%',
    bottom: '28%',
    transform: [{ rotate: '-22deg' }],
  },
  node: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    opacity: 0.45,
  },
  nodeOne: { top: '18%', left: '22%' },
  nodeTwo: { top: '42%', right: '14%' },
  nodeThree: { bottom: '19%', left: '38%' },
});
