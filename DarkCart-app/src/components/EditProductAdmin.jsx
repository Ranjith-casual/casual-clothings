import React, { useState } from 'react'
import { FaCloudUploadAlt } from "react-icons/fa";
import uploadImage from '../utils/UploadImage';
import Loading from '../components/Loading';
import ViewImage from '../components/ViewImage';
import { MdDelete } from "react-icons/md";
import { useSelector } from 'react-redux'
import { IoClose } from "react-icons/io5";
import AddFieldComponent from '../components/AddFieldComponent';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi.js';
import AxiosTostError from '../utils/AxiosTostError';
import successAlert from '../utils/SuccessAlert';
import { useEffect } from 'react';

const EditProductAdmin = ({ close, data: propsData, fetchProductData }) => {
  const [data, setData] = useState({
    _id: propsData._id,
    name: propsData.name,
    image: propsData.image,
    category: propsData.category,
    stock: propsData.stock,
    price: propsData.price,
    discount: propsData.discount,
    description: propsData.description,
    more_details: propsData.more_details || {},
  })
  const [imageLoading, setImageLoading] = useState(false)
  const [ViewImageURL, setViewImageURL] = useState("")
  const allCategory = useSelector(state => state.product.allCategory)
  const [selectCategory, setSelectCategory] = useState("")
  const [openAddField, setOpenAddField] = useState(false)
  const [fieldName, setFieldName] = useState("")

  const handleChange = (e) => {
    const { name, value } = e.target
    setData((preve) => {
      return {
        ...preve,
        [name]: value
      }
    })
  }

  const handleUploadImage = async (e) => {
    const file = e.target.files[0]
    if (!file) {
      return
    }
    setImageLoading(true)
    const response = await uploadImage(file)
    const { data: ImageResponse } = response
    const imageUrl = ImageResponse.data.url

    setData((preve) => {
      return {
        ...preve,
        image: [...preve.image, imageUrl]
      }
    })
    setImageLoading(false)
  }

  const handleDeleteImage = async (index) => {
    data.image.splice(index, 1)
    setData((preve) => {
      return {
        ...preve
      }
    })
  }

  const handleRemoveCategory = async (index) => {
    data.category.splice(index, 1)
    setData((preve) => {
      return {
        ...preve
      }
    })
  }

  const handleAddField = () => {
    setData((preve) => {
      return {
        ...preve,
        more_details: {
          ...preve.more_details,
          [fieldName]: ""
        }
      }
    })
    setFieldName("")
    setOpenAddField(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log("data", data)

    try {
      const response = await Axios({
        ...SummaryApi.updateProductDetails,
        data: data
      })
      const { data: responseData } = response

      if (responseData.success) {
        successAlert(responseData.message)
        if (close) {
          close()
        }
        fetchProductData()
        setData({
          name: "",
          image: [],
          category: [],
          stock: "",
          price: "",
          discount: "",
          description: "",
          more_details: {},
        })
      }
    } catch (error) {
      AxiosTostError(error)
    }
  }

  return (
    <section className='fixed top-0 right-0 left-0 bottom-0 bg-black z-50 bg-opacity-80 p-4'>
      <div className='bg-white w-full p-4 max-w-2xl mx-auto rounded overflow-y-auto h-full max-h-[95vh]'>
        <section className=''>
          <div className='p-2 bg-white shadow-md flex items-center justify-between'>
            <h2 className='font-semibold'>Edit Product</h2>
            <button onClick={close}>
              <IoClose size={20} />
            </button>
          </div>
          <div className='grid p-3'>
            <form className='grid gap-4' onSubmit={handleSubmit}>
              <div className='grid gap-1'>
                <label htmlFor='name' className='font-medium'>Name</label>
                <input
                  id='name'
                  type='text'
                  placeholder='Enter product name'
                  name='name'
                  value={data.name}
                  onChange={handleChange}
                  required
                  className='bg-gray-50 p-3 outline-none border border-gray-300 focus:border-black focus:bg-white rounded-md transition-colors'
                />
              </div>
              <div className='grid gap-1'>
                <label htmlFor='description' className='font-medium'>Description</label>
                <textarea
                  id='description'
                  type='text'
                  placeholder='Enter product description'
                  name='description'
                  value={data.description}
                  onChange={handleChange}
                  required
                  multiple
                  rows={3}
                  className='bg-gray-50 p-3 outline-none border border-gray-300 focus:border-black focus:bg-white rounded-md transition-colors resize-none'
                />
              </div>
              <div className='grid gap-1'>
                <p className='font-medium'>Image</p>
                <div>
                  <label htmlFor='productImage' className='bg-gray-50 h-32 border border-gray-300 rounded-md flex items-center justify-center cursor-pointer'>
                    <div className='text-center flex justify-center items-center flex-col'>
                      {
                        imageLoading ? (
                          <Loading />
                        ) : (
                          <>
                            <FaCloudUploadAlt size={35} />
                            <p>Upload Product Image</p>
                          </>
                        )
                      }
                    </div>
                    <input type='file' id='productImage' className='hidden' onChange={handleUploadImage} />
                  </label>

                  <div className='flex flex-wrap gap-4'>
                    {
                      data.image.map((img, index) => {
                        return (
                          <div key={img + index} className='h-20 mt-1 w-20 min-w-20 bg-gray-50 border border-gray-300 relative group rounded-md overflow-hidden'>
                            <img
                              src={img}
                              alt={img}
                              className='w-full h-full object-scale-down cursor-pointer'
                              onClick={() => setViewImageURL(img)}
                            />
                            <div onClick={() => handleDeleteImage(index)} className='absolute bottom-0 right-0 p-1 bg-red-600 hover:bg-red-600 rounded text-white hidden group-hover:block cursor-pointer'>
                              <MdDelete />
                            </div>
                          </div>
                        )
                      })
                    }
                  </div>
                </div>
              </div>
              
              <div className='grid gap-1'>
                <label className='font-medium'>Category</label>
                <div>
                  <select
                    className='bg-gray-50 border border-gray-300 w-full p-3 rounded-md focus:border-black focus:bg-white transition-colors'
                    value={selectCategory}
                    onChange={(e) => {
                      const value = e.target.value
                      const category = allCategory.find(el => el._id === value)

                      setData((preve) => {
                        return {
                          ...preve,
                          category: [...preve.category, category],
                        }
                      })
                      setSelectCategory("")
                    }}
                  >
                    <option value={""}>Select Category</option>
                    {
                      allCategory.map((c, index) => {
                        return (
                          <option key={c._id} value={c?._id}>{c.name}</option>
                        )
                      })
                    }
                  </select>
                  <div className='flex flex-wrap gap-3'>
                    {
                      data.category.map((c, index) => {
                        return (
                          <div key={c._id + index + "productsection"} className='text-sm flex items-center gap-2 bg-gray-100 border border-gray-300 mt-2 p-2 rounded-md'>
                            <p>{c.name}</p>
                            <div className='hover:text-red-500 cursor-pointer' onClick={() => handleRemoveCategory(index)}>
                              <IoClose size={20} />
                            </div>
                          </div>
                        )
                      })
                    }
                  </div>
                </div>
              </div>

              <div className='grid gap-1'>
                <label htmlFor='stock' className='font-medium'>Number of Stock</label>
                <input
                  id='stock'
                  type='number'
                  placeholder='Enter product stock'
                  name='stock'
                  value={data.stock}
                  onChange={handleChange}
                  required
                  className='bg-gray-50 p-3 outline-none border border-gray-300 focus:border-black focus:bg-white rounded-md transition-colors'
                />
              </div>

              <div className='grid gap-1'>
                <label htmlFor='price' className='font-medium'>Price</label>
                <input
                  id='price'
                  type='number'
                  placeholder='Enter product price'
                  name='price'
                  value={data.price}
                  onChange={handleChange}
                  required
                  className='bg-gray-50 p-3 outline-none border border-gray-300 focus:border-black focus:bg-white rounded-md transition-colors'
                />
              </div>

              <div className='grid gap-1'>
                <label htmlFor='discount' className='font-medium'>Discount</label>
                <input
                  id='discount'
                  type='number'
                  placeholder='Enter product discount'
                  name='discount'
                  value={data.discount}
                  onChange={handleChange}
                  required
                  className='bg-gray-50 p-3 outline-none border border-gray-300 focus:border-black focus:bg-white rounded-md transition-colors'
                />
              </div>

              {/**add more field**/}
              {
                Object?.keys(data?.more_details)?.map((k, index) => {
                  return (
                    <div key={k + index} className='grid gap-1'>
                      <label htmlFor={k} className='font-medium'>{k}</label>
                      <input
                        id={k}
                        type='text'
                        value={data?.more_details[k]}
                        onChange={(e) => {
                          const value = e.target.value
                          setData((preve) => {
                            return {
                              ...preve,
                              more_details: {
                                ...preve.more_details,
                                [k]: value
                              }
                            }
                          })
                        }}
                        required
                        className='bg-gray-50 p-3 outline-none border border-gray-300 focus:border-black focus:bg-white rounded-md transition-colors'
                      />
                    </div>
                  )
                })
              }

              <div onClick={() => setOpenAddField(true)} className='hover:bg-gray-100 bg-white py-2 px-4 w-32 text-center font-semibold border border-gray-300 hover:text-black cursor-pointer rounded-md transition-colors'>
                Add Fields
              </div>

              <button
                className='bg-black hover:bg-gray-800 text-white py-3 rounded-md font-semibold tracking-wide transition-colors'
              >
                Update Product
              </button>
            </form>
          </div>

          {
            ViewImageURL && (
              <ViewImage url={ViewImageURL} close={() => setViewImageURL("")} />
            )
          }

          {
            openAddField && (
              <AddFieldComponent
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                submit={handleAddField}
                close={() => setOpenAddField(false)}
              />
            )
          }
        </section>
      </div>
    </section>
  )
}

export default EditProductAdmin

