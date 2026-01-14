import React, { useState, useEffect } from 'react'
import { IoClose } from 'react-icons/io5'
import uploadImage from '../utils/UploadImage'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import AxiosTostError from '../utils/AxiosTostError'
import toast from 'react-hot-toast'

// CSS for animation
const modalStyles = `
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
`;

const modalAnimation = {
  overlay: {
    animation: 'fadeIn 0.3s ease-out',
  },
  content: {
    animation: 'slideIn 0.3s ease-out'
  }
};

function UploadCategoryModel ({close,fetchData})  {
    // Add the styles to the document
    useEffect(() => {
        const styleEl = document.createElement('style');
        styleEl.innerHTML = modalStyles;
        document.head.appendChild(styleEl);
        return () => {
            document.head.removeChild(styleEl);
        };
    }, []);
    
    const[data,setData] = useState({
        name:"",
        image:""
    })
    const [loading,setLoading] = useState(false)
    const handleOnChange = (e)=>{
        const { name, value} = e.target

        setData((preve)=>{
            return{
                ...preve,
                [name] : value
            }
        })
    }
    const handleSubmit = async(e)=>{
        e.preventDefault()


        try {
            setLoading(true)
            const response = await Axios({
                ...SummaryApi.addCategory,
                data : data
            })
            const { data : responseData } = response

            if(responseData.success){
                toast.success(responseData.message)
                close()
                 fetchData()
            }
        } catch (error) {
            AxiosTostError(error)
        }finally{
            setLoading(false)
        }
    }
    const handleUploadCategoryImage = async (e) =>{
        const file = e.target.files[0]
        if(!file)
        {
            return
        }
       
        try {
            const response = await uploadImage(file) 
            console.log('Upload response:', response); // Debug log
            
            // Check if the response indicates success
            if (response && response.data && response.data.success && response.data.data && response.data.data.url) {
                setData((preve) => {
                    return {
                        ...preve,
                        image: response.data.data.url
                    }
                })
                toast.success('Image uploaded successfully');
            } else if (response && response.data && response.data.error) {
                // Handle error response from our improved UploadImage utility
                console.error('Upload failed:', response.data.message);
                toast.error(response.data.message || 'Image upload failed');
            } else {
                // Handle unexpected response structure
                console.error('Unexpected response structure:', response);
                toast.error('Image upload failed: Unexpected server response');
            }
        } catch (error) {
            console.error('Image upload error:', error);
            toast.error('Image upload failed: ' + (error.message || 'Unknown error'));
        }
 
    }
  
  return (
<section className='fixed top-0 bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-3 py-3 sm:py-6 font-sans' style={modalAnimation.overlay}>
<div className='bg-white max-w-sm sm:max-w-md md:max-w-lg w-full p-4 rounded-lg shadow-xl' style={modalAnimation.content}>
    <div className='flex items-center justify-between border-b border-gray-100 pb-3 mb-4'>
        <h1 className='font-semibold text-base sm:text-lg tracking-wider text-gray-900'>
            Add New Category
        </h1>
        <button 
            onClick={close} 
            className='text-gray-400 hover:text-gray-800 transition-colors'
            aria-label="Close"
        >
            <IoClose size={20} className="sm:hidden" />
            <IoClose size={24} className="hidden sm:block" />
        </button>
    </div>
    <form className='grid gap-4' onSubmit={handleSubmit}>
        <div className='grid gap-1.5'>
            <label id='Category Name' className='font-medium text-gray-700 tracking-wider text-xs sm:text-sm'>Category Name</label>
            <input
                type='text'
                id='categoryName'
                placeholder='Enter category name'
                value={data.name}
                name='name'
                onChange={handleOnChange}
                className='bg-gray-50 p-2 sm:p-3 border border-gray-300 focus:border-black focus:bg-white focus:ring-1 focus:ring-black outline-none rounded-md transition-all shadow-sm tracking-wide text-xs sm:text-sm'
            />
        </div>
        
           <div className='grid gap-1.5'>
            <p className='font-medium text-gray-700 tracking-wider text-xs sm:text-sm'>
             Category Image
            </p>
            <div className='flex gap-3 sm:gap-4 flex-col sm:flex-row items-center'>
            <div className='border bg-gray-50 border-gray-300 h-40 sm:h-48 w-full sm:w-48 flex items-center justify-center rounded-md overflow-hidden shadow-sm'>
                {
                    data.image ? (
                        <img 
                        alt='category'
                        src={data.image} 
                        className="h-full w-full object-contain"
                         />
                    ) : (
                        <p className='text-xs sm:text-sm text-gray-500 tracking-wide'>No Image</p>
                    )
                }
            </div>
            <div className='w-full'>
                <label htmlFor='uploadCategoryImage' className='w-full'>
                <div className={`
                ${!data.name ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 cursor-pointer'}
                p-2 sm:p-3 rounded-md w-full border flex items-center justify-center transition-all font-medium tracking-wide text-xs sm:text-sm shadow-sm
                `}>
                    {loading ? (
                        <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Loading...
                        </span>
                    ) : "Upload Image"}
                </div>
                <input disabled={!data.name} onChange={handleUploadCategoryImage} type='file' id='uploadCategoryImage' className='hidden' />
                </label>
                <p className="text-xs text-gray-500 mt-1 tracking-wide">
                    {!data.name && "Enter category name first"}
                </p>
            </div>
            </div>
           </div>
           
       <button
       className={`
        ${!data.name || !data.image ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-black hover:bg-gray-800 text-white'}
        py-2.5 mt-2 rounded-md font-semibold tracking-wider text-sm sm:text-base transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-50
        `}
        >Add Category</button>
    </form>
 
  </div>
    </section>
  )
}

export default UploadCategoryModel
