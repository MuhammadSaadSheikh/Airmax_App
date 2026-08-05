import LinearGradient, {
  type LinearGradientProps,
} from 'react-native-linear-gradient';
import { gradients } from '@/theme';

export function GradientBackground({
  colors = [...gradients.primary],
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  ...props
}: LinearGradientProps) {
  return <LinearGradient {...props} colors={colors} start={start} end={end} />;
}
