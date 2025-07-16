import React, { useState } from 'react'
import { IoClose } from 'react-icons/io5'
import uploadImage from '../utils/UploadImage'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import AxiosTostError from '../utils/AxiosTostError'
import toast from 'react-hot-toast'

function UploadCategoryModel   ({close,fetchData})  {
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
       
        const response = await uploadImage(file) 
        const { data : ImageResponse}  = response 
        setData((preve)=>{
            return{
                ...preve,
                image:ImageResponse.data.url
            }
        })
 
    }
  
  return (
<section className='fixed top-0 bottom-0 left-0 right-0 bg-black/20 bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50'>
<div className='bg-white max-w-4xl w-full p-4 rounded'>
    <div className='flex items-center justify-between'>
        <h1 className='font-semibold text-lg'>
            Category
        </h1>
        <button onClick={close}>
                    <IoClose size={25} />
        </button>
    </div>
    <form className='my-3 grid gap-4 'onSubmit={handleSubmit}>
        <div className='grid gap-1'>
            <label id ='Category Name' className='block text-sm font-semibold'>Category Name</label>
            <input
                        type='text'
                        id='categoryName'
                        placeholder='Enter category name'
                        value={data.name}
                        name='name'
                        onChange={handleOnChange}
                        className='bg-gray-50 p-3 border border-gray-300 focus:border-black focus:bg-white outline-none rounded-md transition-colors'
            />
        </div>
        
           <div className='grid gap-1'>
            <p>
             Image
            </p>
            <div className='flex gap-4 flex-col  lg:flex-row items-center'>
            <div className='border bg-gray-50 border-gray-300 h-52 w-full lg:w-52 flex items-center justify-center rounded-md'>
                {
                    data.image ? (
                        <img 
                        alt='category'
                        src={data.image} 
                    
                        className="h-full w-full object-scale-down"
                         />
                    ) : (
                        <p className='text-sm text-neutral-500'>No Image</p>
                    )
                }

            </div>
            <label htmlFor='uploadCategoryImage' className='flex items-center gap-2'>
            <div  className={`
            ${!data.name ? 'bg-gray-300' : 'border-gray-300 hover:bg-gray-100'}
            p-3 rounded-md text-gray-700 w-full lg:w-52 border  font-medium transition-colors cursor-pointer
            `}
            >Upload Image</div>
            <input disabled={!data.name} onChange={handleUploadCategoryImage} type='file' id='uploadCategoryImage' hidden/>
            {/* <input disabled={!data.name} onChange={handleUploadCategoryImage} type='file' id='uploadCategoryImage' className='hidden'/> */}
            </label>
            </div>
           </div>
       <button
       className={`
        ${!data.name && data.image ? 'bg-gray-300  hover:bg-blue-100' : 'bg-black hover:bg-gray-800 text-white'}
        py-3
        font-semibold
        rounded-md tracking-wide transition-colors
        `}
        >Add category</button>
    </form>
 
  </div>
    </section>
  )
}

export default UploadCategoryModel
