import { useState } from 'react';

export default function Custom() {
    const [number, setNumber] = useState(0);
    const handleIncrement = () => {
        setNumber(prev => prev + 1);
    }
    return (
        <div className='w-screen h-screen grid place-items-center'>
            <div className="text-red-500">
              <p>
                  number is {number}
              </p>
                <button onClick={handleIncrement} className='rounded border border-red-500 text-red-500 px-2 py-1 mt-3 cursor-pointer hover:border-white hover:text-white transition-colors duration-200 ease'>Increment</button>
            </div>
        </div>
    );
}
