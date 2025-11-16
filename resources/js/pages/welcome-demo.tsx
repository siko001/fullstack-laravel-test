import { useState } from 'react';

interface FormData {
    name: string;
    owner: string;
    location: string;
    postcode: string;
    projectType: string;
    address: string;
}

export default function WelcomeDemo() {
    const [number, setNumber] = useState(0);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        owner: '',
        location: '',
        postcode: '',
        projectType: '',
        address: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Partial<FormData>>({});


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name as keyof FormData]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<FormData> = {};
        
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.owner.trim()) newErrors.owner = 'Owner is required';
        if (!formData.location.trim()) newErrors.location = 'Location is required';
        if (!formData.postcode.trim()) newErrors.postcode = 'Postcode is required';
        if (!formData.projectType) newErrors.projectType = 'Project type is required';
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        setIsSubmitting(true);
        
        try {
            const response = await fetch('/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    name: formData.name,
                    owner: formData.owner,
                    location: formData.location,
                    postcode: formData.postcode,
                    project_type: formData.projectType,
                    address: formData.address,
                }),
            });
            
            if (response.ok) {
                window.location.href = response.url;
            } 
        } catch (error) {
            console.error('Submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <div className='w-screen h-screen grid place-items-center md:overflow-hidden relative'>
            <div className="flex flex-col-reverse md:flex-row gap-16 items-center sm:items-start px-16">
            <div className="border rounded-md w-full md:max-w-[450px] p-6">
           
            <form onSubmit={handleSubmit} className="space-y-1">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="mb-4 flex flex-col gap-0.5">
                    <label className="peer-focus:text-blue-500 text-gray-300" htmlFor="name">Name</label>
                    <input 
                        className={`border-b ${errors.name ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:border-blue-500 transition-colors duration-200 ease`} 
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                    />
                    {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
                </div>
                
                  <div className="mb-4 flex flex-col gap-0.5">
                    <label className="peer-focus:text-blue-500 text-gray-300" htmlFor="owner">Owner</label>
                    <input 
                        className={`border-b ${errors.owner ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:border-blue-500 transition-colors duration-200 ease`} 
                        type="text" 
                        name="owner"
                        value={formData.owner}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                    />
                    {errors.owner && <span className="text-red-500 text-sm">{errors.owner}</span>}
                </div>
            </div>
            
            
            <div className="flex flex-col md:flex-row gap-4">
                <div className="mb-4 flex flex-col gap-0.5">
                    <label className="peer-focus:text-blue-500 text-gray-300" htmlFor="location">Location</label>
                    <input 
                        className={`border-b ${errors.location ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:border-blue-500 transition-colors duration-200 ease`} 
                        type="text" 
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                    />
                    {errors.location && <span className="text-red-500 text-sm">{errors.location}</span>}
                </div>
                <div className="mb-4 flex flex-col gap-0.5">
                    <label className="peer-focus:text-blue-500 text-gray-300" htmlFor="postcode">Postcode</label>
                    <input 
                        className={`border-b ${errors.postcode ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:border-blue-500 transition-colors duration-200 ease`} 
                        type="text" 
                        name="postcode"
                        value={formData.postcode}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                    />
                    {errors.postcode && <span className="text-red-500 text-sm">{errors.postcode}</span>}
                </div>
            </div>
            
            
            <div className="mb-4 flex flex-col items-start gap-0.5">
                <label className="peer-focus:text-blue-500 text-gray-300" htmlFor="projectType">Project Type</label>
                <select 
                    className={`border-b ${errors.projectType ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:border-blue-500 transition-colors duration-200 ease`}
                    name="projectType"
                    value={formData.projectType}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                >
                    <option value="">Select</option>
                    <option value="residential">Demolition Appraisal</option>
                    <option value="commercial">Excavation Appraisal</option>
                    <option value="industrial">Construction Appraisal </option>
                </select>
                {errors.projectType && <span className="text-red-500 text-sm">{errors.projectType}</span>}
            </div>
            
            
                 <div className="mb-4 flex flex-col gap-0.5">
                    <label className="peer-focus:text-blue-500  text-gray-300" htmlFor="address">Address</label>
                    <textarea 
                        className={`border-b ${errors.address ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:border-blue-500 transition-colors duration-200 ease`} 
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        rows={2}
                    />
                    {errors.address && <span className="text-red-500 text-sm">{errors.address}</span>}
                </div>
                
                <button 
                    type="submit" 
                    className="w-full bg-blue-500 text-white py-1.5 px-4 font-bold rounded-md cursor-pointer hover:bg-blue-600 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
                </form>
                
      
                
                
            </div>
            <div className="flex flex-col gap-2 max-md:text-center self-center relative -top-16 max-w-[500px]">
                <h1 className="text-4xl font-bold te">Welcome to Project Demolition</h1>
                <p className="text-gray-500">Please Start by filling in the information</p>
            </div>
            </div>
            
            <div className="absolute  -bottom-[25%] w-full h-[300px] blur-[50px] opacity-20 bg-blue-800"></div>
        </div>
        
    );
}
