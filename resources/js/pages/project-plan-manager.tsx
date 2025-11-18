import { useState } from 'react';

type ProjectPlanManagerProps = {
    project: any;
    plans: any[];
    maxPlans: number;
};

const STATUS_MAP: Record<
    string,
    { label: string; badge: string; description: string }
> = {
    pending_upload: {
        label: 'Pending Upload',
        badge: 'bg-yellow-100 text-yellow-800',
        description: 'Upload a DWG to start working on this plan.',
    },
    ready: {
        label: 'Ready',
        badge: 'bg-green-100 text-green-800',
        description: 'Plan is ready. Continue detailing or reviewing.',
    },
    processing: {
        label: 'Processing',
        badge: 'bg-blue-100 text-blue-800',
        description: 'Please wait while we finish preparing this plan.',
    },
};

export default function ProjectPlanManager({
    project,
    plans,
    maxPlans,
}: ProjectPlanManagerProps) {
    const [isCreating, setIsCreating] = useState(false);
    const csrfToken =
        typeof document !== 'undefined'
            ? document
                  ?.querySelector('meta[name="csrf-token"]')
                  ?.getAttribute('content') ?? ''
            : '';

    const availableSlots = maxPlans - plans.length;

    const handleCreatePlan = async () => {
        if (availableSlots <= 0 || isCreating) return;
        const requestedName = prompt(
            'Enter a name for the new plan (optional):'
        );

        if (requestedName === null) {
            return;
        }
        setIsCreating(true);
        try {
            const response = await fetch(`/projects/${project.id}/plans`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    name:
                        requestedName && requestedName.trim().length > 0
                            ? requestedName.trim()
                            : undefined,
                }),
            });

            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || 'Unable to create plan');
            }

            const data = await response.json();
            window.location.href = data.redirect_url;
        } catch (error) {
            console.error('Create plan failed:', error);
            alert(
                error instanceof Error
                    ? error.message
                    : 'Unable to create plan. Please try again.'
            );
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeletePlan = async (planId: number) => {
        if (
            !window.confirm(
                'Delete this plan? All associated data will be permanently removed.'
            )
        ) {
            return;
        }

        try {
            const response = await fetch(
                `/projects/${project.id}/plans/${planId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                }
            );

            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || 'Unable to delete plan');
            }

            if (typeof window !== 'undefined') {
                localStorage.removeItem(`lineGroups:${planId}`);
            }
            window.location.reload();
        } catch (error) {
            console.error('Delete plan failed:', error);
            alert(
                error instanceof Error
                    ? error.message
                    : 'Unable to delete the plan. Please try again.'
            );
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white px-6 py-10">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex flex-col gap-2">
                    <p className="text-sm uppercase text-gray-500 tracking-wide">
                        Project
                    </p>
                    <h1 className="text-4xl font-bold">{project.name}</h1>
                    <div className="text-gray-400 text-sm flex gap-6 flex-wrap">
                        <span>Owner: {project.owner}</span>
                        <span>Location: {project.location}</span>
                        <span>
                            Plans: {plans.length} / {maxPlans}
                        </span>
                    </div>
                </header>

                <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/3 space-y-4">
                        <div className="border border-gray-800 rounded-lg p-5 bg-gray-900">
                            <h2 className="text-lg font-semibold mb-2">
                                Plan Slots
                            </h2>
                            <p className="text-sm text-gray-400 mb-4">
                                Create up to {maxPlans} distinct plans for this
                                project. Each plan has its own upload and
                                detailing flow.
                            </p>
                            <button
                                onClick={handleCreatePlan}
                                disabled={availableSlots <= 0 || isCreating}
                                className={`w-full px-4 py-2 rounded text-sm font-semibold transition ${
                                    availableSlots <= 0 || isCreating
                                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                                }`}
                            >
                                {availableSlots <= 0
                                    ? 'Plan limit reached'
                                    : isCreating
                                      ? 'Creating...'
                                      : 'Add Plan'}
                            </button>
                        </div>
                        <div className="border border-gray-800 rounded-lg p-5 bg-gray-900">
                            <h3 className="text-base font-semibold mb-2">
                                How it works
                            </h3>
                            <ol className="list-decimal text-sm space-y-1 text-gray-400 ml-4">
                                <li>Create a plan slot.</li>
                                <li>Upload a DWG file.</li>
                                <li>Enter the detailing workspace.</li>
                            </ol>
                        </div>
                    </div>

                    <div className="md:flex-1 space-y-4">
                        {plans.length === 0 && (
                            <div className="border border-dashed border-gray-700 rounded-lg p-8 text-center text-gray-400">
                                No plans yet. Create one to get started.
                            </div>
                        )}

                        {plans.map((plan) => {
                            const meta =
                                STATUS_MAP[plan.status] ?? STATUS_MAP.ready;

                            return (
                                <div
                                    key={plan.id}
                                    className="border border-gray-800 rounded-xl p-5 bg-gray-900 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
                                >
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-semibold">
                                                {plan.name}
                                            </h3>
                                            <span
                                                className={`text-xs font-semibold px-2 py-1 rounded-full ${meta.badge}`}
                                            >
                                                {meta.label}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-400 mt-1">
                                            Slot #{plan.slot} ·{' '}
                                            {meta.description}
                                        </p>
                                        {plan.updated_at && (
                                            <p className="text-xs text-gray-500 mt-2">
                                                Updated:{' '}
                                                {new Date(
                                                    plan.updated_at
                                                ).toLocaleString()}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-2 md:items-center">
                                        <a
                                            href={`/projects/${project.id}/plans/${plan.id}`}
                                            className={`px-4 py-2 rounded text-sm font-semibold text-center ${
                                                plan.svg_path
                                                    ? 'bg-green-600 hover:bg-green-500'
                                                    : 'bg-yellow-600 hover:bg-yellow-500'
                                            }`}
                                        >
                                            {plan.svg_path
                                                ? 'Open plan workspace'
                                                : 'Upload plan'}
                                        </a>
                                        <button
                                            onClick={() =>
                                                handleDeletePlan(plan.id)
                                            }
                                            className="px-4 py-2 rounded text-sm font-semibold bg-red-700 hover:bg-red-600"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

