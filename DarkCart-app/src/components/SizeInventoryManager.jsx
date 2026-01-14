import React, { useState, useEffect } from 'react';

const SizeInventoryManager = ({ value = {}, onChange }) => {
  const sizes = ['XS', 'S', 'M', 'L', 'XL'];
  const [sizeInventory, setSizeInventory] = useState({
    XS: 0,
    S: 0,
    M: 0,
    L: 0,
    XL: 0
  });
  
  // Initialize with provided value if available
  useEffect(() => {
    if (value && Object.keys(value).length > 0) {
      console.log("SizeInventoryManager received initial values:", value);
      setSizeInventory(value);
    }
  }, [value]);

  // Calculate total inventory across all sizes
  const totalInventory = Object.values(sizeInventory).reduce((sum, qty) => sum + Number(qty), 0);
  
  // Calculate available sizes (those with inventory > 0)
  const availableSizes = Object.entries(sizeInventory)
    .filter(([_, qty]) => Number(qty) > 0)
    .map(([size]) => size);

  // Handle size inventory changes
  const handleSizeChange = (size, quantity) => {
    const newQuantity = quantity === '' ? '' : Math.max(0, parseInt(quantity) || 0);
    
    const newSizeInventory = {
      ...sizeInventory,
      [size]: newQuantity
    };
    
    console.log(`Size inventory changed for ${size}: ${quantity}`);
    setSizeInventory(newSizeInventory);
    
    if (onChange) {
      onChange({
        sizes: newSizeInventory,
        availableSizes: Object.entries(newSizeInventory)
          .filter(([_, qty]) => Number(qty) > 0)
          .map(([size]) => size),
        totalStock: Object.values(newSizeInventory).reduce((sum, qty) => sum + Number(qty), 0)
      });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-medium">Size Inventory</h3>
        <div className="text-sm text-gray-600">Total: {totalInventory} items</div>
      </div>
      
      <div className="grid grid-cols-5 gap-2">
        {sizes.map((size) => (
          <div key={size} className="mb-2">
            <div className="text-center mb-1 font-medium">{size}</div>
            <input
              type="number"
              min="0"
              value={sizeInventory[size]}
              onChange={(e) => handleSizeChange(size, e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
        ))}
      </div>
      
      <div className="mt-3">
        <p className="text-sm text-gray-600">
          Available Sizes: {availableSizes.length > 0 ? availableSizes.join(', ') : 'None'}
        </p>
      </div>
    </div>
  );
};

export default SizeInventoryManager;
