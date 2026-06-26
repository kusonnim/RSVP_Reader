export type HapticPattern = number | number[];

export function vibrate(pattern: HapticPattern) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}
