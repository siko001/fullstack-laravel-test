export default function ProjectDetailCard({ project }: { project: any }) {
    return (
        <div className="p-2 rounded-md border border-gray-600 absolute top-2 left-2">
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
        </div>
    );
}