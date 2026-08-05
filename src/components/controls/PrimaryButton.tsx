import { ButtonBase, type ButtonBaseProps } from './ButtonBase';

export function PrimaryButton(props: Omit<ButtonBaseProps, 'variant'>) {
  return <ButtonBase {...props} variant="primary" />;
}
