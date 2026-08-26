import { describe, expect, it, vi } from 'vitest';

vi.mock('beautiful-mermaid', () => ({
  renderMermaidSVGAsync: async (source: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" data-diagram="${source.includes('A-->B') ? 'flowchart' : 'other'}"></svg>`,
}));

vi.mock('mermaid', () => {
  throw new Error('mermaid.js must not load after the renderer unifies on beautiful-mermaid');
});

const { createMarkdownMermaidConfig, createMarkdownMermaidPlugin } =
  await import('../src/components/ai-gui/markdown-mermaid');

describe('markdown mermaid plugin', () => {
  it('renders a flowchart through beautiful-mermaid', async () => {
    const plugin = createMarkdownMermaidPlugin();
    const result = await plugin
      .getMermaid(createMarkdownMermaidConfig('dark'))
      .render('diagram-1', ['graph TD', '  A-->B'].join('\n'));

    expect(result.svg).toContain('data-diagram="flowchart"');
  });

  it('keeps dark-mode mermaid colors readable', () => {
    const lightConfig = createMarkdownMermaidConfig('light');
    const darkConfig = createMarkdownMermaidConfig('dark');

    expect(lightConfig.theme).toBe('base');
    expect(darkConfig.theme).toBe('base');
    expect(darkConfig.darkMode).toBe(true);
    expect(darkConfig.themeVariables).toMatchObject({
      primaryTextColor: '#f8fafc',
      lineColor: '#cbd5e1',
      textColor: '#e2e8f0',
    });
    expect(darkConfig.themeVariables).not.toBe(lightConfig.themeVariables);
  });
});
