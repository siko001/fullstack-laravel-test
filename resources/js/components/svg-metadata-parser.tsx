import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

interface RoomMetadata {
    level?: string;
    usfl?: string;
    ffl?: string;
    [key: string]: string | undefined;
}

interface TextElement {
    id: string;
    text: string;
    x: number;
    y: number;
    roomId?: string;
}

interface ParsedRoom {
    id: string;
    name?: string;
    metadata: RoomMetadata;
    textElements: TextElement[];
}

interface SVGMetadata {
    level?: string;
    rooms: ParsedRoom[];
    globalMetadata: RoomMetadata;
    allTextElements: TextElement[];
    allMetadataOptions: Record<string, string[]>;
}

export interface SVGMetadataParserRef {
    metadata: SVGMetadata;
    textElements: TextElement[];
    rooms: ParsedRoom[];
    removeTextElements: (svgString: string) => string;
    getRoomOptions: (key: string) => string[];
    getGlobalLevel: () => string | undefined;
    getAllMetadataKeys: () => string[];
    getCleanedSVG: () => string;
}

// Modal Component
interface SVGMetadataModalProps {
    isOpen: boolean;
    onClose: () => void;
    metadata: SVGMetadata;
    onRemoveTextElements: () => void;
    cleanedSVG?: string;
}

function SVGMetadataModal({
    isOpen,
    onClose,
    metadata,
    onRemoveTextElements,
    cleanedSVG,
}: SVGMetadataModalProps) {
    if (!isOpen) return null;

    const getAllKeys = (): string[] => {
        const keys = new Set<string>();
        metadata.rooms.forEach((room) => {
            Object.keys(room.metadata).forEach((key) => keys.add(key));
        });
        return Array.from(keys).sort();
    };

    const getUniqueValues = (key: string): string[] => {
        const values = new Set<string>();
        metadata.rooms.forEach((room) => {
            const value = room.metadata[key];
            if (value) values.add(value);
        });
        return Array.from(values).sort();
    };

    useEffect(() => {
        // close modal on esc key press
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <>
            <div
                onClick={onClose}
                className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm max-lg:bg-black"
            ></div>
            <div className="fixed top-0 left-[50%] z-[9999] -translate-x-1/2 transform">
                <div className="mt-4 max-h-[95vh] max-w-[1200px] min-w-[90vw] overflow-y-auto rounded-lg bg-white px-6 py-4 lg:min-w-[800px]">
                    <div className="mb-2 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-800">
                            Data
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-2xl font-bold text-red-500 hover:text-gray-700"
                        >
                            ×
                        </button>
                    </div>

                    {/* Global Level */}
                    {metadata.level && (
                        <div className="mb-4 rounded-lg bg-blue-50 px-4 py-2">
                            <h3 className="text-lg font-semibold text-blue-800">
                                Plan Level
                            </h3>
                            <p className="text-blue-600">{metadata.level}</p>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="mb-2 grid grid-cols-3 gap-4">
                        <div className="rounded-lg bg-gray-50 px-4 py-2">
                            <h4 className="font-semibold text-gray-700">
                                Total Rooms
                            </h4>
                            <p className="text-2xl font-bold text-gray-900">
                                {metadata.rooms.length}
                            </p>
                        </div>
                        <div className="rounded-lg bg-gray-50 px-4 py-2">
                            <h4 className="font-semibold text-gray-700">
                                Text Elements
                            </h4>
                            <p className="text-2xl font-bold text-gray-900">
                                {metadata.allTextElements.length}
                            </p>
                        </div>
                        <div className="rounded-lg bg-gray-50 px-4 py-2">
                            <h4 className="font-semibold text-gray-700">
                                Metadata Keys
                            </h4>
                            <p className="text-2xl font-bold text-gray-900">
                                {getAllKeys().length}
                            </p>
                        </div>
                    </div>

                    {/* Metadata Keys and Options */}
                    {getAllKeys().length > 0 && (
                        <div className="mb-4">
                            <h3 className="mb-2 text-lg font-semibold text-gray-800">
                                Available Metadata Keys & Options
                            </h3>
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                {getAllKeys().map((key) => (
                                    <div
                                        key={key}
                                        className="rounded-lg border px-4 py-2"
                                    >
                                        <h4 className="font-semibold text-gray-700 uppercase">
                                            {key
                                                .replace(/([A-Z])/g, ' $1')
                                                .trim()}
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {getUniqueValues(key).map(
                                                (value) => (
                                                    <span
                                                        key={value}
                                                        className="rounded bg-blue-100 px-1 py-0.5 text-xs text-blue-800"
                                                    >
                                                        {value}
                                                    </span>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Rooms Details */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Room Details
                        </h3>
                        <div className="space-y-2">
                            {metadata.rooms.map((room, index) => (
                                <div
                                    key={room.id}
                                    className="rounded-lg border px-4 py-2"
                                >
                                    <div className="mb-2 flex items-start justify-between">
                                        <h4 className="font-semibold text-gray-700">
                                            {room.name || `Room ${index + 1}`}
                                        </h4>
                                    </div>
                                    {Object.keys(room.metadata).length > 0 ? (
                                        <div className="grid grid-cols-2 gap-0.5">
                                            {Object.entries(room.metadata).map(
                                                ([key, value]) => (
                                                    <div
                                                        key={key}
                                                        className="text-sm"
                                                    >
                                                        <span className="font-medium text-gray-600 uppercase">
                                                            {key
                                                                .replace(
                                                                    /([A-Z])/g,
                                                                    ' $1',
                                                                )
                                                                .trim()}
                                                            :
                                                        </span>{' '}
                                                        <span className="text-gray-800">
                                                            {value}
                                                        </span>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">
                                            No metadata found
                                        </p>
                                    )}
                                    <div className="mt-1 text-xs text-gray-400">
                                        {room.textElements.length} text elements
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Raw Text Elements */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800">
                            All Text Elements
                        </h3>
                        <div className="max-h-40 overflow-y-auto rounded-lg bg-gray-50 px-4 py-2">
                            <div className="space-y-1">
                                {metadata.allTextElements.map(
                                    (element, index) => (
                                        <div
                                            key={index}
                                            className="text-sm text-gray-600"
                                        >
                                            <span className="rounded bg-white px-2 py-1 font-mono">
                                                {element.text}
                                            </span>
                                            <span className="ml-2 text-xs text-gray-400">
                                                (x: {Math.round(element.x)}, y:{' '}
                                                {Math.round(element.y)})
                                            </span>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// Fixed Button Component
interface SVGMetadataButtonProps {
    onClick: () => void;
    hasData: boolean;
}

function SVGMetadataButton({ onClick, hasData }: SVGMetadataButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`fixed top-54 left-2 z-50 transform cursor-pointer rounded px-3 py-2 shadow-lg transition-all hover:scale-105 ${
                hasData
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'cursor-not-allowed bg-gray-400 text-gray-200'
            }`}
            disabled={!hasData}
        >
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Plan Data</span>
                {hasData && (
                    <span className="h-2 w-2 animate-pulse rounded-full bg-green-400"></span>
                )}
            </div>
        </button>
    );
}

// Main Parser Component with Modal
export default forwardRef<
    SVGMetadataParserRef,
    {
        svgContent: string | null;
        onMetadataChange: (
            metadata: SVGMetadata,
            textElements: TextElement[],
            rooms: ParsedRoom[],
        ) => void;
    }
>(function SVGMetadataParser({ svgContent, onMetadataChange }, ref) {
    const [metadata, setMetadata] = useState<SVGMetadata>({
        rooms: [],
        globalMetadata: {},
        allTextElements: [],
        allMetadataOptions: {},
    });
    const [textElements, setTextElements] = useState<TextElement[]>([]);
    const [rooms, setRooms] = useState<ParsedRoom[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [cleanedSVG, setCleanedSVG] = useState<string | null>(null);

    // Helper function to group text elements by proximity
    const groupTextElementsByProximity = (elements: TextElement[]) => {
        // Check if this looks like plan-level metadata (has level indicator and key-value pairs)
        const hasLevel = elements.some(
            (el) =>
                el.text.toLowerCase().includes('level') &&
                !el.text.includes(':'),
        );
        const hasKeyValuePairs = elements.some((el) => el.text.includes(':'));

        // If we have both level and key-value pairs, treat as single plan/room
        if (hasLevel && hasKeyValuePairs && elements.length <= 5) {
            return [
                {
                    id: 'plan-metadata',
                    textElements: elements,
                    centerX:
                        elements.reduce((sum, el) => sum + el.x, 0) /
                        elements.length,
                    centerY:
                        elements.reduce((sum, el) => sum + el.y, 0) /
                        elements.length,
                },
            ];
        }

        // Otherwise use proximity-based grouping for multiple rooms
        const groups: {
            id: string;
            textElements: TextElement[];
            centerX: number;
            centerY: number;
        }[] = [];
        const maxDistance = 500; // Maximum distance between elements in same room

        elements.forEach((element) => {
            let assignedToGroup = false;

            // Try to assign to existing group
            for (const group of groups) {
                const distance = Math.sqrt(
                    Math.pow(element.x - group.centerX, 2) +
                        Math.pow(element.y - group.centerY, 2),
                );

                if (distance <= maxDistance) {
                    group.textElements.push(element);
                    // Recalculate group center
                    group.centerX =
                        group.textElements.reduce((sum, el) => sum + el.x, 0) /
                        group.textElements.length;
                    group.centerY =
                        group.textElements.reduce((sum, el) => sum + el.y, 0) /
                        group.textElements.length;
                    assignedToGroup = true;
                    break;
                }
            }

            // Create new group if not assigned
            if (!assignedToGroup) {
                groups.push({
                    id: `room-${groups.length}`,
                    textElements: [element],
                    centerX: element.x,
                    centerY: element.y,
                });
            }
        });

        return groups;
    };

    useEffect(() => {
        if (!svgContent) return;

        const parseSVGText = () => {
            // Create a temporary DOM element to parse SVG
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
            const textNodes = svgDoc.querySelectorAll('text');

            const extractedElements: TextElement[] = [];
            const globalMetadata: RoomMetadata = {};
            let globalLevel: string | undefined;
            const allMetadataOptionsMap: Record<string, Set<string>> = {};

            // First pass: extract all text elements and identify global level
            textNodes.forEach((textNode, index) => {
                const textContent = textNode.textContent?.trim();
                if (!textContent) return;

                const parentGroup = textNode.closest('g');
                const groupId = parentGroup?.id || `text-${index}`;

                // Get position
                const x = parseFloat(textNode.getAttribute('x') || '0');
                const y = parseFloat(textNode.getAttribute('y') || '0');

                const textElement: TextElement = {
                    id: groupId,
                    text: textContent,
                    x,
                    y,
                };

                extractedElements.push(textElement);

                // Parse metadata from text
                const keyValueMatch =
                    textContent.match(
                        /^([A-Za-z][A-Za-z0-9\s]*)\s*[:=]\s*([^(]+)/,
                    ) || textContent.match(/^(USFL|FFL)\s+([^(]+)/i);

                if (keyValueMatch) {
                    const [, rawKey, rawValue] = keyValueMatch;
                    const normalizedKey = rawKey
                        .toLowerCase()
                        .replace(/\s+/g, '');
                    if (normalizedKey !== 'level' && normalizedKey !== 'plan') {
                        if (!allMetadataOptionsMap[normalizedKey]) {
                            allMetadataOptionsMap[normalizedKey] = new Set<string>();
                        }
                        allMetadataOptionsMap[normalizedKey].add(rawValue.trim());
                    }
                }

                // Check for global level (usually larger font size, standalone)
                if (
                    textContent.toLowerCase().includes('level') &&
                    !textContent.includes(':')
                ) {
                    const levelMatch = textContent.match(/level\s*(\d+)/i);
                    if (levelMatch) {
                        globalLevel = levelMatch[1];
                    } else {
                        globalLevel = textContent;
                    }
                }
            });

            // Group text elements by proximity to identify rooms
            const roomGroups = groupTextElementsByProximity(extractedElements);

            // Parse each room's metadata
            const parsedRooms: ParsedRoom[] = roomGroups.map((group, index) => {
                const roomMetadata: RoomMetadata = {};
                let roomName: string | undefined;

                group.textElements.forEach((element) => {
                    const textContent = element.text;

                    const keyValueMatch =
                        textContent.match(
                            /^([A-Za-z][A-Za-z0-9\s]*)\s*[:=]\s*(.+)$/,
                        ) || textContent.match(/^(USFL|FFL)\s+(.+)$/i);

                    if (keyValueMatch) {
                        const [, rawKey, rawValue] = keyValueMatch;
                        const normalizedKey = rawKey
                            .toLowerCase()
                            .replace(/\s+/g, '');
                        if (normalizedKey !== 'level') {
                            roomMetadata[normalizedKey] = rawValue.trim();
                            return;
                        }
                    }

                    if (
                        textContent.toLowerCase().includes('level') &&
                        !textContent.includes(':') &&
                        !textContent.includes('=')
                    ) {
                        // Room-specific level
                        const levelMatch = textContent.match(/level\s*(\d+)/i);
                        if (levelMatch) {
                            roomMetadata.level = levelMatch[1];
                        } else {
                            roomMetadata.level = textContent;
                        }
                    } else if (
                        !textContent.toLowerCase().includes('level') &&
                        !textContent.includes(':')
                    ) {
                        // Potential room name
                        roomName = textContent;
                    }
                });

                return {
                    id: group.id,
                    name: roomName,
                    metadata: roomMetadata,
                    textElements: group.textElements,
                };
            });

            // Set global level if no room-specific levels found
            if (
                globalLevel &&
                parsedRooms.every((room) => !room.metadata.level)
            ) {
                parsedRooms.forEach((room) => {
                    room.metadata.level = globalLevel;
                });
            }

            const finalMetadata: SVGMetadata = {
                level: globalLevel,
                rooms: parsedRooms,
                globalMetadata,
                allTextElements: extractedElements,
                allMetadataOptions: Object.fromEntries(
                    Object.entries(allMetadataOptionsMap).map(([key, values]) => [
                        key,
                        Array.from(values).sort(),
                    ]),
                ),
            };

            setMetadata(finalMetadata);
            setTextElements(extractedElements);
            setRooms(parsedRooms);
            onMetadataChange(finalMetadata, extractedElements, parsedRooms);
        };

        parseSVGText();
    }, [svgContent, onMetadataChange]);


    // Function to remove text elements from SVG
    const removeTextElements = (svgString: string): string => {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
        const textNodes = svgDoc.querySelectorAll('text');

        textNodes.forEach((textNode) => {
            textNode.style.display = 'none';
        });

        return new XMLSerializer().serializeToString(svgDoc);
    };

    // Helper function to get unique values for a specific metadata key across all rooms
    const getRoomOptions = (key: string): string[] => {
        const options = new Set<string>();
        rooms.forEach((room) => {
            const value = room.metadata[key.toLowerCase()];
            if (value) options.add(value);
        });
        return Array.from(options);
    };

    // Helper function to get global level
    const getGlobalLevel = (): string | undefined => {
        return metadata.level;
    };

    // Helper function to get all metadata keys
    const getAllMetadataKeys = (): string[] => {
        const keys = new Set<string>();
        rooms.forEach((room) => {
            Object.keys(room.metadata).forEach((key) => keys.add(key));
        });
        return Array.from(keys);
    };

    // Helper function to get cleaned SVG
    const getCleanedSVG = (): string => {
        if (!svgContent) return '';
        return removeTextElements(svgContent);
    };

    // Handle removing text elements from current SVG
    const handleRemoveTextElements = () => {
        if (!svgContent) return;
        const cleaned = removeTextElements(svgContent);
        setCleanedSVG(cleaned);
    };

    // Expose functions and data to parent component via ref
    useImperativeHandle(
        ref,
        () => ({
            metadata,
            textElements,
            rooms,
            removeTextElements,
            getRoomOptions,
            getGlobalLevel,
            getAllMetadataKeys,
            getCleanedSVG,
        }),
        [metadata, textElements, rooms, svgContent],
    );

    return (
        <>
            {/* Fixed Button */}
            <SVGMetadataButton
                onClick={() => setIsModalOpen(true)}
                hasData={metadata.allTextElements.length > 0}
            />

            {/* Modal */}
            <SVGMetadataModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                metadata={metadata}
                onRemoveTextElements={handleRemoveTextElements}
                cleanedSVG={cleanedSVG || undefined}
            />
        </>
    );
});

// Export individual components for use in other files
export { SVGMetadataButton, SVGMetadataModal };
