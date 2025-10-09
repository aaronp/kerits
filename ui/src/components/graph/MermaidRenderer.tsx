/**
 * MermaidRenderer - Renders Mermaid diagrams from markdown
 */

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidRendererProps {
  chart: string;
  className?: string;
}

export function MermaidRenderer({ chart, className = '' }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize mermaid with configuration
    mermaid.initialize({
      startOnLoad: true,
      theme: 'base',
      themeVariables: {
        primaryColor: '#3b82f6',
        primaryTextColor: '#fff',
        primaryBorderColor: '#2563eb',
        lineColor: '#64748b',
        secondaryColor: '#8b5cf6',
        tertiaryColor: '#f59e0b',
        background: '#ffffff',
        mainBkg: '#3b82f6',
        secondBkg: '#8b5cf6',
        tertiaryBkg: '#f59e0b',
        nodeBorder: '#2563eb',
        clusterBkg: '#f1f5f9',
        clusterBorder: '#cbd5e1',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        fontSize: '14px',
      },
      gitGraph: {
        showBranches: true,
        showCommitLabel: true,
        mainBranchName: 'KEL',
        rotateCommitLabel: false,
        parallelCommits: false,
      },
    });
  }, []);

  useEffect(() => {
    async function renderChart() {
      if (!containerRef.current || !chart) return;

      try {
        setError(null);

        // Clear previous content
        containerRef.current.innerHTML = '';

        // Generate unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

        // Render the diagram
        const { svg } = await mermaid.render(id, chart);

        // Insert the rendered SVG
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        console.error('Failed to render Mermaid diagram:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }

    renderChart();
  }, [chart]);

  if (error) {
    return (
      <div className={`text-red-500 p-4 border border-red-300 rounded ${className}`}>
        <div className="font-semibold mb-2">Failed to render diagram</div>
        <div className="text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`mermaid-container ${className}`}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '300px',
      }}
    />
  );
}
