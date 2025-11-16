import { useEffect, useState, useRef, useCallback } from 'react';

import ProjectDetailCard from '@/components/project-detail-card';
import SvgComponent from '@/components/svg-component';

export default function ProjectInner({ project, url }: { project: any, url: string }) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previousIds, setPreviousIds] = useState<string | null>([]);
  
  const [tooltipText, setTooltipText] = useState<string | null>(null);
  const [selectedToolTip, setSelectedTooltipText] = useState<string | null>(null);
  
  
  
    const svgContainerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const persistantTooltipRef = useRef<HTMLDivElement>(null);

  const selectLine = (id: string) => {
    setSelectedId(id);
    setSelectedTooltipText(id);
    if (persistantTooltipRef.current) {
        persistantTooltipRef.current.style.display = 'inline-block';
        persistantTooltipRef.current.style.position = 'fixed';
        persistantTooltipRef.current.style.left = `${event.clientX + 15}px`;
        persistantTooltipRef.current.style.top = `${event.clientY + 15}px`;
    }
  };
  
  const highlightLine = (id: string) => {
    const line = document?.getElementById(id)?.nextSibling;
        line.style.stroke = 'red';
        line.style.strokeWidth = '20px';
        setPreviousIds([...previousIds, id]);
  };
  
  
  const unhighlightLine = (id: string) => {
    const line = document?.getElementById(id)?.nextSibling;
    if (line) {
      line.style.stroke = 'black';
      line.style.strokeWidth = '8px';
    }
  };
  
    useEffect(() => {
    if (!selectedId) return;
    previousIds.forEach(id => {
        if (id !== selectedId) unhighlightLine(id);
    });

    highlightLine(selectedId);
    if (previousIds.length !== 1 || previousIds[0] !== selectedId) {
        setPreviousIds([selectedId]);
    }
    }, [selectedId]);



  
  
  
  return (
    <div>
      {project && <ProjectDetailCard project={project} />}
      <div className="max-h-screen min-h-screen grid place-items-center">
        <div className="max-h-[800px] mx-auto mt-8">
            <SvgComponent selectLine={selectLine} svgContent={svgContent || ""} project={project} svgContainerRef={svgContainerRef || ''} setLoading={setLoading} setSvgContent={setSvgContent}  setTooltipText={setTooltipText} tooltipRef={tooltipRef} setSelectedId={setSelectedId} loading={loading}  />
        </div>
      </div>

    {/* hover Tooltip */}
      <div ref={tooltipRef} className='hover-tooltip' style={{ position: 'fixed', display: 'none', pointerEvents: 'none', zIndex: 50 }} >
        {tooltipText}
      </div >
      
      <div ref={persistantTooltipRef} className='persistant-tooltip hover-tooltip' >
        {selectedToolTip}
      </div>
    

      <div className="fixed top-4 right-4">Group Info</div>
      <div className="fixed bottom-4 right-4">Group ToolTip</div>
    </div>
  );
}
