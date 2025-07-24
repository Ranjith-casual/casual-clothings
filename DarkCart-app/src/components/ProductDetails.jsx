import React from 'react';

const ProductDetails = ({ data, className = "" }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-light text-sm uppercase tracking-[0.15em] text-gray-600 font-['Poppins']">Product Specifications</h3>
      </div>
      
      <div className="animate-fadeIn">
        <div className="border-t border-gray-200">
         
          <div className="grid grid-cols-2 border-b border-gray-100">
            <div className="py-3.5 px-4 font-medium text-gray-600 bg-gray-50 border-r border-gray-100 font-['Poppins']">Wash Care</div>
            <div className="py-3.5 px-4 text-gray-800 font-light font-['Poppins']">{data.washCare || 'Machine wash'}</div>
          </div>
          
          <div className="grid grid-cols-2 border-b border-gray-100">
            <div className="py-3.5 px-4 font-medium text-gray-600 bg-gray-50 border-r border-gray-100 font-['Poppins']">Package Contains</div>
            <div className="py-3.5 px-4 text-gray-800 font-light font-['Poppins']">Package contains: 1 {data.name}</div>
          </div>
          
          <div className="grid grid-cols-2 border-b border-gray-100">
            <div className="py-3.5 px-4 font-medium text-gray-600 bg-gray-50 border-r border-gray-100 font-['Poppins']">Size worn by Model</div>
            <div className="py-3.5 px-4 text-gray-800 font-light font-['Poppins']">{data.sizeModel || '32'}</div>
          </div>
          
          <div className="grid grid-cols-2 border-b border-gray-100">
            <div className="py-3.5 px-4 font-medium text-gray-600 bg-gray-50 border-r border-gray-100 font-['Poppins']">Fabric</div>
            <div className="py-3.5 px-4 text-gray-800 font-light font-['Poppins']">{data.fabric || '80% cotton, 19% polyester, 1% elastane'}</div>
          </div>
        </div>
        
        {/* Product description */}
        {data.description && (
          <div className="mt-8">
            <h3 className="font-light text-sm uppercase tracking-[0.15em] text-gray-600 mb-4 font-['Poppins']">Description</h3>
            <p className='text-base text-gray-700 leading-relaxed font-light font-["Poppins"]'>{data.description}</p>
          </div>
        )}
        
        {/* Additional pricing and contact information */}
        <div className="mt-6">
          <div className="space-y-4 border-t border-gray-200 pt-4">
            <div className="flex">
      
            </div>
            
         
            
            <div className="flex">
              <div className="font-medium text-gray-600 w-32 font-['Poppins']">Imported By</div>
              <div className="text-gray-800 font-['Poppins']">
                : {data.importedBy || "casualclothings Trading (India) Pvt. Ltd."}
              </div>
            </div>
            
            <div className="flex">
              <div className="font-medium text-gray-600 w-32 font-['Poppins']">Country of Origin</div>
              <div className="text-gray-800 font-['Poppins']">: {data.countryOfOrigin || "India"}</div>
            </div>
            
            <div className="flex">
              <div className="font-medium text-gray-600 w-32 font-['Poppins']">Customer Care Address</div>
              <div className="text-gray-800 font-['Poppins']">
                : Tower-B, 7th Floor, casualclothings Office, Knowledge Park, Main Road, Bengaluru, Karnataka - 560029
              </div>
            </div>
          </div>
        </div>
        
        {/* Display more details if available */}
        {data?.more_details && Object.keys(data?.more_details).length > 0 && (
          <div className="mt-4 grid gap-2">
            <h3 className="font-medium text-gray-900 mb-2">Additional Details</h3>
            {Object.keys(data?.more_details).map((element, index) => (
              <div key={`details-${element}-${index}`} className="flex py-2 border-b border-gray-100">
                <p className='font-medium text-gray-900 w-1/3 font-["Poppins"]'>{element}</p>
                <p className='text-base text-gray-600 w-2/3 font-["Poppins"]'>{data?.more_details[element]}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
