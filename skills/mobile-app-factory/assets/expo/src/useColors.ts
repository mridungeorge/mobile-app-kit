import { useColorScheme } from 'react-native';
import { makeColors } from './theme';

/** Theme comes from src/theme.ts, copied from assets/rn/theme.ts by new-app.sh. */
export function useColors() {
  const dark = useColorScheme() === 'dark';
  return { colors: makeColors(dark), dark };
}
