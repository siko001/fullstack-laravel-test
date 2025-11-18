import { Link } from '@inertiajs/react';

type Project = {
    id: number;
    name: string;
    owner: string;
    location: string;
    plans_count: number;
};

type ProjectsIndexProps = {
    projects: Project[];
};

export default function ProjectsIndex({ projects }: ProjectsIndexProps) {
    return (
        <div className="min-h-screen bg-gray-950 text-white px-6 py-10">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex flex-col gap-2">
                    <p className="text-sm uppercase text-gray-500 tracking-wide">
                        Projects
                    </p>
                    <h1 className="text-4xl font-bold">Your Projects</h1>
                </header>

                <div className="flex justify-between items-center">
                    <p className="text-gray-400">
                        Manage your demolition appraisal projects
                    </p>
                    <Link
                        href="/create-project"
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-semibold"
                    >
                        Create New Project
                    </Link>
                </div>

                {projects.length === 0 ? (
                    <div className="border border-dashed border-gray-700 rounded-lg p-8 text-center text-gray-400">
                        No projects yet. Create your first project to get started.
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className="border border-gray-800 rounded-xl p-5 bg-gray-900 hover:bg-gray-800 transition-colors"
                            >
                                <h3 className="text-xl font-semibold mb-2">
                                    {project.name}
                                </h3>
                                <p className="text-sm text-gray-400 mb-1">
                                    Owner: {project.owner}
                                </p>
                                <p className="text-sm text-gray-400 mb-4">
                                    Location: {project.location}
                                </p>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">
                                        {project.plans_count} plans
                                    </span>
                                    <Link
                                        href={`/projects/${project.id}`}
                                        className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm font-semibold"
                                    >
                                        Manage
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}