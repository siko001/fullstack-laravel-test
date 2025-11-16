import { useEffect, useState, useRef, useCallback } from 'react';

import ProjectDetailCard from '@/components/project-detail-card';
import SvgComponent from '@/components/svg-component';

export default function ProjectInner({ project, url }: { project: any, url: string }) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previousIds, setPreviousIds] = useState<string | null>([]);
  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const [groups, setGroups] = useState<{[key: string]: {name: string, lines: string[]}}>({});
  const [groupNames, setGroupNames] = useState<{[key: string]: string}>({});
  const [currentGroup, setCurrentGroup] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  
  // Load groups from localStorage on component mount
  useEffect(() => {
    const savedGroups = localStorage.getItem('lineGroups');
    
    if (savedGroups) {
      try {
        const parsedGroups = JSON.parse(savedGroups);
        
        // Check if groups are in old format (just arrays) or new format (objects with name and lines)
        const isFirstGroup = Object.values(parsedGroups)[0];
        const isOldFormat = Array.isArray(isFirstGroup);
        
        if (isOldFormat) {
          // Convert old format to new format
          const convertedGroups: {[key: string]: {name: string, lines: string[]}} = {};
          Object.entries(parsedGroups).forEach(([groupId, lines]) => {
            convertedGroups[groupId] = {
              name: `Group ${groupId.split('-')[1]}`,
              lines: lines as string[]
            };
          });
          setGroups(convertedGroups);
          localStorage.setItem('lineGroups', JSON.stringify(convertedGroups));
        } else {
          setGroups(parsedGroups);
        }
      } catch (error) {
        console.error('Failed to load groups from localStorage:', error);
      }
    }
  }, []);
  
  const [tooltipText, setTooltipText] = useState<string | null>(null);
  const [selectedToolTip, setSelectedTooltipText] = useState<string | null>(null);
  
  
  
    const svgContainerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const persistantTooltipRef = useRef<HTMLDivElement>(null);

  const selectLine = (id: string) => {
    if (!id) return;
    
    setSelectedId(id);
    setSelectedTooltipText(id);
    
    // Toggle line selection for multi-selection
    setSelectedLines(prev => {
      console.log('Current selectedLines before toggle:', prev);
      console.log('Toggling line:', id);
      
      if (prev.includes(id)) {
        const newSelection = prev.filter(lineId => lineId !== id);
        console.log('Deselecting line, new selection:', newSelection);
        return newSelection;
      } else {
        const newSelection = [...prev, id];
        console.log('Selecting line, new selection:', newSelection);
        return newSelection;
      }
    });
    
    if (persistantTooltipRef.current) {
        persistantTooltipRef.current.style.display = 'inline-block';
        persistantTooltipRef.current.style.position = 'fixed';
        persistantTooltipRef.current.style.left = `${event.clientX + 15}px`;
        persistantTooltipRef.current.style.top = `${event.clientY + 15}px`;
    }
  };
  
  // Save groups to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(groups).length > 0) {
      localStorage.setItem('lineGroups', JSON.stringify(groups));
    }
  }, [groups]);
  
  const createGroup = () => {
    if (selectedLines.length < 2) return;
    
    const groupName = prompt('Enter a name for this group:');
    if (!groupName || groupName.trim() === '') return;
    
    const groupId = `group-${Date.now()}`;
    setGroups(prev => ({
      ...prev,
      [groupId]: { name: groupName.trim(), lines: [...selectedLines] }
    }));
    setCurrentGroup(groupId);
    setSelectedLines([]);
    
    // Apply visual styling to grouped lines
    selectedLines.forEach(lineId => {
      const line = document?.getElementById(lineId)?.nextSibling;
      if (line) {
        line.style.stroke = 'black';
        line.style.strokeWidth = '8px';
      }
    });
  };
  
  const clearSelection = () => {
    setSelectedLines([]);
    setSelectedGroup(null);
    selectedLines.forEach(lineId => {
      unhighlightLine(lineId);
    });
  };
  
  const selectGroup = (groupId: string) => {
    // First clear any previously selected group
    if (selectedGroup && selectedGroup !== groupId) {
      const prevGroup = groups[selectedGroup];
      if (prevGroup) {
        prevGroup.lines.forEach(lineId => {
          const line = document?.getElementById(lineId)?.nextSibling;
          if (line) {
            line.style.stroke = 'black';
            line.style.strokeWidth = '8px';
          }
        });
      }
    }
    
    setSelectedGroup(groupId);
    setSelectedLines([]);
    
    // Apply yellow color to selected group lines
    const group = groups[groupId];
    if (group) {
      group.lines.forEach(lineId => {
        const line = document?.getElementById(lineId)?.nextSibling;
        if (line) {
          line.style.stroke = 'yellow';
          line.style.strokeWidth = '15px';
        }
      });
    }
  };
  
  const deselectGroup = () => {
    if (selectedGroup) {
      // Revert selected group lines back to blue
      const group = groups[selectedGroup];
      if (group) {
        group.lines.forEach(lineId => {
          const line = document?.getElementById(lineId)?.nextSibling;
          if (line) {
            line.style.stroke = 'black';
            line.style.strokeWidth = '8px';
          }
        });
      }
      setSelectedGroup(null);
    }
  };
  
  const highlightLine = (id: string) => {
    const line = document?.getElementById(id)?.nextSibling;
    if (!line) return;
    
    // Check if line is in a group
    const isInGroup = Object.values(groups).some(group => group.lines.includes(id));
    
    if (isInGroup) {
      line.style.stroke = 'blue';
      line.style.strokeWidth = '12px';
    } else if (selectedLines.includes(id)) {
      line.style.stroke = 'orange';
      line.style.strokeWidth = '15px';
    }
    
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
    
    // Only unhighlight lines that are not in selectedLines or groups
    previousIds.forEach(id => {
        const isInGroup = Object.values(groups).some(group => group.lines.includes(id));
        const isSelected = selectedLines.includes(id);
        
        if (id !== selectedId && !isInGroup && !isSelected) {
            unhighlightLine(id);
        }
    });

    highlightLine(selectedId);
    if (previousIds.length !== 1 || previousIds[0] !== selectedId) {
        setPreviousIds([selectedId]);
    }
    }, [selectedId, selectedLines, groups]);
    
    // Update visual styling for selected lines
    useEffect(() => {
      selectedLines.forEach(lineId => {
        const line = document?.getElementById(lineId)?.nextSibling;
        if (line) {
          line.style.stroke = 'orange';
          line.style.strokeWidth = '15px';
        }
      });
    }, [selectedLines]);
    
    // Update visual styling for grouped lines
    useEffect(() => {
      Object.values(groups).forEach(group => {
        group.lines.forEach(lineId => {
          const line = document?.getElementById(lineId)?.nextSibling;
          if (line) {
            line.style.stroke = 'blue';
            line.style.strokeWidth = '12px';
          }
        });
      });
    }, [groups]);



  
  
  
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
    

      <div className="fixed top-4 right-4  p-4 rounded shadow-lg border max-w-xs">
        <h3 className="font-semibold mb-2">Group Info</h3>
        <div className="text-sm space-y-1">
          <div>Selected Lines: {selectedLines.length}</div>
          <div>Total Groups: {Object.keys(groups).length}</div>
          {currentGroup && groups[currentGroup] && (
            <div className="text-blue-600">Current Group: {groups[currentGroup].name}</div>
          )}
        </div>
        
        {/* Display all groups */}
        {Object.keys(groups).length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="text-xs font-semibold mb-2">Saved Groups:</div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {Object.entries(groups).map(([groupId, group]) => (
                <div 
                  key={groupId} 
                  className={`text-xs flex justify-between items-center cursor-pointer hover:bg-gray-100 px-1 rounded ${
                    selectedGroup === groupId ? 'bg-yellow-100 border border-yellow-300' : ''
                  }`}
                  onClick={() => selectedGroup === groupId ? deselectGroup() : selectGroup(groupId)}
                >
                  <span className="truncate">{group.name}</span>
                  <span className="text-gray-500">({group.lines.length} lines)</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {selectedLines.length >= 2 && (
          <button 
            onClick={createGroup}
            className="mt-3 w-full bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
          >
            Create Group
          </button>
        )}
        {selectedGroup && (
          <button 
            onClick={deselectGroup}
            className="mt-2 w-full bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
          >
            Deselect Group
          </button>
        )}
        {selectedLines.length > 0 && (
          <button 
            onClick={clearSelection}
            className="mt-2 w-full bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
          >
            Clear Selection
          </button>
        )}
      </div>
      <div className="fixed bottom-4 right-4  p-3 rounded shadow-lg border max-w-xs">
        <div className="text-sm font-semibold mb-1">Group Tooltip</div>
        <div className="text-xs text-gray-600">
          {selectedLines.length > 0 
            ? `Selected: ${selectedLines.join(', ')}`
            : 'Click lines to select multiple'
          }
        </div>
      </div>
    </div>
  );
}
