import React, { useState } from 'react'
import EditProductAdmin from './EditProductAdmin'
import ConfirmBox from "../components/ConfirmBox";
import { IoClose } from 'react-icons/io5'
import { FaBoxes } from 'react-icons/fa'
import SummaryApi from '../common/SummaryApi.js'
import Axios from '../utils/Axios'
import AxiosTostError from '../utils/AxiosTostError'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const ProductCardAdmin = ({ data, fetchProductData }) => {
  // Add animation styles
  React.useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes scaleIn {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);
  
  const navigate = useNavigate();
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
    <div className='w-32 sm:w-36 p-3 sm:p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all font-sans' style={{ animation: 'scaleIn 0.4s ease-out' }}>
        <div className='mb-2 sm:mb-3 h-20 sm:h-24 bg-gray-50 rounded-md overflow-hidden border border-gray-100'>
            <img
               src={data?.image[0]}  
               alt={data?.name}
               className='w-full h-full object-scale-down'
            />
        </div>
        <p className='text-ellipsis line-clamp-2 font-medium text-gray-900 text-xs sm:text-sm mb-0.5 sm:mb-1 tracking-wide'>{data?.name}</p>
        <p className='text-gray-500 text-[10px] sm:text-xs mb-2 sm:mb-3 tracking-wide'>{data?.unit}</p>
        <div className='grid grid-cols-2 gap-1.5 sm:gap-2'>
          <button 
            onClick={()=>setEditOpen(true)} 
            className='border px-1.5 sm:px-2 py-1.5 sm:py-2 text-[10px] sm:text-xs border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 rounded-md transition-all font-medium tracking-wide shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50'
          >
            Edit
          </button>
          <button 
            onClick={()=>setOpenDelete(true)} 
            className='border px-1.5 sm:px-2 py-1.5 sm:py-2 text-[10px] sm:text-xs border-red-300 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-md transition-all font-medium tracking-wide shadow-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-opacity-50'
          >
            Delete
          </button>
        </div>
        
        <button 
          onClick={() => {
            console.log("Navigating to inventory management for product ID:", data._id);
            navigate(`/dashboard/inventory-management/${data._id}`);
          }}
          className='mt-2 w-full flex items-center justify-center gap-1 border px-1.5 sm:px-2 py-1.5 sm:py-2 text-[10px] sm:text-xs border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-md transition-all font-medium tracking-wide shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50'
        >
          <FaBoxes className="inline-block" /> Manage Inventory
        </button>

        {
          editOpen && (
            <EditProductAdmin fetchProductData={fetchProductData} data={data} close={()=>setEditOpen(false)}/>
          )
        }

        {
          openDelete && (
            <section className='fixed top-0 left-0 right-0 bottom-0 bg-black/70 backdrop-blur-sm z-50 p-3 sm:p-4 flex justify-center items-center font-sans' style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div className='bg-white p-4 sm:p-6 w-full max-w-md rounded-lg shadow-xl border border-gray-100' style={{ animation: 'scaleIn 0.4s ease-out' }}>
                    <div className='flex items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4'>
                        <h3 className='font-bold text-base sm:text-lg text-gray-900 tracking-wide'>Confirm Deletion</h3>
                        <button 
                          onClick={()=>setOpenDelete(false)}
                          className='text-gray-400 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100'
                          aria-label="Close"
                        >
                          <IoClose size={20} className="sm:hidden" />
                          <IoClose size={24} className="hidden sm:block" />
                        </button>
                    </div>
                    <p className='text-gray-600 mb-4 sm:mb-6 leading-relaxed text-xs sm:text-sm tracking-wide'>Are you sure you want to permanently delete this product? This action cannot be undone.</p>
                    <div className='flex justify-end gap-2 sm:gap-3'>
                      <button 
                        onClick={handleDeleteCancel} 
                        className='border border-gray-300 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all font-medium text-xs sm:text-sm tracking-wide shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-opacity-50'
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleDelete} 
                        className='border border-red-300 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-black text-white hover:bg-gray-800 transition-all font-semibold text-xs sm:text-sm tracking-wider shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-50'
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