export const colors = {
  primary: '#c2185b',
  white: '#fff',
  text: '#1a2332',
  textSecondary: '#5c6b7a',
  bg: '#fff',
  bgLayout: '#f7f0f3',
  border: '#c9a0b0',
  success: '#2f7d4a',
  warning: '#d48806',
  error: '#cf1322',
  info: '#c2185b',
  shadow: 'rgb(26 35 50 / 8%)',
} as const;

export const colorVariables = {
  'color-primary': colors.primary,
  'color-white': colors.white,
  'color-text': colors.text,
  'color-text-secondary': colors.textSecondary,
  'color-bg': colors.bg,
  'color-bg-layout': colors.bgLayout,
  'color-border': colors.border,
  'color-success': colors.success,
  'color-warning': colors.warning,
  'color-error': colors.error,
  'color-info': colors.info,
  'color-shadow': colors.shadow,
} as const;
