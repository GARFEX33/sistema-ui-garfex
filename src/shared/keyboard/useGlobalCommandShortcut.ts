/** Compatibility hook: the shell-local KeyboardController owns the listener. */
export function useGlobalCommandShortcut(
  onOpen?: (opener: HTMLElement | null) => void,
  overlayOpen?: boolean,
) {
  void onOpen
  void overlayOpen
  return undefined
}
