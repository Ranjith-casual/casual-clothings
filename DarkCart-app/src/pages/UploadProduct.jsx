import React, { useState, useEffect } from 'react'
import { FaCloudUploadAlt } from "react-icons/fa";
import uploadImage from '../utils/UploadImage';
import Loading from '../components/Loading';
import ViewImage from '../components/ViewImage';
import { IoClose } from 'react-icons/io5';
import { useSelector } from 'react-redux'
import AddFieldComponent from '../components/AddFieldComponent';
import SizeInventoryManager from '../components/SizeInventoryManager';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi.js';
import AxiosTostError from '../utils/AxiosTostError';
import toast from 'react-hot-toast';

function UploadProduct() {
  const [data, setData] = useState({
    name: "",
    image: [],
    gender: [],
    category: [],
    stock: "",
    price: "",
    discount: "",
    description: "",
    more_details: {},
    washCare: "",
    packageContains: "",
    sizeModel: "",
    fabric: "",
    marketedBy: "",
    importedBy: "",
    countryOfOrigin: "",
    customerCareAddress: "",
    // Add size-specific inventory fields
    sizes: {
      XS: 0,
      S: 0,
      M: 0,
      L: 0,
      XL: 0
    },
    availableSizes: []
  });
  const [ViewImageURL, setViewImageURL] = useState("");
  const [selectCategory, setSelectCategory] = useState("");
  const [selectGender, setSelectGender] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const allCategory = useSelector(state => state.product.allCategory);
  const [openAddField, setOpenAddField] = useState(false);
  const [fieldName, setFieldName] = useState("");

  const genderOptions = [
    { value: "Men", label: "Men" },
    { value: "Women", label: "Women" },
    { value: "Kids", label: "Kids" },
    { value: "Unisex", label: "Unisex" }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageLoading(true);
    const response = await uploadImage(file);
    const { data: ImageResponse } = response;
    setData(prev => ({
      ...prev,
      image: [...prev.image, ImageResponse.data.url]
    }));
    setImageLoading(false);
  };

  const handleDeleteImage = async (index) => {
    data.image.splice(index, 1);
    setData(prev => ({ ...prev }));
  };

  const handleRemoveCategory = async (index) => {
    data.category.splice(index, 1);
    setData(prev => ({ ...prev }));
  };

  const handleRemoveGender = async (index) => {
    data.gender.splice(index, 1);
    setData(prev => ({ ...prev }));
  };

  const handleAddField = () => {
    setData(prev => ({
      ...prev,
      more_details: {
        ...prev.more_details,
        [fieldName]: ""
      }
    }));
    setFieldName("");
    setOpenAddField(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Transform gender array to just values for backend
      const submitData = {
        ...data,
        gender: data.gender.map(g => g.value)
      };

      const response = await Axios({
        ...SummaryApi.createProduct,
        data: submitData
      });

      const { data: responseData } = response;

      if (responseData.success) {
        toast.success(responseData.message);
        // Reset form
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
          washCare: "",
          packageContains: "",
          sizeModel: "",
          fabric: "",
          marketedBy: "",
          importedBy: "",
          countryOfOrigin: "",
          customerCareAddress: "",
          // Reset size inventory
          sizes: {
            XS: 0,
            S: 0,
            M: 0,
            L: 0,
            XL: 0
          },
          availableSizes: []
        });
      }
    } catch (error) {
      AxiosTostError(error);
    }
  };

  return (
    <section className='bg-white'>
      <div className='container mx-auto p-4'>
        <form className='grid p-4' onSubmit={handleSubmit}>
          <div className='grid gap-2'>
            <label htmlFor='name' className='font-medium'>Name</label>
            <input
              id='name'
              type='text'
              placeholder='Enter product name'
              name='name'
              value={data.name}
              onChange={handleChange}
              required
              className='bg-gray-50 border border-gray-300 p-2 rounded focus:outline-none focus:border-primary-200'
            />
          </div>

          <div className='grid gap-2'>
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
              className='bg-gray-50 border border-gray-300 p-2 rounded focus:outline-none focus:border-primary-200 resize-none'
            />
          </div>

          <div className='grid gap-2'>
            <p className='font-medium'>Image</p>
            <div>
              <label htmlFor='productImage' className='bg-gray-50 h-32 border border-gray-300 rounded flex items-center justify-center cursor-pointer'>
                <div className='text-center flex justify-center items-center flex-col'>
                  {imageLoading ? (
                    <Loading />
                  ) : (
                    <>
                      <FaCloudUploadAlt size={35} />
                      <p>Upload Product Image</p>
                    </>
                  )}
                </div>
                <input type='file' id='productImage' className='hidden' onChange={handleUploadImage} />
              </label>

              <div className='flex flex-wrap gap-4'>
                {data.image.map((img, index) => (
                  <div key={img + index} className='h-20 mt-1 w-20 min-w-20 bg-gray-50 border relative group'>
                    <img
                      src={img}
                      alt={img}
                      className='w-full h-full object-scale-down cursor-pointer'
                      onClick={() => setViewImageURL(img)}
                    />
                    <div
                      onClick={() => handleDeleteImage(index)}
                      className='absolute bottom-0 right-0 p-1 bg-red-600 hover:bg-red-600 rounded text-white hidden group-hover:block cursor-pointer'
                    >
                      <IoClose />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className='grid gap-2'>
            <label className='font-medium'>Gender</label>
            <div>
              <select
                className='bg-gray-50 border border-gray-300 w-full p-2 rounded focus:outline-none focus:border-primary-200'
                value={selectGender}
                onChange={(e) => {
                  const value = e.target.value;
                  const genderOption = genderOptions.find(option => option.value === value);
                  
                  // Check if gender is already selected
                  const isAlreadySelected = data.gender.some(g => g.value === value);
                  
                  if (!isAlreadySelected && genderOption) {
                    setData(prev => ({
                      ...prev,
                      gender: [...prev.gender, genderOption],
                    }));
                  }
                  setSelectGender("");
                }}
              >
                <option value={""}>Select Gender</option>
                {genderOptions.map((option, index) => (
                  <option key={option.value + index} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className='flex flex-wrap gap-2 mt-3'>
                {data.gender.map((g, index) => (
                  <div key={g.value + index + "gendersection"} className='text-sm flex items-center gap-1 bg-gray-100 p-1 rounded'>
                    <p>{g.label}</p>
                    <div className='hover:text-red-500 cursor-pointer' onClick={() => handleRemoveGender(index)}>
                      <IoClose size={16} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className='grid gap-2'>
            <label className='font-medium'>Category</label>
            <div>
              <select
                className='bg-gray-50 border border-gray-300 w-full p-2 rounded focus:outline-none focus:border-primary-200'
                value={selectCategory}
                onChange={(e) => {
                  const value = e.target.value;
                  const category = allCategory.find(el => el._id === value);
                  
                  setData(prev => ({
                    ...prev,
                    category: [...prev.category, category],
                  }));
                  setSelectCategory("");
                }}
              >
                <option value={""}>Select Category</option>
                {allCategory.map((c, index) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              <div className='flex flex-wrap gap-2 mt-3'>
                {data.category.map((c, index) => (
                  <div key={c._id + index + "productsection"} className='text-sm flex items-center gap-1 bg-gray-100 p-1 rounded'>
                    <p>{c.name}</p>
                    <div className='hover:text-red-500 cursor-pointer' onClick={() => handleRemoveCategory(index)}>
                      <IoClose size={16} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className='grid gap-2 border rounded-md p-4 bg-gray-50'>
            <label className='font-medium mb-2'>Inventory Management</label>
            <SizeInventoryManager 
              value={data.sizes} 
              onChange={(sizeData) => {
                setData(prev => ({
                  ...prev,
                  sizes: sizeData.sizes,
                  availableSizes: sizeData.availableSizes,
                  stock: sizeData.totalStock // Keep the legacy stock field updated as well
                }));
              }}
            />
          </div>

          <div className='grid gap-2'>
            <label htmlFor='price' className='font-medium'>Price</label>
            <input
              id='price'
              type='number'
              placeholder='Enter product price'
              name='price'
              value={data.price}
              onChange={handleChange}
              required
              className='bg-gray-50 border border-gray-300 p-2 rounded focus:outline-none focus:border-primary-200'
            />
          </div>

          <div className='grid gap-2'>
            <label htmlFor='discount' className='font-medium'>Discount</label>
            <input
              id='discount'
              type='number'
              placeholder='Enter product discount'
              name='discount'
              value={data.discount}
              onChange={handleChange}
              className='bg-gray-50 border border-gray-300 p-2 rounded focus:outline-none focus:border-primary-200'
            />
          </div>

          {/**add more field**/}
          {Object?.keys(data?.more_details)?.map((k, index) => (
            <div key={k + index} className='grid gap-1'>
              <label htmlFor={k} className='font-medium'>{k}</label>
              <input
                id={k}
                type='text'
                value={data?.more_details[k]}
                onChange={(e) => {
                  const value = e.target.value;
                  setData(prev => ({
                    ...prev,
                    more_details: {
                      ...prev.more_details,
                      [k]: value
                    }
                  }));
                }}
                required
                className='bg-gray-50 p-2 border border-gray-300 rounded focus:outline-none focus:border-primary-200'
              />
            </div>
          ))}

          <div 
            onClick={() => setOpenAddField(true)} 
            className='hover:bg-gray-200 bg-white py-1 px-3 w-32 text-center border border-primary-200 rounded cursor-pointer'
          >
            Add Fields
          </div>

          <div className="mt-8 mb-4">
            <h3 className="text-lg font-semibold border-b border-gray-200 pb-2">Product Specifications</h3>
            <p className="text-sm text-gray-500 mt-1">These details will be displayed in a tabular format on the product page</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Wash Care */}
            <div className='grid gap-2'>
              <label htmlFor='washCare' className='font-medium'>Wash Care</label>
              <input
                id='washCare'
                type='text'
                placeholder='Wash care instructions'
                name='washCare'
                value={data.washCare}
                onChange={handleChange}
                className='bg-gray-50 border border-gray-300 p-2 rounded focus:outline-none focus:border-primary-200'
              />
            </div>
            
            {/* Size Model */}
            <div className='grid gap-2'>
              <label htmlFor='sizeModel' className='font-medium'>Size worn by Model</label>
              <input
                id='sizeModel'
                type='text'
                placeholder='Size worn by model'
                name='sizeModel'
                value={data.sizeModel}
                onChange={handleChange}
                className='bg-gray-50 border border-gray-300 p-2 rounded focus:outline-none focus:border-primary-200'
              />
            </div>
            
            {/* Fabric */}
            <div className='grid gap-2'>
              <label htmlFor='fabric' className='font-medium'>Fabric</label>
              <input
                id='fabric'
                type='text'
                placeholder='Fabric composition'
                name='fabric'
                value={data.fabric}
                onChange={handleChange}
                className='bg-gray-50 border border-gray-300 p-2 rounded focus:outline-none focus:border-primary-200'
              />
            </div>
          </div>
          
          <div className="mt-8 mb-4">
            <h3 className="text-lg font-semibold border-b border-gray-200 pb-2">Product Information</h3>
            <p className="text-sm text-gray-500 mt-1">Regulatory and seller information</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Country of Origin */}
            <div className='grid gap-2'>
              <label htmlFor='countryOfOrigin' className='font-medium'>Country of Origin</label>
              <input
                id='countryOfOrigin'
                type='text'
                placeholder='Country of origin'
                name='countryOfOrigin'
                value={data.countryOfOrigin}
                onChange={handleChange}
                className='bg-gray-50 border border-gray-300 p-2 rounded focus:outline-none focus:border-primary-200'
              />
            </div>
            
            {/* Marketed By */}
            <div className='grid gap-2'>
              <label htmlFor='marketedBy' className='font-medium'>Marketed By</label>
              <input
                id='marketedBy'
                type='text'
                placeholder='Company marketing the product'
                name='marketedBy'
                value={data.marketedBy}
                onChange={handleChange}
                className='bg-gray-50 border border-gray-300 p-2 rounded focus:outline-none focus:border-primary-200'
              />
            </div>
            
            {/* Imported By */}
            <div className='grid gap-2'>
              <label htmlFor='importedBy' className='font-medium'>Imported By</label>
              <input
                id='importedBy'
                type='text'
                placeholder='Company importing the product'
                name='importedBy'
                value={data.importedBy}
                onChange={handleChange}
                className='bg-gray-50 border border-gray-300 p-2 rounded focus:outline-none focus:border-primary-200'
              />
            </div>
            
            {/* Customer Care Address */}
            <div className='grid gap-2'>
              <label htmlFor='customerCareAddress' className='font-medium'>Customer Care Address</label>
              <textarea
                id='customerCareAddress'
                placeholder='Customer support address'
                name='customerCareAddress'
                value={data.customerCareAddress}
                onChange={handleChange}
                rows={2}
                className='bg-gray-50 border border-gray-300 p-2 rounded focus:outline-none focus:border-primary-200 resize-none'
              />
            </div>
          </div>

          <button className='bg-black hover:bg-gray-800 text-white py-2 rounded font-semibold'>
            Submit
          </button>
        </form>

        {ViewImageURL && (
          <ViewImage url={ViewImageURL} close={() => setViewImageURL("")} />
        )}

        {openAddField && (
          <AddFieldComponent
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            submit={handleAddField}
            close={() => setOpenAddField(false)}
          />
        )}
      </div>
    </section>
  );
}

export default UploadProduct;