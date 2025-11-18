import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import ProjectDetailCard from '@/components/project-detail-card';
import SvgComponent from '@/components/svg-component';
import SVGMetadataParser, {
    SVGMetadataParserRef,
} from '@/components/svg-metadata-parser';

interface Group {
    name: string;
    lines: string[];
    type?: 'group' | 'room';
    stoneType?: string;
    description?: string;
    purpose?: string;
    createdAt?: string;
    sourceGroups?: string[];
    childGroups?: string[];
    metadata?: Record<string, string>;
}

export default function ProjectInner({
    project,
    plan,
    url,
}: {
    project: any;
    plan: any;
    url: string;
}) {
    const [svgContent, setSvgContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // SVG metadata parser ref
    const metadataParserRef = useRef<SVGMetadataParserRef>(null);

    const [metadataOptions, setMetadataOptions] = useState<
        Record<string, string[]>
    >({});
    const [parsedRooms, setParsedRooms] = useState<any[]>([]);
    const [textElements, setTextElements] = useState<any[]>([]);
    const [roomMetadataSelections, setRoomMetadataSelections] = useState<
        Record<string, string>
    >({});
    const [groups, setGroups] = useState<{ [key: string]: Group }>({});
    // Handle metadata changes
    const handleMetadataChange = useCallback(
        (_metadata: any, _textElements: any, rooms: any) => {
            setParsedRooms(Array.isArray(rooms) ? rooms : []);
            setTextElements(Array.isArray(_textElements) ? _textElements : []);
            const options = _metadata.allMetadataOptions || {};
            setMetadataOptions(options);
            localStorage.setItem(`metadataOptions:${plan?.id || 'default'}`, JSON.stringify(options));
        },
        [plan?.id],
    );

    // Load metadata options from localStorage on mount or plan change
    useEffect(() => {
        const saved = localStorage.getItem(`metadataOptions:${plan?.id || 'default'}`);
        if (saved) {
            setMetadataOptions(JSON.parse(saved));
        }
    }, [plan?.id]);


    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [previousIds, setPreviousIds] = useState<string[]>([]);
    const [previousSelectedLines, setPreviousSelectedLines] = useState<
        string[]
    >([]);
    const [selectedLines, setSelectedLines] = useState<string[]>([]);

    const [groupNames, setGroupNames] = useState<{ [key: string]: string }>({});
    const [currentGroup, setCurrentGroup] = useState<string | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [tooltipMode, setTooltipMode] = useState<'group' | 'room'>('group');

    const storageKey = useMemo(() => {
        if (plan?.id) {
            return `lineGroups:${plan.id}`;
        }
        return 'lineGroups';
    }, [plan?.id]);

    // Load groups from localStorage on component mount
    useEffect(() => {
        const savedGroups =
            localStorage.getItem(storageKey) ??
            (plan?.id ? localStorage.getItem('lineGroups') : null);

        let parsedGroups: any = null;

        if (savedGroups) {
            try {
                parsedGroups = JSON.parse(savedGroups);

                // Check if groups are in old format (just arrays) or new format (objects with name and lines)
                const isFirstGroup = Object.values(parsedGroups)[0];
                const isOldFormat = Array.isArray(isFirstGroup);

                if (isOldFormat) {
                    // Convert old format to new format
                    const convertedGroups: {
                        [key: string]: { name: string; lines: string[] };
                    } = {};
                    Object.entries(parsedGroups).forEach(([groupId, lines]) => {
                        convertedGroups[groupId] = {
                            name: `Group ${groupId.split('-')[1]}`,
                            lines: lines as string[],
                        };
                    });
                    setGroups(convertedGroups);
                    localStorage.setItem(
                        storageKey,
                        JSON.stringify(convertedGroups),
                    );
                } else {
                    // New format - ensure all groups have required properties
                    const enhancedGroups = Object.entries(parsedGroups).reduce(
                        (acc, [groupId, group]) => {
                            const groupData = group as any;
                            acc[groupId] = {
                                name: groupData.name || 'Unnamed Group',
                                lines: groupData.lines || [],
                                stoneType: groupData.stoneType || '',
                                description: groupData.description || '',
                                purpose: groupData.purpose || '',
                                type: groupData.type || 'group',
                                createdAt:
                                    groupData.createdAt ||
                                    new Date().toISOString(),
                                sourceGroups: groupData.sourceGroups || [],
                                childGroups: groupData.childGroups || [],
                                metadata: groupData.metadata || {},
                            };
                            return acc;
                        },
                        {} as { [key: string]: any },
                    );
                    setGroups(enhancedGroups);
                }
            } catch (error) {
                console.error(
                    'Failed to load groups from localStorage:',
                    error,
                );
            }
        }
    }, [plan?.id, storageKey]);

    const [tooltipText, setTooltipText] = useState<string | null>(null);
    const [selectedToolTip, setSelectedTooltipText] = useState<string | null>(
        null,
    );

    // Helper functions to find group/room information for a line
    const findLineGroups = (lineId: string) => {
        const lineGroups = [];
        const lineRooms = [];

        Object.entries(groups).forEach(([groupId, group]) => {
            if (group.lines.includes(lineId)) {
                if (group.type === 'room') {
                    lineRooms.push({ id: groupId, name: group.name, group });
                } else {
                    lineGroups.push({ id: groupId, name: group.name, group });
                }
            }
        });

        return { groups: lineGroups, rooms: lineRooms };
    };

    const getAvailableGroups = (lineId: string) => {
        return Object.entries(groups)
            .filter(
                ([id, group]) =>
                    group.type !== 'room' && !group.lines.includes(lineId),
            )
            .map(([id, group]) => ({ id, name: group.name, group }));
    };

    const getAvailableRooms = (lineId: string) => {
        return Object.entries(groups)
            .filter(
                ([id, group]) =>
                    group.type === 'room' && !group.lines.includes(lineId),
            )
            .map(([id, group]) => ({ id, name: group.name, group }));
    };

    const addLineToGroup = (lineId: string, groupId: string) => {
        const updatedGroups = { ...groups };
        if (updatedGroups[groupId]) {
            updatedGroups[groupId] = {
                ...updatedGroups[groupId],
                lines: [...new Set([...updatedGroups[groupId].lines, lineId])],
            };
            setGroups(updatedGroups);
            localStorage.setItem(storageKey, JSON.stringify(updatedGroups));
        }
    };

    const removeLineFromGroup = (lineId: string, groupId: string) => {
        const updatedGroups = { ...groups };
        if (updatedGroups[groupId]) {
            updatedGroups[groupId] = {
                ...updatedGroups[groupId],
                lines: updatedGroups[groupId].lines.filter(
                    (id) => id !== lineId,
                ),
            };

            // Remove group if empty
            if (updatedGroups[groupId].lines.length === 0) {
                delete updatedGroups[groupId];
                if (selectedGroup === groupId) {
                    setSelectedGroup(null);
                }
            }

            setGroups(updatedGroups);
            localStorage.setItem(storageKey, JSON.stringify(updatedGroups));
        }
    };

    const svgContainerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const persistantTooltipRef = useRef<HTMLDivElement>(null);

    const handleClosePersistantModal = () => {
        if (persistantTooltipRef.current) {
            persistantTooltipRef.current.style.display = 'none';
        }
    };

    const selectLine = (id: string) => {
        if (!id) return;
        setSelectedId(id);
        setSelectedTooltipText(id);

        // Toggle line selection for multi-selection
        setSelectedLines((prev) => {
            if (prev.includes(id)) {
                const newSelection = prev.filter((lineId) => lineId !== id);
                handleClosePersistantModal();
                return newSelection;
            } else {
                const newSelection = [...prev, id];
                return newSelection;
            }
        });

        // Position tooltip in center of screen
        if (persistantTooltipRef.current) {
            persistantTooltipRef.current.style.display = 'block';
            persistantTooltipRef.current.style.position = 'fixed';
            persistantTooltipRef.current.style.left = `${event.clientX + 15}px`;
            persistantTooltipRef.current.style.top = `${event.clientY + 15}px`;
        }
    };

    // Save groups to localStorage whenever they change
    useEffect(() => {
        if (Object.keys(groups).length > 0) {
            localStorage.setItem(storageKey, JSON.stringify(groups));
        }
    }, [groups, storageKey]);

    const createGroup = () => {
        if (selectedLines.length < 2) return;

        const groupName = prompt('Enter a name for this group:');
        if (!groupName || groupName.trim() === '') return;

        const groupId = `group-${Date.now()}`;
        setGroups((prev) => ({
            ...prev,
            [groupId]: { name: groupName.trim(), lines: [...selectedLines] },
        }));
        setCurrentGroup(groupId);
        setSelectedLines([]);
    };

    const clearSelection = () => {
        setSelectedLines([]);
        setSelectedGroup(null);
        setSelectedGroups([]);
        selectedLines.forEach((lineId) => {
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

        selectedGroups.forEach((groupId) => {
            const group = groups[groupId];
            if (group) {
                group.lines.forEach((lineId) => allLines.add(lineId));
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
        const roomPurpose = prompt(
            'Room purpose (e.g., Kitchen, Bathroom, Living Room):',
        );

        // Create new room as a container for groups
        const metadataAssignments = Object.entries(
            roomMetadataSelections,
        ).reduce(
            (acc, [key, value]) => {
                if (value) {
                    acc[key] = value;
                }
                return acc;
            },
            {} as Record<string, string>,
        );

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
                sourceGroups: selectedGroups,
                metadata: metadataAssignments,
            },
        };

        // Update state
        setGroups(updatedGroups);
        localStorage.setItem(storageKey, JSON.stringify(updatedGroups));
        setSelectedGroups([]);
        setSelectedGroup(roomId);
        setRoomMetadataSelections({});

        alert(
            `Room "${roomName.trim()}" created successfully!\n\nDetails:\n• Contains ${groupNames.length} groups\n• Purpose: ${roomPurpose || 'Not specified'}\n• Groups: ${groupNames.join(', ')}`,
        );
    };

    const handleRoomMetadataValueChange = (key: string, value: string) => {
        if (!selectedGroup || !groups[selectedGroup]) {
            return;
        }

        setGroups((prev) => {
            const target = prev[selectedGroup];
            if (!target) {
                return prev;
            }

            const nextMetadata = { ...(target.metadata || {}) };
            if (!value) {
                delete nextMetadata[key];
            } else {
                nextMetadata[key] = value;
            }

            const updatedGroups = {
                ...prev,
                [selectedGroup]: {
                    ...target,
                    metadata: nextMetadata,
                },
            };

            return updatedGroups;
        });

        setMetadataOptions((prev) => {
            if (!value || prev[key]?.includes(value)) {
                return prev;
            }
            return {
                ...prev,
                [key]: [...(prev[key] || []), value].sort(),
            };
        });
    };

    const selectGroup = (groupId: string) => {
        const group = groups[groupId];
        if (!group) return;

        const isRoom = group.type === 'room';

        if (isRoom) {
            setSelectedGroups((prev) => {
                const wasSelected = prev.includes(groupId);
                if (wasSelected) {
                    // Deselect this room
                    setSelectedGroup(null);

                    // Revert lines back to default for the room
                    if (group.childGroups) {
                        group.childGroups.forEach((childGroupId) => {
                            const childGroup = groups[childGroupId];
                            if (childGroup) {
                                childGroup.lines.forEach((lineId) => {
                                    const line =
                                        document?.getElementById(
                                            lineId,
                                        )?.nextSibling;
                                    if (line) {
                                        line.style.stroke = 'black';
                                        line.style.strokeWidth = '8px';
                                    }
                                });
                            }
                        });
                    }

                    return [];
                } else {
                    // Select this room (only one at a time)
                    setSelectedGroup(groupId);

                    // Apply styling to room lines
                    if (group.childGroups) {
                        const allLines: string[] = [];
                        group.childGroups.forEach((childGroupId) => {
                            const childGroup = groups[childGroupId];
                            if (childGroup) {
                                allLines.push(...childGroup.lines);
                                childGroup.lines.forEach((lineId) => {
                                    const line =
                                        document?.getElementById(
                                            lineId,
                                        )?.nextSibling;
                                    if (line) {
                                        line.style.stroke = 'orange';
                                        line.style.strokeWidth = '15px';
                                    }
                                });
                            }
                        });
                        setSelectedLines((prev) => [
                            ...new Set([...prev, ...allLines]),
                        ]);
                    }

                    return [groupId];
                }
            });
        } else {
            // Selecting a group: clear any selected rooms first
            setSelectedGroups((prev) =>
                prev.filter((id) => groups[id]?.type !== 'room'),
            );

            const currentlySelected = selectedGroups.includes(groupId);

            if (currentlySelected) {
                // Deselect this group
                setSelectedGroups((prev) =>
                    prev.filter((id) => id !== groupId),
                );
                if (selectedGroup === groupId) {
                    setSelectedGroup(null);
                }

                // Revert group lines
                group.lines.forEach((lineId) => {
                    const line = document?.getElementById(lineId)?.nextSibling;
                    if (line) {
                        line.style.stroke = 'black';
                        line.style.strokeWidth = '8px';
                    }
                });
            } else {
                // Add to multi-selection for groups
                setSelectedGroups((prev) => [...prev, groupId]);
                setSelectedGroup(groupId);

                // Apply styling to group lines
                group.lines.forEach((lineId) => {
                    const line = document?.getElementById(lineId)?.nextSibling;
                    if (line) {
                        line.style.stroke = 'orange';
                        line.style.strokeWidth = '15px';
                    }
                });
            }
        }
    };

    const deselectGroup = () => {
        if (selectedGroup) {
            // Revert selected group lines back to blue
            const group = groups[selectedGroup];
            if (group) {
                group.lines.forEach((lineId) => {
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
        previousIds.forEach((id) => {
            const isInGroup = Object.values(groups).some((group) =>
                group.lines.includes(id),
            );
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
        // Unhighlight lines that are no longer selected
        const deselectedLines = previousSelectedLines.filter(
            (lineId) => !selectedLines.includes(lineId),
        );
        deselectedLines.forEach((lineId) => {
            const line = document?.getElementById(lineId)?.nextSibling;
            if (line) {
                line.style.stroke = 'black';
                line.style.strokeWidth = '8px';
            }
        });

        // Highlight newly selected lines
        selectedLines.forEach((lineId) => {
            const line = document?.getElementById(lineId)?.nextSibling;
            if (line) {
                line.style.stroke = 'blue';
                line.style.strokeWidth = '20px';
            }
        });

        // Update previous selection for next render
        setPreviousSelectedLines(selectedLines);
    }, [selectedLines]);

    return (
        <div>
            {project && plan && (
                <ProjectDetailCard project={project} plan={plan} />
            )}

            {/* Attribute Controls - Only show when a single group is selected */}
            {selectedGroup && selectedGroups.length <= 1 && (
                <div className="fixed bottom-4 left-4 max-w-xs space-y-4 rounded border bg-gray-900/80 p-4 shadow-lg">
                    <div>
                        <h3 className="mb-2 font-semibold text-gray-300">
                            Stone Type
                        </h3>
                        <select
                            className="w-full rounded border p-2 text-sm"
                            value={groups[selectedGroup]?.stoneType || ''}
                            onChange={(e) => {
                                const stoneType = e.target.value;
                                if (stoneType === 'custom') {
                                    const customValue = prompt(
                                        'Enter custom stone type:',
                                    );
                                    if (customValue && customValue.trim()) {
                                        setGroups((prev) => ({
                                            ...prev,
                                            [selectedGroup]: {
                                                ...prev[selectedGroup],
                                                stoneType: customValue.trim(),
                                            },
                                        }));
                                    }
                                } else {
                                    setGroups((prev) => ({
                                        ...prev,
                                        [selectedGroup]: {
                                            ...prev[selectedGroup],
                                            stoneType: stoneType || '',
                                        },
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
                        <div className="mt-2 text-xs text-gray-600">
                            Group: {groups[selectedGroup]?.name}
                            {groups[selectedGroup]?.stoneType && (
                                <span className="mt-1 block">
                                    Current: {groups[selectedGroup].stoneType}
                                    {![
                                        'marble',
                                        'granite',
                                        'limestone',
                                        'sandstone',
                                        'slate',
                                        'travertine',
                                        'quartzite',
                                        'onyx',
                                    ].includes(
                                        groups[selectedGroup].stoneType,
                                    ) && (
                                        <span className="ml-1 text-purple-600">
                                            (Custom)
                                        </span>
                                    )}
                                </span>
                            )}
                        </div>
                    </div>

                    {groups[selectedGroup]?.type === 'room' &&
                        Object.keys(metadataOptions).length > 0 && (
                            <div className="space-y-2 border-t border-gray-200 pt-3">
                                <h3 className="text-sm font-semibold text-gray-300">
                                    Room Metadata
                                </h3>
                                {Object.entries(metadataOptions).map(
                                    ([key, options]) => {
                                        const currentValue =
                                            groups[selectedGroup]?.metadata?.[
                                                key
                                            ] || '';
                                        const selectOptions = Array.from(
                                            new Set(
                                                [
                                                    ...(options || []),
                                                    currentValue,
                                                ].filter(Boolean),
                                            ),
                                        ).sort();

                                        return (
                                            <label
                                                key={key}
                                                className="flex flex-col gap-1 text-xs text-gray-600"
                                            >
                                                <span className="text-[11px] tracking-wide text-gray-500 uppercase">
                                                    {key}
                                                </span>
                                                <select
                                                    className="w-full rounded border bg-white px-2 py-1 text-xs text-gray-800"
                                                    value={currentValue}
                                                    onChange={(e) =>
                                                        handleRoomMetadataValueChange(
                                                            key,
                                                            e.target.value,
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        Select{' '}
                                                        {key.toUpperCase()}
                                                    </option>
                                                    {selectOptions.map(
                                                        (option) => (
                                                            <option
                                                                key={option}
                                                                value={option}
                                                            >
                                                                {option}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            </label>
                                        );
                                    },
                                )}
                            </div>
                        )}
                </div>
            )}

            <div className="grid h-[20vh] place-items-center">
                <div
                    className="mx-auto mt-8"
                    style={{
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        MozUserSelect: 'none',
                        msUserSelect: 'none',
                    }}
                >
                    <SvgComponent
                        selectLine={selectLine}
                        svgContent={svgContent || ''}
                        plan={plan}
                        svgContainerRef={svgContainerRef}
                        setLoading={setLoading}
                        setSvgContent={setSvgContent}
                        setTooltipText={setTooltipText}
                        tooltipRef={tooltipRef}
                        loading={loading}
                    />
                </div>
            </div>

            {/* SVG Metadata Parser */}
            <SVGMetadataParser
                ref={metadataParserRef}
                svgContent={svgContent}
                onMetadataChange={handleMetadataChange}
            />

            {/* hover Tooltip */}
            <div
                ref={tooltipRef}
                className="hover-tooltip"
                style={{
                    position: 'fixed',
                    display: 'none',
                    pointerEvents: 'none',
                    zIndex: 50,
                }}
            >
                {tooltipText}
            </div>

            <div
                ref={persistantTooltipRef}
                className="persistant-tooltip z-[9999] max-w-xs rounded-lg border border-gray-300 bg-white p-3 shadow-lg"
                style={{
                    display: 'none',
                    position: 'fixed',
                    pointerEvents: 'auto',
                }}
            >
                {selectedToolTip && (
                    <div className="space-y-2">
                        <div className="flex justify-between gap-12 border-b pb-1 text-sm font-semibold text-black">
                            <p> Line: {selectedToolTip}</p>
                        </div>

                        {/* Show current groups and rooms */}
                        {(() => {
                            const { groups: lineGroups, rooms: lineRooms } =
                                findLineGroups(selectedToolTip);

                            return (
                                <div className="space-y-1">
                                    {lineGroups.length > 0 && (
                                        <div className="relative">
                                            <div className="text-xs font-semibold text-blue-600">
                                                Groups:
                                            </div>
                                            {lineGroups.map(({ id, name }) => (
                                                <div
                                                    key={id}
                                                    className="flex items-center justify-between py-1 text-xs"
                                                >
                                                    <span className="text-blue-700">
                                                        {name}
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            removeLineFromGroup(
                                                                selectedToolTip,
                                                                id,
                                                            )
                                                        }
                                                        className="cursor-pointer px-1 text-xs text-red-500 hover:text-red-700"
                                                        title="Remove from group"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {lineRooms.length > 0 && (
                                        <div>
                                            <div className="text-xs font-semibold text-purple-600">
                                                Rooms:
                                            </div>
                                            {lineRooms.map(({ id, name }) => (
                                                <div
                                                    key={id}
                                                    className="flex items-center justify-between py-1 text-xs"
                                                >
                                                    <span className="text-purple-700">
                                                        {name}
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            removeLineFromGroup(
                                                                selectedToolTip,
                                                                id,
                                                            )
                                                        }
                                                        className="cursor-pointer px-1 text-xs text-red-500 hover:text-red-700"
                                                        title="Remove from room"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {lineGroups.length === 0 &&
                                        lineRooms.length === 0 && (
                                            <div className="text-xs text-gray-500 italic">
                                                Not in any group or room
                                            </div>
                                        )}
                                </div>
                            );
                        })()}

                        {/* Add to options */}
                        <div className="space-y-1 border-t pt-2">
                            {(() => {
                                const availableGroups =
                                    getAvailableGroups(selectedToolTip);
                                const availableRooms =
                                    getAvailableRooms(selectedToolTip);

                                return (
                                    <>
                                        {availableGroups.length > 0 && (
                                            <div>
                                                <div className="mb-1 text-xs font-semibold text-gray-600">
                                                    Add to Group:
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {availableGroups
                                                        .slice(0, 3)
                                                        .map(({ id, name }) => (
                                                            <button
                                                                key={id}
                                                                onClick={() =>
                                                                    addLineToGroup(
                                                                        selectedToolTip,
                                                                        id,
                                                                    )
                                                                }
                                                                className="cursor-pointer rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 hover:bg-blue-200"
                                                                title={`Add to ${name}`}
                                                            >
                                                                +{name}
                                                            </button>
                                                        ))}
                                                    {availableGroups.length >
                                                        3 && (
                                                        <span className="px-2 py-1 text-xs text-gray-500">
                                                            +
                                                            {availableGroups.length -
                                                                3}{' '}
                                                            more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {availableRooms.length > 0 && (
                                            <div>
                                                <div className="mb-1 text-xs font-semibold text-gray-600">
                                                    Add to Room:
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {availableRooms
                                                        .slice(0, 3)
                                                        .map(({ id, name }) => (
                                                            <button
                                                                key={id}
                                                                onClick={() =>
                                                                    addLineToGroup(
                                                                        selectedToolTip,
                                                                        id,
                                                                    )
                                                                }
                                                                className="cursor-pointer rounded bg-purple-100 px-2 py-1 text-xs text-purple-700 hover:bg-purple-200"
                                                                title={`Add to ${name}`}
                                                            >
                                                                +{name}
                                                            </button>
                                                        ))}
                                                    {availableRooms.length >
                                                        3 && (
                                                        <span className="px-2 py-1 text-xs text-gray-500">
                                                            +
                                                            {availableRooms.length -
                                                                3}{' '}
                                                            more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {availableGroups.length === 0 &&
                                            availableRooms.length === 0 && (
                                                <div className="text-xs text-gray-500 italic">
                                                    No available groups or rooms
                                                </div>
                                            )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>

            {tooltipMode !== 'room' && (
                <div className="fixed top-4 right-4 max-w-xs rounded border p-4 shadow-lg">
                    <h3 className="mb-2 font-semibold">Group Info</h3>
                    <div className="space-y-1 text-sm">
                        <div>Selected Lines: {selectedLines.length}</div>
                        <div>Total Groups: {Object.keys(groups).length}</div>
                        {selectedGroups.length > 0 && (
                            <div className="font-semibold text-orange-600">
                                Selected Groups: {selectedGroups.length}
                            </div>
                        )}
                        {currentGroup && groups[currentGroup] && (
                            <div className="text-blue-600">
                                Current Group: {groups[currentGroup].name}
                            </div>
                        )}
                    </div>

                    {/* Metadata selection + Create Room */}
                    {selectedGroups.length >= 2 && (
                        <div className="mt-2 space-y-2">
                            {Object.keys(metadataOptions).length > 0 && (
                                <div className="space-y-2 text-xs text-gray-500">
                                    <div className="font-semibold text-gray-300">
                                        Room Metadata
                                    </div>
                                    {Object.entries(metadataOptions).map(
                                        ([key, options]) => (
                                            <label
                                                key={key}
                                                className="flex flex-col gap-1"
                                            >
                                                <span className="text-[11px] tracking-wide text-gray-500 uppercase">
                                                    {key}
                                                </span>
                                                <select
                                                    className="w-full rounded border bg-white px-2 py-1 text-xs text-gray-800"
                                                    value={
                                                        roomMetadataSelections[
                                                            key
                                                        ] || ''
                                                    }
                                                    onChange={(e) => {
                                                        const value =
                                                            e.target.value;
                                                        setRoomMetadataSelections(
                                                            (prev) => {
                                                                const next = {
                                                                    ...prev,
                                                                };
                                                                if (!value) {
                                                                    delete next[
                                                                        key
                                                                    ];
                                                                } else {
                                                                    next[key] =
                                                                        value;
                                                                }
                                                                return next;
                                                            },
                                                        );
                                                    }}
                                                >
                                                    <option value="">
                                                        Select{' '}
                                                        {key.toUpperCase()}
                                                    </option>
                                                    {options.map((option) => (
                                                        <option
                                                            key={option}
                                                            value={option}
                                                        >
                                                            {option}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                        ),
                                    )}
                                </div>
                            )}
                            <button
                                onClick={createRoom}
                                className="w-full cursor-pointer rounded bg-purple-600 px-2 py-1 text-xs text-white transition-colors duration-200 hover:bg-purple-700"
                            >
                                Create Room ({selectedGroups.length} groups)
                            </button>
                        </div>
                    )}

                    {/* Display all groups (excluding rooms) */}
                    {Object.keys(groups).filter(
                        (id) => groups[id].type !== 'room',
                    ).length > 0 && (
                        <div className="mt-3 border-t pt-3">
                            <div className="mb-2 text-xs font-semibold">
                                Saved Groups:
                            </div>
                            <div className="max-h-32 space-y-1 overflow-y-auto">
                                {Object.entries(groups)
                                    .filter(
                                        ([_, group]) => group.type !== 'room',
                                    )
                                    .map(([groupId, group]) => (
                                        <div
                                            key={groupId}
                                            className={`flex cursor-pointer items-center justify-between rounded px-1 text-xs hover:bg-gray-700 ${
                                                selectedGroups.includes(groupId)
                                                    ? 'border border-orange-300 bg-orange-100'
                                                    : selectedGroup === groupId
                                                      ? 'border border-yellow-300 bg-yellow-100'
                                                      : ''
                                            }`}
                                            onClick={() => selectGroup(groupId)}
                                        >
                                            <div className="flex-1">
                                                <span className="truncate">
                                                    {group.name}
                                                </span>
                                                {group.purpose && (
                                                    <div className="text-xs text-gray-500">
                                                        {group.purpose}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-gray-500">
                                                    ({group.lines.length})
                                                </span>
                                                {selectedGroups.includes(
                                                    groupId,
                                                ) && (
                                                    <span className="ml-1 text-orange-600">
                                                        ✓
                                                    </span>
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
                            className="mt-3 w-full rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
                        >
                            Create Group
                        </button>
                    )}
                    {selectedGroup && (
                        <button
                            onClick={deselectGroup}
                            className="cursor pointer mt-2 w-full rounded bg-yellow-500 px-3 py-1 text-sm text-white hover:bg-yellow-600"
                        >
                            Deselect Group
                        </button>
                    )}
                    {selectedLines.length > 0 && (
                        <button
                            onClick={clearSelection}
                            className="mt-2 w-full rounded bg-gray-500 px-3 py-1 text-sm text-white hover:bg-gray-800"
                        >
                            Clear Selection
                        </button>
                    )}
                </div>
            )}
            <div className="fixed right-4 bottom-4 max-w-xs rounded border p-3 shadow-lg">
                <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold">
                        {tooltipMode === 'group' ? 'Group Info' : 'Room Info'}
                    </div>
                    <div className="flex gap-1">
                        {/* Show Group Info button when there are groups or when in room mode (to switch back) */}
                        {tooltipMode === 'room' &&
                            Object.keys(groups).filter(
                                (id) => groups[id].type === 'group',
                            ).length > 0 && (
                                <button
                                    onClick={() => setTooltipMode('group')}
                                    className={`rounded px-2 py-1 text-xs ${
                                        tooltipMode == 'group'
                                            ? null
                                            : 'bg-blue-500 text-white'
                                    }`}
                                >
                                    Group Info
                                </button>
                            )}
                        {tooltipMode === 'group' &&
                            Object.keys(groups).filter(
                                (id) => groups[id].type === 'room',
                            ).length > 0 && (
                                <button
                                    onClick={() => setTooltipMode('room')}
                                    className={`rounded px-2 py-1 text-xs ${
                                        tooltipMode === 'room'
                                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            : 'bg-purple-500 text-white'
                                    }`}
                                >
                                    Room Info
                                </button>
                            )}
                    </div>
                </div>

                {/* Conditional content based on tooltip mode */}
                {tooltipMode === 'group' ? (
                    <div>
                        {/* Show Create Room option when multiple groups selected */}
                        {selectedGroups.length >= 2 && (
                            <div className="space-y-2">
                                <div className="text-xs text-gray-600">
                                    {selectedGroups.length} groups selected for
                                    room creation
                                </div>
                                <button
                                    onClick={createRoom}
                                    className="w-full cursor-pointer rounded bg-purple-600 px-2 py-1 text-xs text-white transition-colors duration-200 hover:bg-purple-700"
                                >
                                    Create Room ({selectedGroups.length} groups)
                                </button>
                            </div>
                        )}

                        {/* Show single group details when one group selected */}
                        {selectedGroup && selectedGroups.length <= 1 && (
                            <div className="space-y-2">
                                <div className="text-xs text-gray-600">
                                    Selected Group:{' '}
                                    {groups[selectedGroup]?.name}
                                </div>
                                <div className="space-y-1 text-xs text-gray-600">
                                    Lines:
                                    {groups[selectedGroup]?.lines.map(
                                        (lineId) => (
                                            <div
                                                key={lineId}
                                                className="flex items-center justify-between"
                                            >
                                                <span>{lineId}</span>
                                                <button
                                                    onClick={() => {
                                                        const updatedLines =
                                                            groups[
                                                                selectedGroup
                                                            ].lines.filter(
                                                                (id) =>
                                                                    id !==
                                                                    lineId,
                                                            );
                                                        let updatedGroups;

                                                        // Check if group will be empty after removing this line
                                                        if (
                                                            updatedLines.length ===
                                                            0
                                                        ) {
                                                            // Remove the entire group if it will be empty
                                                            updatedGroups = {
                                                                ...groups,
                                                            };
                                                            delete updatedGroups[
                                                                selectedGroup
                                                            ];
                                                            setGroups(
                                                                updatedGroups,
                                                            );
                                                            setSelectedGroup(
                                                                null,
                                                            );
                                                            // Also remove from selectedGroups array
                                                            setSelectedGroups(
                                                                (prev) =>
                                                                    prev.filter(
                                                                        (id) =>
                                                                            id !==
                                                                            selectedGroup,
                                                                    ),
                                                            );
                                                        } else {
                                                            // Update group with remaining lines
                                                            updatedGroups = {
                                                                ...groups,
                                                                [selectedGroup]:
                                                                    {
                                                                        ...groups[
                                                                            selectedGroup
                                                                        ],
                                                                        lines: updatedLines,
                                                                    },
                                                            };
                                                            setGroups(
                                                                updatedGroups,
                                                            );
                                                        }

                                                        // Immediately save to localStorage
                                                        localStorage.setItem(
                                                            storageKey,
                                                            JSON.stringify(
                                                                updatedGroups,
                                                            ),
                                                        );

                                                        // Revert the line back to default
                                                        const line =
                                                            document?.getElementById(
                                                                lineId,
                                                            )?.nextSibling;
                                                        if (line) {
                                                            line.style.stroke =
                                                                'black';
                                                            line.style.strokeWidth =
                                                                '8px';
                                                        }
                                                    }}
                                                    className="px-1 text-xs text-red-500 hover:text-red-700"
                                                >
                                                    x
                                                </button>
                                            </div>
                                        ),
                                    )}
                                </div>
                                {groups[selectedGroup]?.metadata &&
                                    Object.keys(
                                        groups[selectedGroup]?.metadata || {},
                                    ).length > 0 && (
                                        <div className="space-y-1 text-xs text-gray-600">
                                            <div className="font-semibold text-gray-500">
                                                Metadata
                                            </div>
                                            {Object.entries(
                                                groups[selectedGroup]
                                                    ?.metadata || {},
                                            ).map(([key, value]) => (
                                                <div
                                                    key={key}
                                                    className="flex justify-between"
                                                >
                                                    <span className="uppercase">
                                                        {key}
                                                    </span>
                                                    <span>{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                <button
                                    onClick={() => {
                                        // Get other groups that can be merged
                                        const otherGroups = Object.entries(
                                            groups,
                                        ).filter(
                                            ([id]) => id !== selectedGroup,
                                        );

                                        if (otherGroups.length === 0) {
                                            alert(
                                                'No other groups available to merge with.',
                                            );
                                            return;
                                        }

                                        // Create a simple selection interface
                                        const groupOptions = otherGroups
                                            .map(
                                                ([id, group], index) =>
                                                    `${index + 1}. ${group.name} (${group.lines.length} lines)`,
                                            )
                                            .join('\n');

                                        const choice = prompt(
                                            `Select a group to merge with:\n\n${groupOptions}\n\nEnter the number (1-${otherGroups.length}):`,
                                        );

                                        if (choice && !isNaN(Number(choice))) {
                                            const selectedIndex =
                                                Number(choice) - 1;
                                            if (
                                                selectedIndex >= 0 &&
                                                selectedIndex <
                                                    otherGroups.length
                                            ) {
                                                const [
                                                    targetGroupId,
                                                    targetGroup,
                                                ] = otherGroups[selectedIndex];

                                                if (
                                                    confirm(
                                                        `Merge "${groups[selectedGroup].name}" into "${targetGroup.name}"?`,
                                                    )
                                                ) {
                                                    // Merge the groups
                                                    const mergedLines = [
                                                        ...new Set([
                                                            ...targetGroup.lines,
                                                            ...groups[
                                                                selectedGroup
                                                            ].lines,
                                                        ]),
                                                    ];

                                                    // Update the target group with merged lines
                                                    setGroups((prev) => ({
                                                        ...prev,
                                                        [targetGroupId]: {
                                                            ...prev[
                                                                targetGroupId
                                                            ],
                                                            lines: mergedLines,
                                                        },
                                                    }));

                                                    // Remove the current group
                                                    setGroups((prev) => {
                                                        const newGroups = {
                                                            ...prev,
                                                        };
                                                        delete newGroups[
                                                            selectedGroup
                                                        ];
                                                        return newGroups;
                                                    });

                                                    // Select the merged group
                                                    setSelectedGroup(
                                                        targetGroupId,
                                                    );
                                                    setSelectedGroups([
                                                        targetGroupId,
                                                    ]);

                                                    // Apply visual styling to merged group
                                                    mergedLines.forEach(
                                                        (lineId) => {
                                                            const line =
                                                                document?.getElementById(
                                                                    lineId,
                                                                )?.nextSibling;
                                                            if (line) {
                                                                line.style.stroke =
                                                                    'red';
                                                                line.style.strokeWidth =
                                                                    '15px';
                                                            }
                                                        },
                                                    );
                                                }
                                            }
                                        }
                                    }}
                                    className="w-full cursor-pointer rounded bg-purple-600 px-2 py-1 text-xs text-white transition-colors duration-200 hover:bg-purple-700"
                                >
                                    Merge Groups
                                </button>
                                <button
                                    onClick={() => {
                                        if (
                                            confirm(
                                                'Are you sure you want to delete this group?',
                                            )
                                        ) {
                                            // Revert all lines in this group back to default
                                            const group = groups[selectedGroup];
                                            if (group) {
                                                group.lines.forEach(
                                                    (lineId) => {
                                                        const line =
                                                            document?.getElementById(
                                                                lineId,
                                                            )?.nextSibling;
                                                        if (line) {
                                                            line.style.stroke =
                                                                'black';
                                                            line.style.strokeWidth =
                                                                '8px';
                                                        }
                                                    },
                                                );
                                            }

                                            // Remove the group from state and localStorage
                                            setGroups((prev) => {
                                                const newGroups = { ...prev };
                                                delete newGroups[selectedGroup];

                                                // Update localStorage immediately
                                                localStorage.setItem(
                                                    storageKey,
                                                    JSON.stringify(newGroups),
                                                );

                                                return newGroups;
                                            });
                                            setSelectedGroup(null);

                                            // Also remove from selectedGroups if it was selected for multi-selection
                                            setSelectedGroups((prev) =>
                                                prev.filter(
                                                    (id) =>
                                                        id !== selectedGroup,
                                                ),
                                            );
                                        }
                                    }}
                                    className="w-full cursor-pointer rounded bg-red-600 px-2 py-1 text-xs text-white transition-colors duration-200 hover:bg-red-700"
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
                                    : 'Click lines to select multiple'}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Room Info content */
                    <div>
                        <div className="space-y-1 text-xs text-gray-600">
                            <div>
                                Total Rooms:{' '}
                                {
                                    Object.keys(groups).filter(
                                        (id) => groups[id].type === 'room',
                                    ).length
                                }
                            </div>
                            {selectedGroups.filter(
                                (id) => groups[id].type === 'room',
                            ).length > 0 && (
                                <div className="font-semibold text-purple-600">
                                    Selected Rooms:{' '}
                                    {
                                        selectedGroups.filter(
                                            (id) => groups[id].type === 'room',
                                        ).length
                                    }
                                </div>
                            )}
                        </div>

                        {/* Display all rooms */}
                        {Object.keys(groups).filter(
                            (id) => groups[id].type === 'room',
                        ).length > 0 && (
                            <div className="mt-3 border-t pt-3">
                                <div className="mb-2 text-xs font-semibold">
                                    Available Rooms:
                                </div>
                                <div className="max-h-32 space-y-1 overflow-y-auto">
                                    {Object.entries(groups)
                                        .filter(
                                            ([_, group]) =>
                                                group.type === 'room',
                                        )
                                        .map(([roomId, room]) => (
                                            <div
                                                key={roomId}
                                                className={`flex cursor-pointer items-center justify-between rounded px-1 text-xs hover:bg-gray-100 ${
                                                    selectedGroups.includes(
                                                        roomId,
                                                    )
                                                        ? 'border border-purple-300 bg-purple-100'
                                                        : selectedGroup ===
                                                            roomId
                                                          ? 'border border-purple-300 bg-purple-100'
                                                          : ''
                                                }`}
                                                onClick={() =>
                                                    selectGroup(roomId)
                                                }
                                            >
                                                <div className="flex-1">
                                                    <span className="truncate">
                                                        {room.name}
                                                    </span>
                                                    <span className="ml-1 text-xs text-purple-600">
                                                        🏠
                                                    </span>
                                                    {room.purpose && (
                                                        <div className="text-xs text-gray-500">
                                                            {room.purpose}
                                                        </div>
                                                    )}
                                                    {room.childGroups &&
                                                        room.childGroups
                                                            .length > 0 && (
                                                            <div className="text-xs text-purple-500">
                                                                {
                                                                    room
                                                                        .childGroups
                                                                        .length
                                                                }{' '}
                                                                groups
                                                            </div>
                                                        )}
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-gray-500">
                                                        ({room.lines.length}{' '}
                                                        lines)
                                                    </span>
                                                    {selectedGroups.includes(
                                                        roomId,
                                                    ) && (
                                                        <span className="ml-1 text-purple-600">
                                                            ✓
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Room details when selected */}
                        {selectedGroup &&
                            groups[selectedGroup]?.type === 'room' && (
                                <div className="mt-3 border-t pt-3">
                                    <div className="mb-2 text-xs font-semibold">
                                        Room Details:
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs text-gray-600">
                                            <strong>Name:</strong>{' '}
                                            {groups[selectedGroup].name}
                                        </div>
                                        {groups[selectedGroup].purpose && (
                                            <div className="text-xs text-gray-600">
                                                <strong>Purpose:</strong>{' '}
                                                {groups[selectedGroup].purpose}
                                            </div>
                                        )}
                                        {groups[selectedGroup].description && (
                                            <div className="text-xs text-gray-600">
                                                <strong>Description:</strong>{' '}
                                                {
                                                    groups[selectedGroup]
                                                        .description
                                                }
                                            </div>
                                        )}
                                        {groups[selectedGroup].stoneType && (
                                            <div className="text-xs text-gray-600">
                                                <strong>Stone Type:</strong>{' '}
                                                {
                                                    groups[selectedGroup]
                                                        .stoneType
                                                }
                                            </div>
                                        )}
                                        {groups[selectedGroup].metadata &&
                                            Object.keys(
                                                groups[selectedGroup].metadata,
                                            ).length > 0 && (
                                                <div className="text-xs text-gray-600">
                                                    <strong>Metadata:</strong>
                                                    <div className="mt-1 ml-2 space-y-0.5">
                                                        {Object.entries(
                                                            groups[
                                                                selectedGroup
                                                            ].metadata,
                                                        ).map(
                                                            ([key, value]) => (
                                                                <div
                                                                    key={key}
                                                                    className="text-xs"
                                                                >
                                                                    •{' '}
                                                                    {key.toUpperCase()}
                                                                    : {value}
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        {groups[selectedGroup].childGroups &&
                                            groups[selectedGroup].childGroups
                                                .length > 0 && (
                                                <div className="text-xs text-gray-600">
                                                    <strong>
                                                        Contains Groups:
                                                    </strong>
                                                    <div className="mt-1 ml-2">
                                                        {groups[
                                                            selectedGroup
                                                        ].childGroups.map(
                                                            (groupId) => (
                                                                <div
                                                                    key={
                                                                        groupId
                                                                    }
                                                                    className="text-xs"
                                                                >
                                                                    •{' '}
                                                                    {groups[
                                                                        groupId
                                                                    ]?.name ||
                                                                        'Unknown Group'}
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            )}

                        {/* Show message when no rooms exist */}
                        {Object.keys(groups).filter(
                            (id) => groups[id].type === 'room',
                        ).length === 0 && (
                            <div className="py-2 text-xs text-gray-500">
                                No rooms created yet.<br></br> Select multiple
                                groups to create a room.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* if tooltipMode === 'room' */}
            {tooltipMode === 'room' &&
                Object.keys(groups).filter((id) => groups[id].type === 'room')
                    .length > 0 && (
                    <div className="fixed top-4 right-4 max-w-xs rounded border p-4 shadow-lg">
                        <h3 className="mb-2 font-semibold text-purple-600">
                            Room Info
                        </h3>
                        <div className="space-y-1 text-sm">
                            <div>
                                Total Rooms:{' '}
                                {
                                    Object.keys(groups).filter(
                                        (id) => groups[id].type === 'room',
                                    ).length
                                }
                            </div>
                            {selectedGroups.filter(
                                (id) => groups[id].type === 'room',
                            ).length > 0 && (
                                <div className="font-semibold text-purple-600">
                                    Selected Rooms:{' '}
                                    {
                                        selectedGroups.filter(
                                            (id) => groups[id].type === 'room',
                                        ).length
                                    }
                                </div>
                            )}
                        </div>

                        {/* Display all rooms */}
                        <div className="mt-3 border-t pt-3">
                            <div className="mb-2 text-xs font-semibold">
                                Available Rooms:
                            </div>
                            <div className="max-h-32 space-y-1 overflow-y-auto">
                                {Object.entries(groups)
                                    .filter(
                                        ([_, group]) => group.type === 'room',
                                    )
                                    .map(([roomId, room]) => (
                                        <div
                                            key={roomId}
                                            className={`flex cursor-pointer items-center justify-between rounded px-1 text-xs hover:bg-gray-100 ${
                                                selectedGroups.includes(roomId)
                                                    ? 'border border-purple-300 bg-purple-100'
                                                    : selectedGroup === roomId
                                                      ? 'border border-purple-300 bg-purple-100'
                                                      : ''
                                            }`}
                                            onClick={() => selectGroup(roomId)}
                                        >
                                            <div className="flex-1">
                                                <span className="truncate">
                                                    {room.name}
                                                </span>
                                                <span className="ml-1 text-xs text-purple-600">
                                                    🏠
                                                </span>
                                                {room.purpose && (
                                                    <div className="text-xs text-gray-500">
                                                        {room.purpose}
                                                    </div>
                                                )}
                                                {room.childGroups &&
                                                    room.childGroups.length >
                                                        0 && (
                                                        <div className="text-xs text-purple-500">
                                                            {
                                                                room.childGroups
                                                                    .length
                                                            }{' '}
                                                            groups
                                                        </div>
                                                    )}
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-gray-500">
                                                    ({room.lines.length} lines)
                                                </span>
                                                {selectedGroups.includes(
                                                    roomId,
                                                ) && (
                                                    <span className="ml-1 text-purple-600">
                                                        ✓
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
}
