import type { RenderOptions } from 'beautiful-mermaid';
import type { MermaidConfig } from 'mermaid';
import type { DiagramPlugin } from 'streamdown';

import type { ResolvedTheme } from '../../theme-provider';

const MERMAID_FONT_FAMILY =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const MERMAID_BASE_CONFIG = {
  fontFamily: MERMAID_FONT_FAMILY,
  securityLevel: 'strict',
  startOnLoad: false,
  suppressErrorRendering: true,
  theme: 'base',
} satisfies MermaidConfig;

const MERMAID_LIGHT_THEME_VARIABLES = {
  background: '#ffffff',
  mainBkg: '#f8fafc',
  secondaryColor: '#eef6ff',
  tertiaryColor: '#f1f5f9',
  primaryColor: '#eef6ff',
  primaryBorderColor: '#60a5fa',
  primaryTextColor: '#0f172a',
  secondaryTextColor: '#0f172a',
  tertiaryTextColor: '#0f172a',
  lineColor: '#64748b',
  textColor: '#0f172a',
  titleColor: '#0f172a',
  defaultLinkColor: '#64748b',
  edgeLabelBackground: '#ffffff',
  nodeBorder: '#60a5fa',
  clusterBkg: '#f8fafc',
  clusterBorder: '#cbd5e1',
  actorBkg: '#f8fafc',
  actorBorder: '#60a5fa',
  actorTextColor: '#0f172a',
  signalColor: '#64748b',
  signalTextColor: '#0f172a',
  labelBoxBkgColor: '#ffffff',
  labelBoxBorderColor: '#cbd5e1',
  labelTextColor: '#0f172a',
  loopTextColor: '#0f172a',
  noteBkgColor: '#fffbeb',
  noteTextColor: '#78350f',
  noteBorderColor: '#f59e0b',
  activationBkgColor: '#dbeafe',
  activationBorderColor: '#60a5fa',
  sequenceNumberColor: '#475569',
};

const MERMAID_DARK_THEME_VARIABLES = {
  background: '#0b1120',
  mainBkg: '#111827',
  secondaryColor: '#172033',
  tertiaryColor: '#1e293b',
  primaryColor: '#172033',
  primaryBorderColor: '#60a5fa',
  primaryTextColor: '#f8fafc',
  secondaryTextColor: '#f8fafc',
  tertiaryTextColor: '#f8fafc',
  lineColor: '#cbd5e1',
  textColor: '#e2e8f0',
  titleColor: '#f8fafc',
  defaultLinkColor: '#cbd5e1',
  edgeLabelBackground: '#0b1120',
  nodeBorder: '#60a5fa',
  clusterBkg: '#0f172a',
  clusterBorder: '#475569',
  actorBkg: '#111827',
  actorBorder: '#60a5fa',
  actorTextColor: '#f8fafc',
  signalColor: '#cbd5e1',
  signalTextColor: '#f8fafc',
  labelBoxBkgColor: '#111827',
  labelBoxBorderColor: '#475569',
  labelTextColor: '#f8fafc',
  loopTextColor: '#f8fafc',
  noteBkgColor: '#422006',
  noteTextColor: '#fffbeb',
  noteBorderColor: '#f59e0b',
  activationBkgColor: '#1e3a5f',
  activationBorderColor: '#60a5fa',
  sequenceNumberColor: '#cbd5e1',
};

export const createMarkdownMermaidConfig = (theme: ResolvedTheme): MermaidConfig => ({
  ...MERMAID_BASE_CONFIG,
  darkMode: theme === 'dark',
  themeVariables:
    theme === 'dark' ? { ...MERMAID_DARK_THEME_VARIABLES } : { ...MERMAID_LIGHT_THEME_VARIABLES },
});

const mermaidConfigToRenderOptions = (config: MermaidConfig): RenderOptions => {
  const themeVariables = config.themeVariables ?? {};
  return {
    bg: themeVariables.background,
    fg: themeVariables.textColor,
    line: themeVariables.lineColor,
    accent: themeVariables.primaryBorderColor,
    muted: themeVariables.sequenceNumberColor,
    surface: themeVariables.mainBkg,
    border: themeVariables.nodeBorder,
    font: typeof config.fontFamily === 'string' ? config.fontFamily : MERMAID_FONT_FAMILY,
    transparent: false,
  };
};

const escapeXml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const renderMermaidLoadFallback = (source: string): { svg: string } => {
  const lines = source.split('\n').slice(0, 12);
  const truncated = source.split('\n').length > lines.length;
  const text = lines.map((line) => escapeXml(line)).join('\n');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="${
    24 + lines.length * 16 + (truncated ? 16 : 0)
  }" viewBox="0 0 480 ${24 + lines.length * 16 + (truncated ? 16 : 0)}">
  <rect width="100%" height="100%" fill="#fef3c7" rx="6" />
  <text x="12" y="18" font-family="ui-monospace,monospace" font-size="11" fill="#92400e">Diagram unavailable in this browser</text>
  <text x="12" y="40" font-family="ui-monospace,monospace" font-size="11" fill="#78350f"><tspan>${text}</tspan>${
    truncated ? '<tspan x="12" dy="16">…</tspan>' : ''
  }</text>
</svg>`;
  return { svg };
};

type BeautifulMermaidRuntime = typeof import('beautiful-mermaid');

export const createMarkdownMermaidPlugin = (): DiagramPlugin => {
  let runtimePromise: Promise<BeautifulMermaidRuntime> | null = null;
  let runtimeUnavailable = false;
  let currentConfig: MermaidConfig = createMarkdownMermaidConfig('light');

  const loadRuntime = async (): Promise<BeautifulMermaidRuntime | null> => {
    if (runtimeUnavailable) return null;
    runtimePromise ??= import('beautiful-mermaid');
    try {
      return await runtimePromise;
    } catch (error) {
      runtimeUnavailable = true;
      runtimePromise = null;
      console.warn('[Lody] Mermaid runtime failed to load; falling back to static text.', error);
      return null;
    }
  };

  return {
    name: 'mermaid',
    type: 'diagram',
    language: 'mermaid',
    getMermaid: (config?: MermaidConfig) => {
      if (config) {
        currentConfig = { ...MERMAID_BASE_CONFIG, ...config };
      }
      return {
        initialize: (nextConfig: MermaidConfig) => {
          currentConfig = { ...MERMAID_BASE_CONFIG, ...nextConfig };
        },
        render: async (_id: string, source: string) => {
          const runtime = await loadRuntime();
          if (!runtime) {
            return renderMermaidLoadFallback(source);
          }
          try {
            return {
              svg: await runtime.renderMermaidSVGAsync(
                source,
                mermaidConfigToRenderOptions(currentConfig)
              ),
            };
          } catch (error) {
            console.warn('[Lody] Mermaid render failed; using fallback.', error);
            return renderMermaidLoadFallback(source);
          }
        },
      };
    },
  };
};
