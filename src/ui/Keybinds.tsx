import { useInput } from 'ink';
import type { AppView } from '../state/types.js';

export type KeybindsProps = {
  enabled: boolean;
  view: AppView;
  onQuit: () => void;
  onTogglePause: () => void;
  onShowHelp: () => void;
  onToggleChat: () => void;
  onToggleCombat: () => void;
  onToggleSystem: () => void;
  onToggleMe: () => void;
  onToggleOther: () => void;
  onToggleMisc: () => void;
  onShowDetail: () => void;
  onBackToMain: () => void;
  onScrollUp: () => void;
  onScrollDown: () => void;
  onScrollToBottom: () => void;
};

export function Keybinds(props: KeybindsProps): null {
  useInput(
    (input, key) => {
      if (props.view === 'detail') {
        if (input === 'q') {
          props.onQuit();
          return;
        }
        if (key.escape || input === 'd') {
          props.onBackToMain();
          return;
        }
        return;
      }

      if (props.view === 'help') {
        if (input === 'q') {
          props.onQuit();
          return;
        }
        if (key.escape || input === '?') {
          props.onBackToMain();
          return;
        }
        return;
      }

      if (input === 'q' || key.escape) {
        props.onQuit();
        return;
      }
      if (input === 'd') {
        props.onShowDetail();
        return;
      }
      if (input === 'p') {
        props.onTogglePause();
        return;
      }
      if (input === '?') {
        props.onShowHelp();
        return;
      }
      if (input === 'c') {
        props.onToggleChat();
        return;
      }
      if (input === 'b') {
        props.onToggleCombat();
        return;
      }
      if (input === 's') {
        props.onToggleSystem();
        return;
      }
      if (input === 'm') {
        props.onToggleMe();
        return;
      }
      if (input === 'o') {
        props.onToggleOther();
        return;
      }
      if (input === 'x') {
        props.onToggleMisc();
        return;
      }
      if (key.upArrow) {
        props.onScrollUp();
        return;
      }
      if (key.downArrow) {
        props.onScrollDown();
        return;
      }
      if (input === 'e') {
        props.onScrollToBottom();
      }
    },
    { isActive: props.enabled },
  );

  return null;
}
