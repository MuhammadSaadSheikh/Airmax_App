import { ButtonBase, type ButtonBaseProps } from './ButtonBase';

export function SecondaryButton(props: Omit<ButtonBaseProps, 'variant'>) {
  return <ButtonBase {...props} variant="secondary" />;
}
