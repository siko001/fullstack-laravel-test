
import { useEffect, useRef, useCallback } from "react";
import { setupHitwalls, keyHandler } from '@/lib/setup-hitwalls';
export default function SvgComponent({ setTooltipText, tooltipRef, setSelectedId,loading, svgContent, svgContainerRef, project, setLoading , setSvgContent }: { svgContent: string, svgContainerRef: React.RefObject<HTMLDivElement>, project: any, setLoading: (loading: boolean) => void, setSvgContent: (svgContent: string) => void, tooltipRef: React.RefObject<HTMLDivElement | null> }) {
  const handlersRef = useRef<{ enter: (e: MouseEvent) => void; move: (e: MouseEvent) => void; leave: (e: MouseEvent) => void; click: (e: MouseEvent) => void } | null>(null);
  
    // Load SVG
    useEffect(() => {
      if (project.svg_path) {
        const fetchSvg = async () => {
          try {
            const response = await fetch(`/${project.svg_path}`);
            const svgText = await response.text();
            setSvgContent(svgText);
          } catch (error) {
            console.error('Failed to load SVG:', error);
          } finally {
            setLoading(false);
          }
        };
        fetchSvg();
      } else {
        setLoading(false);
      }
    }, []);
    
    
    
     const setupMouseHandlers = useCallback(() => {
        const handleMouseEnter = (event: MouseEvent) => {
          const tooltip = tooltipRef.current;
          if (!tooltip) return;
          const target = event.target as HTMLElement;
          const id = target.closest('g')?.id;
    
          setTooltipText(`ID: ${id}`);
          tooltip.style.left = `${event.clientX + 15}px`;
          tooltip.style.top = `${event.clientY + 15}px`;
          tooltip.style.display = 'block';
        };
    
        const handleMouseMove = (event: MouseEvent) => {
          const tooltip = tooltipRef.current;
          if (!tooltip || tooltip.style.display === 'none') return;
          tooltip.style.left = `${event.clientX + 15}px`;
          tooltip.style.top = `${event.clientY + 15}px`;
        };
    
        const handleMouseLeave = () => {
          const tooltip = tooltipRef.current;
          if (!tooltip) return;
          tooltip.style.display = 'none';
        };
    
        const handleClick = (event: MouseEvent) => {
          const target = event.target as HTMLElement;
          const id = target.closest('g')?.id;
          setSelectedId(id);
        };
    
        handlersRef.current = {
          enter: handleMouseEnter,
          move: handleMouseMove,
          leave: handleMouseLeave,
          click: handleClick
        };
      }, []);
    
    
      useEffect(() => {
        if (!loading && svgContainerRef.current) {
          setupMouseHandlers();

          const svg = svgContainerRef.current.querySelector('svg');
          const svgElements = svg?.querySelectorAll("g[id]:not([id='*Model_Space'])");
          setupHitwalls(svgElements);
    
          const svgElement = svg?.getElementById('*Model_Space');
          if (!svgElement || !handlersRef.current) return;
    
          const lines = svgElement.querySelectorAll('line');
          const handlers = handlersRef.current;
    
          lines.forEach(line => {
            line.addEventListener('mouseenter', handlers.enter);
            line.addEventListener('mousemove', handlers.move);
            line.addEventListener('click', handlers.click);
            line.addEventListener('mouseleave', handlers.leave);
          });
    
          const keyCleanup = keyHandler();
    
          return () => {
            lines.forEach(line => {
              line.removeEventListener('mouseenter', handlers.enter);
              line.removeEventListener('mousemove', handlers.move);
              line.removeEventListener('click', handlers.click);
              line.removeEventListener('mouseleave', handlers.leave);
            });
            keyCleanup();
          };
        }
      }, [loading, setupMouseHandlers]);
    
    
    
    
    return (
     <div
        ref={svgContainerRef}
        className="p-6 bg-white rounded h-[800px] overflow-auto"
        {...(svgContent && { dangerouslySetInnerHTML: { __html: svgContent } })}
    />
    );
}