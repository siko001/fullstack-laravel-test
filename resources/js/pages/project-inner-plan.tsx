import ProjectDetailCard from '@/components/project-detail-card';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

export default function ProjectInnerPlan({
    project,
    plan,
}: {
    project: any;
    plan: any;
}) {
    const [libredwg, setLibredwg] = useState(null);
    const [svgContent, setSvgContent] = useState(null);
    const fileInputRef = useRef(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        const script = document.createElement('script');
        script.src = '/lib/libredwg-web.js';
        script.type = 'module';

        script.onload = async () => {
            const { Dwg_File_Type, LibreDwg } = window;

            const lib = await LibreDwg.create();
            setLibredwg({ lib, Dwg_File_Type });
        };
        document.body.appendChild(script);
    }, []);

    const handleFileChange = async (event: { target: { files: any[] } }) => {
        const file = event.target.files[0];
        if (!file || !libredwg) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const fileContent = e.target.result;
                const dwg = libredwg.lib.dwg_read_data(
                    fileContent,
                    libredwg.Dwg_File_Type.DWG,
                );
                const db = libredwg.lib.convert(dwg);
                const svgString = libredwg.lib.dwg_to_svg(db);
                setSvgContent(svgString);
                libredwg.lib.dwg_free(dwg);
            } catch (error) {
                console.error('Failed to process DWG file:', error);
                setSvgContent(null);
            }
        };

        reader.readAsArrayBuffer(file);
    };

    const saveSvg = async (svgString: any) => {
        try {
            const projectName = project.name.replace(/\s/g, '-').toLowerCase();
            const planLabel =
                plan?.name?.replace(/\s/g, '-').toLowerCase() ??
                `plan-${plan?.slot ?? '1'}`;
            const filename = `${projectName}-${planLabel}-${Date.now()}.svg`;
            const response = await axios.post('/save-svg', {
                filename: filename,
                svg: svgString,
                plan_id: plan.id,
            });

            // Show success message
            setSaveMessage('SVG saved successfully! Redirecting...');

            // Handle redirect after a short delay
            if (response.data.redirect_url) {
                setTimeout(() => {
                    window.location.href = response.data.redirect_url;
                }, 1500);
            }
        } catch (err) {
            console.error('Failed to save SVG:', err);
        }
    };

    const handleSave = async () => {
        if (!svgContent) return;
        setIsSaving(true);
        setSaveMessage('Saving SVG...');
        try {
            await saveSvg(svgContent);
        } catch (error) {
            setSaveMessage('Failed to save SVG');
            console.error('Save error:', error);
            setIsSaving(false);
        }
    };

    return (
        <div className="relative grid h-screen w-full place-items-center plan-manager">
            {project && plan && (
                <ProjectDetailCard project={project} plan={plan} />
            )}

            <div>
                <div className="flex flex-col-reverse gap-8 sm:flex-row md:items-center">
                    <form action="">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".dwg,application/acad"
                            className="ease min-h-[75px] cursor-pointer rounded-md border border-dashed p-4 text-center text-gray-400 transition-colors duration-200 hover:border-blue-600 hover:text-blue-800"
                        />
                    </form>

                    <div>
                        <h2 className="text-3xl font-bold">Upload A Plan</h2>
                        <p className="text-gray-300">
                            Please upload a plan for this project.
                        </p>
                    </div>
                </div>

                <div className="mx-auto mt-8 h-[400px]">
                    {svgContent && (
                        <div
                            className="mx-auto h-[600px] plan-preview rounded bg-white p-6"
                            dangerouslySetInnerHTML={{ __html: svgContent }}
                        />
                    )}
                </div>
            </div>

            {svgContent && (
                <div className="fixed right-4 bottom-4 flex gap-2">
                    <button
                        onClick={handleSave}
                        className="ease cursor-pointer rounded bg-blue-500 px-4 py-2 text-white transition-colors duration-200 hover:bg-blue-600"
                    >
                        Save
                    </button>
                    <button
                        onClick={() => {
                            setSvgContent(null);
                            if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                            }
                        }}
                        className="ease cursor-pointer rounded bg-red-500 px-4 py-2 text-white transition-colors duration-200 hover:bg-red-600"
                    >
                        Discard
                    </button>
                </div>
            )}

            {saveMessage && (
                <div
                    className={`fixed bottom-4 left-4 rounded-md px-4 py-2 font-bold text-white ${saveMessage.includes('success') ? 'bg-green-500' : 'bg-red-500'}`}
                >
                    {saveMessage}
                </div>
            )}
        </div>
    );
}
