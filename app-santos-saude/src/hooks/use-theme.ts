/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useAppTheme } from '@/contexts/ThemeContext';

export function useTheme() {
  return useAppTheme().theme;
}
