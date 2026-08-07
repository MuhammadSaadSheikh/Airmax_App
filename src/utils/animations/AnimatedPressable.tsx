import { useEffect, useState, type PropsWithChildren } from 'react';
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { animation } from '@/theme';

const ReanimatedPressable = Animated.createAnimatedComponent(Pressable);

const animateScale = (
  scale: SharedValue<number>,
  value: number,
  reduceMotion: boolean,
) => {
  scale.value = reduceMotion
    ? value
    : withSpring(value, animation.spring.responsive);
};

type Props = PropsWithChildren<
  Omit<PressableProps, 'style' | 'onPressIn' | 'onPressOut'> & {
    style?: StyleProp<ViewStyle>;
    pressedScale?: number;
  }
>;

export function AnimatedPressable({
  children,
  disabled,
  style,
  pressedScale = 0.98,
  ...props
}: Props) {
  const reduceMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  useEffect(() => {
    const value = pressed ? pressedScale : 1;
    animateScale(scale, value, reduceMotion);
  }, [pressed, pressedScale, reduceMotion, scale]);

  return (
    <ReanimatedPressable
      {...props}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[style, animatedStyle, disabled && styles.disabled]}
    >
      {children}
    </ReanimatedPressable>
  );
}

const styles = { disabled: { opacity: animation.opacity.disabled } } as const;
