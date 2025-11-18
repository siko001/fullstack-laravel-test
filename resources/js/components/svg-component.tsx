
import { useEffect, useRef, useCallback, RefObject } from "react";
import { setupHitwalls, keyHandler } from '@/lib/setup-hitwalls';

type SvgComponentProps = {
  setTooltipText: (text: string) => void;
  tooltipRef: RefObject<HTMLDivElement | null>;
  selectLine: (id: string) => void;
  loading: boolean;
  svgContent: string;
  svgContainerRef: RefObject<HTMLDivElement>;
  plan: any;
  setLoading: (loading: boolean) => void;
  setSvgContent: (svgContent: string) => void;
};

export default function SvgComponent({
   setTooltipText,
   tooltipRef,
   selectLine,
   loading,
   svgContent,
   svgContainerRef,
   plan,
   setLoading,
   setSvgContent
 }: SvgComponentProps) {
  const handlersRef = useRef<{ enter: (e: MouseEvent) => void; move: (e: MouseEvent) => void; leave: (e: MouseEvent) => void; click: (e: MouseEvent) => void } | null>(null);
  
    // Load SVG
    useEffect(() => {
      if (plan?.svg_path) {
        const fetchSvg = async () => {
          try {
            const response = await fetch(`/${plan.svg_path}`);
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
    }, [plan?.svg_path, setLoading, setSvgContent]);
    
    
    
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
          if (selectLine && id) {
            selectLine(id);
          }
        };
    
        handlersRef.current = {
          enter: handleMouseEnter,
          move: handleMouseMove,
          leave: handleMouseLeave,
          click: handleClick
        };
      }, [selectLine, setTooltipText, tooltipRef]);
    
    
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
          
          lines.forEach((line, index) => {
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
      }, [loading, setupMouseHandlers, svgContainerRef]);
    
    
    
    
    return (
     <div
        ref={svgContainerRef}
        className="p-6 bg-white rounded h-[calc(100vh-3rem)] scale-[110%] overflow-auto"
        {...(svgContent && { dangerouslySetInnerHTML: { __html: svgContent } })}
    />
    );
}