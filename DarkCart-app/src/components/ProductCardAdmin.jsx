import React, { useState } from 'react'
import EditProductAdmin from './EditProductAdmin'
import ConfirmBox from "../components/ConfirmBox";
import { IoClose } from 'react-icons/io5'
import SummaryApi from '../common/SummaryApi.js'
import Axios from '../utils/Axios'
import AxiosTostError from '../utils/AxiosTostError'
import toast from 'react-hot-toast'

const ProductCardAdmin = ({ data, fetchProductData }) => {
  const [editOpen,setEditOpen]= useState(false)
  const [openDelete,setOpenDelete] = useState(false)

  const handleDeleteCancel  = ()=>{
      setOpenDelete(false)
  }

  const handleDelete = async()=>{
    try {
      const response = await Axios({
        ...SummaryApi.deleteProduct,
        data : {
          _id : data._id
        }
      })

      const { data : responseData } = response

      if(responseData.success){
          toast.success(responseData.message)
          if(fetchProductData){
            fetchProductData()
          }
          setOpenDelete(false)
      }
    } catch (error) {
      AxiosTostError(error)
    }
  }
  return (
    <div className='w-36 p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow'>
        <div className='mb-3 h-24 bg-gray-50 rounded-md overflow-hidden border border-gray-100'>
            <img
               src={data?.image[0]}  
               alt={data?.name}
               className='w-full h-full object-scale-down'
            />
        </div>
        <p className='text-ellipsis line-clamp-2 font-medium text-gray-900 text-sm mb-1'>{data?.name}</p>
        <p className='text-gray-500 text-xs mb-3'>{data?.unit}</p>
        <div className='grid grid-cols-2 gap-2'>
          <button 
            onClick={()=>setEditOpen(true)} 
            className='border px-2 py-2 text-xs border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 rounded-md transition-colors font-medium'
          >
            Edit
          </button>
          <button 
            onClick={()=>setOpenDelete(true)} 
            className='border px-2 py-2 text-xs border-red-300 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-md transition-colors font-medium'
          >
            Delete
          </button>
        </div>

        {
          editOpen && (
            <EditProductAdmin fetchProductData={fetchProductData} data={data} close={()=>setEditOpen(false)}/>
          )
        }

        {
          openDelete && (
            <section className='fixed top-0 left-0 right-0 bottom-0 bg-black/70 backdrop-blur-sm z-50 p-4 flex justify-center items-center'>
                <div className='bg-white p-6 w-full max-w-md rounded-lg shadow-xl border border-gray-100'>
                    <div className='flex items-center justify-between gap-4 mb-4'>
                        <h3 className='font-bold text-lg text-gray-900 font-serif'>Confirm Deletion</h3>
                        <button 
                          onClick={()=>setOpenDelete(false)}
                          className='text-gray-400 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100'
                        >
                          <IoClose size={24}/>
                        </button>
                    </div>
                    <p className='text-gray-600 mb-6 leading-relaxed'>Are you sure you want to permanently delete this product? This action cannot be undone.</p>
                    <div className='flex justify-end gap-3'>
                      <button 
                        onClick={handleDeleteCancel} 
                        className='border border-gray-300 px-4 py-2 rounded-md bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors font-medium'
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleDelete} 
                        className='border border-red-300 px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800 transition-colors font-medium'
                      >
                        Delete
                      </button>
                    </div>
                </div>
            </section>
          )
        }
    </div>
  )
}

export default ProductCardAdmin