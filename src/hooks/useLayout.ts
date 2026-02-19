import { useStdin, useStdout } from 'ink';

const HEADER_HEIGHT_DEFAULT = 5;
const MIN_EVENT_HEIGHT = 4;
const COMPACT_PANELS_THRESHOLD = 11;
const MAX_PANEL_HEIGHT = 11;

export type Layout = {
  supportsRawMode: boolean;
  terminalRows: number;
  terminalCols: number;
  headerHeight: number;
  footerHeight: number;
  panelsHeight: number;
  compactRows: boolean;
  panelWidth: number;
  textWidth: number;
  eventHeight: number;
  eventRows: number;
};

export function useLayout(): Layout {
  const stdin = useStdin();
  const { stdout } = useStdout();
  const supportsRawMode = stdin?.isRawModeSupported ?? false;
  const terminalRows = stdout?.rows ?? 40;
  const terminalCols = stdout?.columns ?? 120;
  const headerHeight = terminalRows < 22 ? 4 : HEADER_HEIGHT_DEFAULT;
  const footerHeight = 3;
  const minPanelsHeight = 8;
  const panelsHeight = Math.min(
    Math.max(minPanelsHeight, Math.floor((terminalRows - headerHeight - footerHeight) * 0.35)),
    MAX_PANEL_HEIGHT,
  );
  const compactRows = panelsHeight < COMPACT_PANELS_THRESHOLD;
  const panelWidth = Math.max(24, Math.floor((terminalCols - 8) / 3));
  const textWidth = Math.max(24, terminalCols - 10);
  const eventHeight = Math.max(
    MIN_EVENT_HEIGHT,
    terminalRows - headerHeight - panelsHeight - footerHeight,
  );
  const eventRows = Math.max(1, eventHeight - 3);

  return {
    supportsRawMode,
    terminalRows,
    terminalCols,
    headerHeight,
    footerHeight,
    panelsHeight,
    compactRows,
    panelWidth,
    textWidth,
    eventHeight,
    eventRows,
  };
}
