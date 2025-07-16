import React, { useState } from 'react'
import UploadCategoryModel from '../components/UploadCategoryModel'
import SummaryApi from '../common/SummaryApi'
import { useEffect } from 'react'
import Loading from '../components/Loading'
import AnimatedImage from '../components/NoData'
import Axios from '../utils/Axios'
import EditCategory from '../components/EditCategory'
import ConfirmBox from '../components/ConfirmBox'
import toast from 'react-hot-toast'
import AxiosTostError from '../utils/AxiosTostError'
import { useSelector } from 'react-redux'

function CategoryPage() {
    const [openUploadCategory, setOpenUploadCategory] = useState(false)
    const [loading, setLoading] = useState(false)

    const [categoryData, setCategoryData] = useState([])
    const [openEdit,setOpenEdit] = useState(false)
    const [editData,setEditData] = useState({
        name : "",
        image : "",
    })
    const [openConfimBoxDelete,setOpenConfirmBoxDelete] = useState(false)
    const [deleteCategory,setDeleteCategory] = useState({
        _id : ""
    })
    
    const fetchCategory = async () => {
        try {
            setLoading(true)
            const response = await Axios({
                ...SummaryApi.getCategory
            })
            const { data: responseData } = response

            if (responseData.success) {
                setCategoryData(responseData.data)
            }
        } catch (error) {

        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCategory()
    }, [])
    const handleDeleteCategory = async()=>{
        try {
            const response = await Axios({
                ...SummaryApi.deleteCategory,
                data : deleteCategory
            })

            const { data : responseData } = response

            if(responseData.success){
                toast.success(responseData.message)
                if(responseData.success){
                
                    setOpenConfirmBoxDelete(false); 
                    fetchCategory(); 
                }
                
            }
        } catch (error) {
            AxiosTostError(error)
        }
    }
    return (
        <section className='min-h-[75vh] max-h-[75vh] overflow-y-auto bg-gray-50'>
            <div className='p-4 font-semibold bg-white shadow-md flex items-center justify-between sticky top-0 z-10 border-b border-gray-200'>
                <h2 className='font-bold text-xl text-gray-900 font-serif'>Categories</h2>
                <button onClick={() => setOpenUploadCategory(true)}
                    className='bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-md font-medium tracking-wide transition-colors'>
                    Add Category
                </button>
            </div>
            {
                !categoryData[0] && !loading && (
                    <AnimatedImage />
                )
            }

            <div className='p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4'>
                {
                    categoryData.map((category, index) => {
                        return (
                            <div className='w-40 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200' key={category._id}>
                                <div className='h-24 mb-3 bg-gray-50 rounded-md overflow-hidden border border-gray-100'>
                                    <img
                                        alt={category.name}
                                        src={category.image}
                                        className='w-full h-full object-scale-down'
                                    />
                                </div>
                                <h3 className='text-sm font-medium text-gray-900 text-center mb-3 truncate'>{category.name}</h3>
                                <div className='flex gap-2'>
                                    <button onClick={() => {
                                        setOpenEdit(true)
                                        setEditData(category)
                                    }} className='flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 font-medium py-2 rounded-md transition-colors border border-gray-300'>
                                        Edit
                                    </button>
                                    <button onClick={() => {
                                        setOpenConfirmBoxDelete(true)
                                        setDeleteCategory(category)
                                    }} className='flex-1 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 font-medium py-2 rounded-md transition-colors border border-red-300'>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })
                }
            </div>

            {
                loading && (
                    <div className='flex justify-center items-center h-64'>
                        <Loading />
                    </div>
                )
            }

            {
                openUploadCategory && (

                    <UploadCategoryModel fetchData={fetchCategory} close={() => setOpenUploadCategory(false)} />
                )
            }

            {
                openEdit && (
                    <EditCategory data={editData} close={() => setOpenEdit(false)} fetchData={fetchCategory} />
                )
            }

            {
                openConfimBoxDelete && (
                    <ConfirmBox close={() => setOpenConfirmBoxDelete(false)} cancel={() => setOpenConfirmBoxDelete(false)} confirm={handleDeleteCategory} />
                )
            }

        </section>
    )
}

export default CategoryPage
