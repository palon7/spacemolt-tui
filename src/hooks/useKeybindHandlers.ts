import type React from 'react';
import { useCallback } from 'react';
import type { AppState } from '../state/types.js';
import type { KeybindsProps } from '../ui/Keybinds.js';
import type { WsClient } from '../ws/client.js';

type Opts = {
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  wsRef: React.MutableRefObject<WsClient | null>;
  exit: () => void;
};

export function useKeybindHandlers({
  setState,
  wsRef,
  exit,
}: Opts): Omit<
  KeybindsProps,
  'enabled' | 'view' | 'onScrollUp' | 'onScrollDown' | 'onScrollToBottom'
> {
  const onQuit = useCallback(() => {
    wsRef.current?.close();
    exit();
  }, [exit, wsRef]);
  const onTogglePause = useCallback(
    () => setState((prev) => ({ ...prev, paused: !prev.paused })),
    [setState],
  );
  const onShowHelp = useCallback(() => setState((prev) => ({ ...prev, view: 'help' })), [setState]);
  const onToggleChat = useCallback(
    () => setState((prev) => ({ ...prev, filters: { ...prev.filters, chat: !prev.filters.chat } })),
    [setState],
  );
  const onToggleCombat = useCallback(
    () =>
      setState((prev) => ({
        ...prev,
        filters: { ...prev.filters, combat: !prev.filters.combat },
      })),
    [setState],
  );
  const onToggleSystem = useCallback(
    () =>
      setState((prev) => ({
        ...prev,
        filters: { ...prev.filters, system: !prev.filters.system },
      })),
    [setState],
  );
  const onToggleMe = useCallback(
    () => setState((prev) => ({ ...prev, filters: { ...prev.filters, me: !prev.filters.me } })),
    [setState],
  );
  const onToggleOther = useCallback(
    () =>
      setState((prev) => ({ ...prev, filters: { ...prev.filters, other: !prev.filters.other } })),
    [setState],
  );
  const onToggleMisc = useCallback(
    () => setState((prev) => ({ ...prev, filters: { ...prev.filters, misc: !prev.filters.misc } })),
    [setState],
  );
  const onShowDetail = useCallback(
    () => setState((prev) => ({ ...prev, view: 'detail' })),
    [setState],
  );
  const onBackToMain = useCallback(
    () => setState((prev) => ({ ...prev, view: 'main' })),
    [setState],
  );

  return {
    onQuit,
    onTogglePause,
    onShowHelp,
    onToggleChat,
    onToggleCombat,
    onToggleSystem,
    onToggleMe,
    onToggleOther,
    onToggleMisc,
    onShowDetail,
    onBackToMain,
  };
}
