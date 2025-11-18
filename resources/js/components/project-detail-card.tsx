export default function ProjectDetailCard({ project }: { project: any }) {
    
    
    const handleConfirmation = async () => {
        const confirmed = window.confirm(
            'Are you sure you want to delete the plan? All data will be lost.'
        );

        if (!confirmed) {
            return;
        }
        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');

        try {
            const response = await fetch(`/projects/${project.id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken ?? '',
                },
            });
            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || 'Unable to delete plan');
            }

            window.location.href = '/';
        } catch (error) {
            console.error('Delete plan failed:', error);
            window.alert('Unable to delete the plan. Please try again.');
        }
    };
    return (
        <div className="p-2 rounded-md border border-gray-600 fixed top-2 left-2">
            <h1>
                <span className="text-sm text-gray-300">Project: </span>
                {project.name}
            </h1>
            
            <p>
                <span className="text-sm text-gray-300">Owner: </span>
                {project.owner}
            </p>
            
            <p>
                <span className="text-sm text-gray-300">Location: </span> 
                {project.location}
            </p>
            
            <button onClick={handleConfirmation} className="px-2 py-0.5 bg-red-500 rounded text-xs text-white">
                Delete Plan
            </button>
        </div>
    );
}