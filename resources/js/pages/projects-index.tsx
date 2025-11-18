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
        <div className="min-h-screen bg-gray-950 px-6 py-10 text-white">
            <div className="mx-auto max-w-6xl space-y-8">
                <header className="flex flex-col gap-2">
                    <p className="text-sm tracking-wide text-gray-500 uppercase">
                        Projects
                    </p>
                    <h1 className="text-4xl font-bold">Your Projects</h1>
                </header>

                <div className="flex items-center justify-between">
                    <p className="text-gray-400">
                        Manage your demolition appraisal projects
                    </p>
                    <Link
                        href="/create-project"
                        className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500"
                    >
                        Create New Project
                    </Link>
                </div>

                {projects.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-700 p-8 text-center text-gray-400">
                        No projects yet. Create your first project to get
                        started.
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className="rounded-xl border border-gray-800 bg-gray-900 p-5 transition-colors hover:bg-gray-800"
                            >
                                <h3 className="mb-2 text-xl font-semibold">
                                    {project.name}
                                </h3>
                                <p className="mb-1 text-sm text-gray-400">
                                    Owner: {project.owner}
                                </p>
                                <p className="mb-4 text-sm text-gray-400">
                                    Location: {project.location}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">
                                        {project.plans_count} plans
                                    </span>
                                    <Link
                                        href={`/projects/${project.id}`}
                                        className="rounded bg-green-600 px-3 py-1 text-sm font-semibold text-white hover:bg-green-500"
                                    >
                                        Manage
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="absolute -bottom-[25%] h-[300px] w-full bg-blue-800 opacity-20 blur-[50px]"></div>
        </div>
    );
}
