import { Text as RNText, TextProps as RNTextProps } from 'react-native';

interface TextProps extends RNTextProps {}

export function Text(props: TextProps) {
  return <RNText {...props} />;
} 