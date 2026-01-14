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
import SizeInventoryManager from './SizeInventoryManager';

const EditProductAdmin = ({ close, data: propsData, fetchProductData }) => {
  const [data, setData] = useState({
    _id: propsData._id,
    name: propsData.name,
    image: propsData.image,
    gender: propsData.gender || [],
    category: propsData.category,
    stock: propsData.stock,
    price: propsData.price,
    discount: propsData.discount,
    description: propsData.description,
    more_details: propsData.more_details || {},
    // Size-specific inventory
    sizes: propsData.sizes || {
      XS: 0,
      S: 0,
      M: 0,
      L: 0,
      XL: 0
    },
    availableSizes: propsData.availableSizes || []
  })
  const [imageLoading, setImageLoading] = useState(false)
  const [ViewImageURL, setViewImageURL] = useState("")
  const allCategory = useSelector(state => state.product.allCategory)
  const [selectCategory, setSelectCategory] = useState("")
  const [selectGender, setSelectGender] = useState("")
  const [openAddField, setOpenAddField] = useState(false)
  const [fieldName, setFieldName] = useState("")

  const genderOptions = [
    { value: "Men", label: "Men" },
    { value: "Women", label: "Women" },
    { value: "Kids", label: "Kids" },
    { value: "Unisex", label: "Unisex" }
  ];

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

  const handleRemoveGender = async (index) => {
    data.gender.splice(index, 1)
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
    console.log("Submitting product data:", data)

    try {
      // Calculate available sizes based on inventory before submission
      const calculatedAvailableSizes = Object.entries(data.sizes)
        .filter(([_, quantity]) => Number(quantity) > 0)
        .map(([size]) => size);
      
      // Transform gender array to just values for backend
      const submitData = {
        ...data,
        availableSizes: calculatedAvailableSizes,
        gender: data.gender.map(g => g.value || g)
      };

      const response = await Axios({
        ...SummaryApi.updateProductDetails,
        data: submitData
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
          gender: [],
          category: [],
          stock: "",
          price: "",
          discount: "",
          description: "",
          more_details: {},
          sizes: {
            XS: 0,
            S: 0,
            M: 0,
            L: 0,
            XL: 0
          },
          availableSizes: []
        })
      }
    } catch (error) {
      AxiosTostError(error)
    }
  }

  // Add the styles to the document
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
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
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // Normalize gender data when component loads
  useEffect(() => {
    if (propsData.gender) {
      let normalizedGender = [];
      
      if (Array.isArray(propsData.gender)) {
        // If it's already an array, check if items are strings or objects
        normalizedGender = propsData.gender.map(g => {
          if (typeof g === 'string') {
            return genderOptions.find(option => option.value === g) || { value: g, label: g };
          }
          return g;
        });
      } else if (typeof propsData.gender === 'string') {
        // If it's a string, convert to array of objects
        const genderOption = genderOptions.find(option => option.value === propsData.gender);
        normalizedGender = genderOption ? [genderOption] : [{ value: propsData.gender, label: propsData.gender }];
      }
      
      setData(prev => ({
        ...prev,
        gender: normalizedGender
      }));
    }
  }, [propsData.gender]);
  
  return (
    <section className='fixed top-0 right-0 left-0 bottom-0 bg-black/70 backdrop-blur-sm z-50 p-2 sm:p-4 font-sans' style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className='bg-white w-full p-3 sm:p-4 max-w-2xl mx-auto rounded-lg shadow-xl overflow-y-auto h-full max-h-[95vh] border border-gray-100' style={{ animation: 'slideIn 0.3s ease-out' }}>
        <section>
          <div className='p-2 sm:p-3 bg-white shadow-sm border-b border-gray-100 flex items-center justify-between mb-2'>
            <h2 className='font-semibold tracking-wide text-base sm:text-lg'>Edit Product</h2>
            <button 
              onClick={close} 
              className='text-gray-500 hover:text-gray-800 transition-colors'
              aria-label="Close"
            >
              <IoClose size={20} />
            </button>
          </div>
          <div className='grid p-2 sm:p-3'>
            <form className='grid gap-3 sm:gap-4' onSubmit={handleSubmit}>
              <div className='grid gap-1.5'>
                <label htmlFor='name' className='font-medium text-gray-700 tracking-wider text-xs sm:text-sm'>Name</label>
                <input
                  id='name'
                  type='text'
                  placeholder='Enter product name'
                  name='name'
                  value={data.name}
                  onChange={handleChange}
                  required
                  className='bg-gray-50 p-2 sm:p-3 border border-gray-300 focus:border-black focus:bg-white focus:ring-1 focus:ring-black outline-none rounded-md transition-all shadow-sm tracking-wide text-xs sm:text-sm'
                />
              </div>
              <div className='grid gap-1.5'>
                <label htmlFor='description' className='font-medium text-gray-700 tracking-wider text-xs sm:text-sm'>Description</label>
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
                  className='bg-gray-50 p-2 sm:p-3 border border-gray-300 focus:border-black focus:bg-white focus:ring-1 focus:ring-black outline-none rounded-md transition-all shadow-sm tracking-wide text-xs sm:text-sm resize-none'
                />
              </div>
              <div className='grid gap-1.5'>
                <p className='font-medium text-gray-700 tracking-wider text-xs sm:text-sm'>Image</p>
                <div>
                  <label htmlFor='productImage' className='bg-gray-50 h-24 sm:h-32 border border-gray-300 rounded-md flex items-center justify-center cursor-pointer shadow-sm hover:bg-gray-100 transition-all'>
                    <div className='text-center flex justify-center items-center flex-col'>
                      {
                        imageLoading ? (
                          <Loading />
                        ) : (
                          <>
                            <FaCloudUploadAlt size={25} className="text-gray-700 mb-1" />
                            <p className="text-xs sm:text-sm tracking-wide text-gray-600">Upload Product Image</p>
                          </>
                        )
                      }
                    </div>
                    <input type='file' id='productImage' className='hidden' onChange={handleUploadImage} />
                  </label>

                  <div className='flex flex-wrap gap-2 sm:gap-4 mt-2'>
                    {
                      data.image.map((img, index) => {
                        return (
                          <div key={img + index} className='h-16 sm:h-20 w-16 sm:w-20 min-w-16 sm:min-w-20 bg-gray-50 border border-gray-300 relative group rounded-md overflow-hidden shadow-sm'>
                            <img
                              src={img}
                              alt={img}
                              className='w-full h-full object-scale-down cursor-pointer'
                              onClick={() => setViewImageURL(img)}
                            />
                            <div onClick={() => handleDeleteImage(index)} className='absolute bottom-0 right-0 p-1 bg-red-600 hover:bg-red-600 rounded text-white hidden group-hover:block cursor-pointer'>
                              <MdDelete size={16} />
                            </div>
                          </div>
                        )
                      })
                    }
                  </div>
                </div>
              </div>
              
              <div className='grid gap-1.5'>
                <label className='font-medium text-gray-700 tracking-wider text-xs sm:text-sm'>Category</label>
                <div>
                  <select
                    className='bg-gray-50 border border-gray-300 w-full p-2 sm:p-3 rounded-md focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all shadow-sm outline-none tracking-wide text-xs sm:text-sm'
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
                  <div className='flex flex-wrap gap-2 sm:gap-3 mt-2'>
                    {
                      data.category.map((c, index) => {
                        return (
                          <div key={c._id + index + "productsection"} className='text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 bg-gray-100 border border-gray-300 mt-1.5 p-1.5 sm:p-2 rounded-md tracking-wide shadow-sm'>
                            <p>{c.name}</p>
                            <div className='hover:text-red-500 cursor-pointer transition-colors' onClick={() => handleRemoveCategory(index)}>
                              <IoClose size={16} />
                            </div>
                          </div>
                        )
                      })
                    }
                  </div>
                </div>
              </div>

              <div className='grid gap-1.5'>
                <label className='font-medium text-gray-700 tracking-wider text-xs sm:text-sm'>Gender</label>
                <div>
                  <select
                    className='bg-gray-50 border border-gray-300 w-full p-2 sm:p-3 rounded-md focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all shadow-sm outline-none tracking-wide text-xs sm:text-sm'
                    value={selectGender}
                    onChange={(e) => {
                      const value = e.target.value
                      const genderOption = genderOptions.find(option => option.value === value)
                      
                      // Check if gender is already selected
                      const isAlreadySelected = data.gender.some(g => g.value === value || g === value)
                      
                      if (!isAlreadySelected && genderOption) {
                        setData((preve) => {
                          return {
                            ...preve,
                            gender: [...preve.gender, genderOption],
                          }
                        })
                      }
                      setSelectGender("")
                    }}
                  >
                    <option value={""}>Select Gender</option>
                    {
                      genderOptions.map((option, index) => {
                        return (
                          <option key={option.value + index} value={option.value}>{option.label}</option>
                        )
                      })
                    }
                  </select>
                  <div className='flex flex-wrap gap-2 sm:gap-3 mt-2'>
                    {
                      data.gender.map((g, index) => {
                        return (
                          <div key={(g.value || g) + index + "gendersection"} className='text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 bg-gray-100 border border-gray-300 mt-1.5 p-1.5 sm:p-2 rounded-md tracking-wide shadow-sm'>
                            <p>{g.label || g}</p>
                            <div className='hover:text-red-500 cursor-pointer transition-colors' onClick={() => handleRemoveGender(index)}>
                              <IoClose size={16} />
                            </div>
                          </div>
                        )
                      })
                    }
                  </div>
                </div>
              </div>

              <div className='grid gap-1.5'>
                <label className='font-medium text-gray-700 tracking-wider text-xs sm:text-sm'>Size-Specific Inventory</label>
                <div className="bg-gray-50 p-3 border border-gray-300 rounded-md shadow-sm">
                  <SizeInventoryManager 
                    value={data.sizes} 
                    onChange={({ sizes, availableSizes, totalStock }) => {
                      setData(prev => ({
                        ...prev,
                        sizes,
                        availableSizes,
                        stock: totalStock // Update legacy stock field for backward compatibility
                      }));
                    }} 
                  />
                </div>
              </div>
              
              <div className='grid gap-1.5'>
                <label htmlFor='stock' className='font-medium text-gray-700 tracking-wider text-xs sm:text-sm'>Total Stock (Auto-calculated)</label>
                <input
                  id='stock'
                  type='number'
                  placeholder='Total stock is calculated automatically'
                  name='stock'
                  value={data.stock}
                  readOnly
                  disabled
                  className='bg-gray-100 p-2 sm:p-3 border border-gray-300 outline-none rounded-md shadow-sm tracking-wide text-xs sm:text-sm'
                />
              </div>

              <div className='grid sm:grid-cols-2 gap-3 sm:gap-4'>
                <div className='grid gap-1.5'>
                  <label htmlFor='price' className='font-medium text-gray-700 tracking-wider text-xs sm:text-sm'>Price</label>
                  <input
                    id='price'
                    type='number'
                    placeholder='Enter product price'
                    name='price'
                    value={data.price}
                    onChange={handleChange}
                    required
                    className='bg-gray-50 p-2 sm:p-3 border border-gray-300 focus:border-black focus:bg-white focus:ring-1 focus:ring-black outline-none rounded-md transition-all shadow-sm tracking-wide text-xs sm:text-sm'
                  />
                </div>

                <div className='grid gap-1.5'>
                  <label htmlFor='discount' className='font-medium text-gray-700 tracking-wider text-xs sm:text-sm'>Discount</label>
                  <input
                    id='discount'
                    type='number'
                    placeholder='Enter product discount'
                    name='discount'
                    value={data.discount}
                    onChange={handleChange}
                    required
                    className='bg-gray-50 p-2 sm:p-3 border border-gray-300 focus:border-black focus:bg-white focus:ring-1 focus:ring-black outline-none rounded-md transition-all shadow-sm tracking-wide text-xs sm:text-sm'
                  />
                </div>
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

              <div onClick={() => setOpenAddField(true)} className='hover:bg-gray-100 bg-white py-2 px-4 w-28 sm:w-32 text-center font-medium border border-gray-300 hover:text-black cursor-pointer rounded-md transition-all shadow-sm text-xs sm:text-sm tracking-wide'>
                Add Fields
              </div>

              <button
                className='bg-black hover:bg-gray-800 text-white py-2.5 sm:py-3 rounded-md font-semibold tracking-wider text-sm transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-50 mt-2'
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

