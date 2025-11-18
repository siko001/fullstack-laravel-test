type ProjectDetailCardProps = {
    project: any;
    plan: any;
};

const STATUS_LABELS: Record<string, string> = {
    pending_upload: 'Pending Upload',
    processing: 'Processing',
    ready: 'Ready',
};

export default function ProjectDetailCard({ project, plan }: ProjectDetailCardProps) {
    const handleConfirmation = async () => {
        const confirmed = window.confirm(
            'Are you sure you want to delete the plan? All data will be lost.'
        );

        if (!confirmed) {
            return;
        }
        const csrfToken =
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') ?? '';

        try {
            const response = await fetch(`/projects/${project.id}/plans/${plan.id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
            });
            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || 'Unable to delete plan');
            }

            window.location.href = `/projects/${project.id}`;
        } catch (error) {
            console.error('Delete plan failed:', error);
            window.alert('Unable to delete the plan. Please try again.');
        }
    };
    return (
        <div className="p-3 rounded-md border border-gray-600 fixed top-2 left-2 bg-gray-900/80 backdrop-blur">
            <h1 className="text-lg font-semibold">
                <span className="text-sm text-gray-400 mr-1">Project:</span>
                {project.name}
            </h1>

            <p className="text-sm text-gray-300 mt-1">
                <span className="text-gray-400">Owner:</span>
                {project.owner}
            </p>

            <p className="text-sm text-gray-300">
                <span className="text-gray-400">Location:</span>
                {project.location}
            </p>

            <div className="border-t border-gray-700 mt-3 pt-3 text-sm text-gray-300 space-y-1">
                <p>
                    <span className="text-gray-400">Plan:</span> {plan.name} (Slot #{plan.slot})
                </p>
                <p>
                    <span className="text-gray-400">Status:</span>{' '}
                    {STATUS_LABELS[plan.status] ?? plan.status}
                </p>
            </div>

            <div className="flex gap-2 mt-3">
                <a
                    href={`/projects/${project.id}`}
                    className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white"
                >
                    Back to Plans
                </a>
                <button
                    onClick={handleConfirmation}
                    className="px-2 py-0.5 bg-red-500 hover:bg-red-600 rounded text-xs text-white"
                >
                    Delete Plan
                </button>
            </div>
        </div>
    );
}
