import type { TextInputProps } from 'react-native';
import { TextField } from './TextField';

export function SearchField(props: Omit<TextInputProps, 'secureTextEntry'>) {
  return (
    <TextField
      {...props}
      accessibilityRole="search"
      icon="search"
      returnKeyType={props.returnKeyType ?? 'search'}
    />
  );
}
