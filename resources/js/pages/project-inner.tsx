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
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  
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
          // New format - ensure all groups have required properties
          const enhancedGroups = Object.entries(parsedGroups).reduce((acc, [groupId, group]) => {
            const groupData = group as any;
            acc[groupId] = {
              name: groupData.name || 'Unnamed Group',
              lines: groupData.lines || [],
              stoneType: groupData.stoneType || '',
              description: groupData.description || '',
              purpose: groupData.purpose || '',
              type: groupData.type || 'group',
              createdAt: groupData.createdAt || new Date().toISOString(),
              sourceGroups: groupData.sourceGroups || []
            };
            return acc;
          }, {} as {[key: string]: any});
          setGroups(enhancedGroups);
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
    setSelectedGroups([]);
    selectedLines.forEach(lineId => {
      unhighlightLine(lineId);
    });
  };
  
  const createRoom = () => {
    if (selectedGroups.length < 2) {
      alert('Please select at least 2 groups to create a room.');
      return;
    }
    
    // Calculate total lines and get group info
    const allLines = new Set<string>();
    const groupNames: string[] = [];
    const roomStoneType = groups[selectedGroups[0]]?.stoneType || '';
    
    selectedGroups.forEach(groupId => {
      const group = groups[groupId];
      if (group) {
        group.lines.forEach(lineId => allLines.add(lineId));
        groupNames.push(group.name);
      }
    });
    
    // Create detailed prompt with room information
    const roomInfo = `
Creating Room Details:
• Groups to merge: ${groupNames.join(', ')}
• Total lines: ${allLines.size}
• Stone type: ${roomStoneType || 'Not set'}

Please enter the following:
`;
    
    const roomName = prompt(`${roomInfo}Room name:`);
    if (!roomName || !roomName.trim()) {
      return;
    }
    
    const roomDescription = prompt('Room description (optional):');
    const roomPurpose = prompt('Room purpose (e.g., Kitchen, Bathroom, Living Room):');
    
    // Create new room as a container for groups
    const roomId = `room_${Date.now()}`;
    const updatedGroups = {
      ...groups,
      [roomId]: {
        name: roomName.trim(),
        purpose: roomPurpose || '',
        description: roomDescription || '',
        stoneType: roomStoneType || '',
        lines: Array.from(allLines), // Include all lines from child groups
        type: 'room',
        childGroups: selectedGroups, // Store the groups that make up this room
        createdAt: new Date().toISOString(),
        sourceGroups: selectedGroups
      }
    };
    
    // Update state
    setGroups(updatedGroups);
    localStorage.setItem('lineGroups', JSON.stringify(updatedGroups));
    setSelectedGroups([]);
    setSelectedGroup(roomId);
    
    alert(`Room "${roomName.trim()}" created successfully!\n\nDetails:\n• Contains ${groupNames.length} groups\n• Purpose: ${roomPurpose || 'Not specified'}\n• Groups: ${groupNames.join(', ')}`);
  };
  
  const selectGroup = (groupId: string) => {
    const group = groups[groupId];
    if (!group) return;
    
    if (selectedGroups.includes(groupId)) {
      // Deselect if already selected
      setSelectedGroups(selectedGroups.filter(id => id !== groupId));
      
      // Revert lines back to default
      if (group.type === 'room' && group.childGroups) {
        // For rooms, revert all lines from all child groups
        group.childGroups.forEach(childGroupId => {
          const childGroup = groups[childGroupId];
          if (childGroup) {
            childGroup.lines.forEach(lineId => {
              const line = document?.getElementById(lineId)?.nextSibling;
              if (line) {
                line.style.stroke = 'black';
                line.style.strokeWidth = '8px';
              }
            });
          }
        });
      } else {
        // For regular groups, revert only group lines
        group.lines.forEach(lineId => {
          const line = document?.getElementById(lineId)?.nextSibling;
          if (line) {
            line.style.stroke = 'black';
            line.style.strokeWidth = '8px';
          }
        });
      }
      
      // Clear single selection if this was the only group selected
      const remainingGroups = selectedGroups.filter(id => id !== groupId);
      if (remainingGroups.length === 0) {
        setSelectedGroup(null);
      }
    } else {
      // Add to multi-selection
      setSelectedGroups([...selectedGroups, groupId]);
      
      if (group.type === 'room' && group.childGroups) {
        // For rooms, select all lines from all child groups
        const allLines: string[] = [];
        group.childGroups.forEach(childGroupId => {
          const childGroup = groups[childGroupId];
          if (childGroup) {
            allLines.push(...childGroup.lines);
            // Apply orange color to child group lines
            childGroup.lines.forEach(lineId => {
              const line = document?.getElementById(lineId)?.nextSibling;
              if (line) {
                line.style.stroke = 'orange';
                line.style.strokeWidth = '15px';
              }
            });
          }
        });
        // Also update selectedLines to include all lines from the room
        setSelectedLines(prev => [...new Set([...prev, ...allLines])]);
      } else {
        // For regular groups, apply orange color to group lines
        group.lines.forEach(lineId => {
          const line = document?.getElementById(lineId)?.nextSibling;
          if (line) {
            line.style.stroke = 'orange';
            line.style.strokeWidth = '15px';
          }
        });
      }
      
      // Set as single selected group
      setSelectedGroup(groupId);
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
          line.style.stroke = 'blue';
          line.style.strokeWidth = '20px';
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
      
      {/* Stone Type Selection - Only show when group is selected */}
      {selectedGroup && selectedGroups.length <= 1 && (
        <div className="fixed bottom-4 left-4 p-4 rounded shadow-lg border max-w-xs">
          <h3 className="font-semibold mb-2">Stone Type</h3>
          <select 
            className="w-full p-2 border rounded text-sm"
            value={groups[selectedGroup]?.stoneType || ''}
            onChange={(e) => {
              const stoneType = e.target.value;
              if (stoneType === 'custom') {
                const customValue = prompt('Enter custom stone type:');
                if (customValue && customValue.trim()) {
                  setGroups(prev => ({
                    ...prev,
                    [selectedGroup]: {
                      ...prev[selectedGroup],
                      stoneType: customValue.trim()
                    }
                  }));
                }
              } else if (stoneType) {
                setGroups(prev => ({
                  ...prev,
                  [selectedGroup]: {
                    ...prev[selectedGroup],
                    stoneType
                  }
                }));
              }
            }}
          >
            <option value="">Select Stone Type</option>
            <option value="marble">Marble</option>
            <option value="granite">Granite</option>
            <option value="limestone">Limestone</option>
            <option value="sandstone">Sandstone</option>
            <option value="slate">Slate</option>
            <option value="travertine">Travertine</option>
            <option value="quartzite">Quartzite</option>
            <option value="onyx">Onyx</option>
            <option value="custom">Custom...</option>
          </select>
          <div className="text-xs text-gray-600 mt-2">
            Group: {groups[selectedGroup]?.name}
            {groups[selectedGroup]?.stoneType && (
              <span className="block mt-1">
                Current: {groups[selectedGroup].stoneType}
                {!['marble', 'granite', 'limestone', 'sandstone', 'slate', 'travertine', 'quartzite', 'onyx'].includes(groups[selectedGroup].stoneType) && (
                  <span className="text-purple-600 ml-1">(Custom)</span>
                )}
              </span>
            )}
          </div>
        </div>
      )}
      
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
          {selectedGroups.length > 0 && (
            <div className="text-orange-600 font-semibold">
              Selected Groups: {selectedGroups.length}
            </div>
          )}
          {currentGroup && groups[currentGroup] && (
            <div className="text-blue-600">Current Group: {groups[currentGroup].name}</div>
          )}
        </div>
        
        {/* Create Room button */}
        {selectedGroups.length >= 2 && (
          <button
            onClick={createRoom}
            className="w-full bg-purple-600 text-white cursor-pointer px-2 py-1 rounded text-xs transition-colors duration-200 hover:bg-purple-700 mt-2"
          >
            Create Room ({selectedGroups.length} groups)
          </button>
        )}
        
        {/* Display all groups */}
        {Object.keys(groups).length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="text-xs font-semibold mb-2">Saved Groups:</div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {Object.entries(groups).map(([groupId, group]) => (
                <div 
                  key={groupId} 
                  className={`text-xs flex justify-between items-center cursor-pointer hover:bg-gray-700 px-1 rounded ${
                    selectedGroups.includes(groupId) ? 'bg-orange-100 border border-orange-300' : 
                    selectedGroup === groupId ? 'bg-yellow-100 border border-yellow-300' : ''
                  }`}
                  onClick={() => selectGroup(groupId)}
                >
                  <div className="flex-1">
                    <span className="truncate">{group.name}</span>
                    {group.type === 'room' && (
                      <span className="text-purple-600 ml-1 text-xs">🏠</span>
                    )}
                    {group.purpose && (
                      <div className="text-xs text-gray-500">{group.purpose}</div>
                    )}
                    {group.type === 'room' && group.childGroups && group.childGroups.length > 0 && (
                      <div className="text-xs text-purple-500">
                        {group.childGroups.length} groups
                      </div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500">({group.lines.length})</span>
                    {selectedGroups.includes(groupId) && (
                      <span className="text-orange-600 ml-1">✓</span>
                    )}
                  </div>
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
            className="mt-2 w-full bg-yellow-500 cursor pointer text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
          >
            Deselect Group
          </button>
        )}
        {selectedLines.length > 0 && (
          <button 
            onClick={clearSelection}
            className="mt-2 w-full bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-800"
          >
            Clear Selection
          </button>
        )}
      </div>
      <div className="fixed bottom-4 right-4 p-3 rounded shadow-lg border max-w-xs">
        <div className="text-sm font-semibold mb-1">Group Tooltip</div>
        
        {/* Show Create Room option when multiple groups selected */}
        {selectedGroups.length >= 2 && (
          <div className="space-y-2">
            <div className="text-xs text-gray-600">
              {selectedGroups.length} groups selected for room creation
            </div>
            <button
              onClick={createRoom}
              className="w-full bg-purple-600 transition-colors duration-200 cursor-pointer text-white px-2 py-1 rounded text-xs hover:bg-purple-700"
            >
              Create Room ({selectedGroups.length} groups)
            </button>
          </div>
        )}
        
        {/* Show single group details when one group selected */}
        {selectedGroup && selectedGroups.length <= 1 && (
          <div className="space-y-2">
            <div className="text-xs text-gray-600">
              Selected Group: {groups[selectedGroup]?.name}
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              Lines:
              {groups[selectedGroup]?.lines.map(lineId => (
                <div key={lineId} className="flex justify-between items-center">
                  <span>{lineId}</span>
                  <button
                    onClick={() => {
                      const updatedGroup = {
                        ...groups[selectedGroup],
                        lines: groups[selectedGroup].lines.filter(id => id !== lineId)
                      };
                      setGroups(prev => ({
                        ...prev,
                        [selectedGroup]: updatedGroup
                      }));
                      // Revert the line back to default
                      const line = document?.getElementById(lineId)?.nextSibling;
                      if (line) {
                        line.style.stroke = 'black';
                        line.style.strokeWidth = '8px';
                      }
                    }}
                    className="text-red-500 hover:text-red-700 text-xs px-1"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                // Get other groups that can be merged
                const otherGroups = Object.entries(groups).filter(([id]) => id !== selectedGroup);
                
                if (otherGroups.length === 0) {
                  alert('No other groups available to merge with.');
                  return;
                }
                
                // Create a simple selection interface
                const groupOptions = otherGroups.map(([id, group], index) => 
                  `${index + 1}. ${group.name} (${group.lines.length} lines)`
                ).join('\n');
                
                const choice = prompt(`Select a group to merge with:\n\n${groupOptions}\n\nEnter the number (1-${otherGroups.length}):`);
                
                if (choice && !isNaN(Number(choice))) {
                  const selectedIndex = Number(choice) - 1;
                  if (selectedIndex >= 0 && selectedIndex < otherGroups.length) {
                    const [targetGroupId, targetGroup] = otherGroups[selectedIndex];
                    
                    if (confirm(`Merge "${groups[selectedGroup].name}" into "${targetGroup.name}"?`)) {
                      // Merge the groups
                      const mergedLines = [...new Set([...targetGroup.lines, ...groups[selectedGroup].lines])];
                      
                      // Update the target group with merged lines
                      setGroups(prev => ({
                        ...prev,
                        [targetGroupId]: {
                          ...prev[targetGroupId],
                          lines: mergedLines
                        }
                      }));
                      
                      // Remove the current group
                      setGroups(prev => {
                        const newGroups = { ...prev };
                        delete newGroups[selectedGroup];
                        return newGroups;
                      });
                      
                      // Select the merged group
                      setSelectedGroup(targetGroupId);
                      setSelectedGroups([targetGroupId]);
                      
                      // Apply visual styling to merged group
                      mergedLines.forEach(lineId => {
                        const line = document?.getElementById(lineId)?.nextSibling;
                        if (line) {
                          line.style.stroke = 'red';
                          line.style.strokeWidth = '15px';
                        }
                      });
                    }
                  }
                }
              }}
              className="w-full bg-purple-600 transition-colors duration-200 cursor-pointer text-white px-2 py-1 rounded text-xs hover:bg-purple-700"
            >
              Merge Groups
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this group?')) {
                  // Revert all lines in this group back to default
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
                  
                  // Remove the group from state
                  setGroups(prev => {
                    const newGroups = { ...prev };
                    delete newGroups[selectedGroup];
                    return newGroups;
                  });
                  setSelectedGroup(null);
                }
              }}
              className="w-full bg-red-600 transition-colors duration-200 cursor-pointer text-white px-2 py-1 rounded text-xs hover:bg-red-700"
            >
              Delete Group
            </button>
          </div>
        )}
        
        {/* Show line selection info when no groups selected */}
        {!selectedGroup && selectedGroups.length === 0 && (
          <div className="text-xs text-gray-600">
            {selectedLines.length > 0
              ? `Selected: ${selectedLines.join(', ')}`
              : 'Click lines to select multiple'
            }
          </div>
        )}
      </div>
    </div>
  );
}
