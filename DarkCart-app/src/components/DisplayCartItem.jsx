import React from 'react'
import { IoClose } from 'react-icons/io5'
import { Link, useNavigate } from 'react-router-dom'
import { useGlobalContext } from '../provider/GlobalProvider'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { FaCaretRight } from "react-icons/fa";
import { useSelector } from 'react-redux'
import AddToCartButton from './AddToCartButton'
import { pricewithDiscount } from '../utils/PriceWithDiscount'
import imageEmpty from '../assets/Empty-cuate.png'
import toast from 'react-hot-toast'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'

const DisplayCartItem = ({close}) => {
    const { notDiscountTotalPrice, totalPrice ,totalQty, fetchCartItems } = useGlobalContext()
    const cartItem  = useSelector(state => state.cartItem.cart)
    const user = useSelector(state => state.user)
    const navigate = useNavigate()

    // Function to check if an item should be removed automatically
    const shouldAutoRemoveItem = (item) => {
      // Check bundles
      if (item.itemType === 'bundle' && item.bundleId) {
        // Inactive bundles
        if (item.bundleId.isActive === false) return true;
        
        // Out of stock bundles
        if (item.bundleId.stock !== undefined && item.bundleId.stock === 0) return true;
        
        // Expired time-limited bundles
        if (item.bundleId.isTimeLimited) {
          const now = new Date();
          const endDate = new Date(item.bundleId.endDate);
          if (now > endDate) return true;
        }
      }
      
      // Check products
      if (item.itemType === 'product' && item.productId) {
        // Inactive products
        if (item.productId.publish === false) return true;
        
        // Out of stock products
        if (item.productId.stock !== undefined && item.productId.stock === 0) return true;
      }
      
      return false;
    };

    // Auto-remove invalid items when cart loads
    React.useEffect(() => {
      if (cartItem && cartItem.length > 0) {
        const itemsToRemove = cartItem.filter(item => shouldAutoRemoveItem(item));
        
        if (itemsToRemove.length > 0) {
          itemsToRemove.forEach(async (item) => {
            try {
              await Axios({
                ...SummaryApi.deleteCartItem,
                data: { _id: item._id }
              });
            } catch (error) {
              console.error("Error removing invalid cart item:", error);
            }
          });
          
          // Refresh cart after removals
          setTimeout(() => {
            fetchCartItems();
            toast.success(`${itemsToRemove.length} unavailable item${itemsToRemove.length > 1 ? 's' : ''} removed from cart`, {
              duration: 4000
            });
          }, 1000);
        }
      }
    }, [cartItem, fetchCartItems]);

    const redirectToCheckoutPage = ()=>{
        if(user?._id){
            navigate("/checkout/bag")
            if(close){
                close()
            }
            return
        }
        toast("Please Login")
    }
  // Handle background click to close cart
  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      close();
    }
  };

  // Handle Escape key to close the cart
  React.useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        close();
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [close]);

  return (
    <section 
      className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end overflow-hidden'
      onClick={handleBackgroundClick}
      style={{ touchAction: 'none' }}
    >
        <div className='bg-white w-full max-w-xs xs:max-w-sm sm:max-w-md md:max-w-sm lg:max-w-md h-full overflow-hidden flex flex-col font-["Inter"]'>
            <div className='flex items-center p-3 sm:p-4 border-b border-gray-100 gap-3 justify-between'>
                <h2 className='font-bold text-black font-["Playfair_Display"] text-xl sm:text-2xl'>Shopping Cart</h2>
                <button 
                  onClick={close} 
                  className='p-1.5 rounded-full hover:bg-gray-50 text-gray-400 hover:text-black transition-all'
                  aria-label="Close cart"
                >
                    <IoClose size={20}/>
                </button>
            </div>

            <div className='flex-grow overflow-y-auto bg-white p-2 sm:p-3 flex flex-col gap-3 sm:gap-4'>
                {/***display items */}
                {
                    cartItem[0] ? (
                        <>
                            <div className='flex items-center justify-between px-3 sm:px-4 py-2 bg-gray-50 text-gray-700 rounded border border-gray-100'>
                                    <p className='font-medium text-xs sm:text-sm font-["Inter"]'>Your total savings</p>
                                    <p className='font-semibold text-green-600 text-sm sm:text-base font-["Inter"]'>{DisplayPriceInRupees(notDiscountTotalPrice - totalPrice )}</p>
                            </div>
                            <div className='bg-white rounded p-3 sm:p-4 grid gap-3 sm:gap-4 overflow-auto border border-gray-100'>
                                    {
                                        cartItem[0] && (
                                            cartItem.map((item,index)=>{
                                                return(
                                                    <div key={item?._id+"cartItemDisplay"} className='flex w-full gap-3 sm:gap-4 pb-3 border-b border-gray-100 last:border-b-0 last:pb-0'>
                                                        <div className='w-14 h-14 sm:w-16 sm:h-16 min-h-14 min-w-14 sm:min-h-16 sm:min-w-16 bg-gray-50 border border-gray-100 rounded overflow-hidden flex-shrink-0'>
                                                            <img
                                                                src={item?.itemType === 'bundle' ? item?.bundleId?.images?.[0] : item?.productId?.image?.[0]}
                                                                className='object-contain w-full h-full'
                                                                alt={item?.itemType === 'bundle' ? item?.bundleId?.title : item?.productId?.name}
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = imageEmpty;
                                                                }}
                                                            />
                                                        </div>
                                                        <div className='flex-grow min-w-0 text-xs font-["Inter"]'>
                                                            <p className='text-xs sm:text-sm text-ellipsis line-clamp-2 text-black font-medium'>
                                                                {item?.itemType === 'bundle' ? item?.bundleId?.title : item?.productId?.name}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <p className='text-gray-500 text-xs'>
                                                                    {item?.itemType === 'bundle' ? 'Bundle Offer' : item?.productId?.unit}
                                                                </p>
                                                                {item?.itemType !== 'bundle' && item?.size && (
                                                                    <span className='bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-xs font-medium'>
                                                                        Size: {item?.size}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className='font-semibold text-black mt-1.5'>
                                                                {item?.itemType === 'bundle' 
                                                                    ? DisplayPriceInRupees(item?.bundleId?.bundlePrice)
                                                                    : (() => {
                                                                        // DEBUG info
                                                                        console.log(`CartItem price debug for ${item?._id}:`, {
                                                                            size: item?.size,
                                                                            sizeAdjustedPrice: item?.sizeAdjustedPrice,
                                                                            productId: item?.productId?._id,
                                                                            basePrice: item?.productId?.price,
                                                                            discount: item?.productId?.discount,
                                                                            sizePricing: item?.productId?.sizePricing
                                                                        });
                                                                        
                                                                        // First check if we have a sizeAdjustedPrice from the backend
                                                                        // This is stored when the item was added to the cart
                                                                        if (item?.sizeAdjustedPrice !== undefined) {
                                                                            console.log(`Using sizeAdjustedPrice: ${item.sizeAdjustedPrice}`);
                                                                            const finalPrice = pricewithDiscount(
                                                                                item.sizeAdjustedPrice,
                                                                                item?.productId?.discount
                                                                            );
                                                                            return DisplayPriceInRupees(finalPrice);
                                                                        }
                                                                        
                                                                        // Otherwise try to use sizePricing from product data
                                                                        const basePrice = item?.size && 
                                                                                       item?.productId?.sizePricing && 
                                                                                       item?.productId?.sizePricing[item.size] !== undefined
                                                                            ? item?.productId?.sizePricing[item.size]
                                                                            : (item?.productId?.price || 0);
                                                                        
                                                                        // Apply discount if available
                                                                        const finalPrice = pricewithDiscount(
                                                                            basePrice,
                                                                            item?.productId?.discount
                                                                        );
                                                                        
                                                                        console.log(`Calculated price: ${finalPrice}`);
                                                                        return DisplayPriceInRupees(finalPrice);
                                                                    })()
                                                                }
                                                            </p>
                                                            {item?.itemType !== 'bundle' && item?.size && (
                                                                <div className='flex flex-col gap-0.5'>
                                                                    <p className='text-xs text-green-600'>
                                                                        Size: <span className="font-semibold">{item?.size}</span>
                                                                    </p>
                                                                    
                                                                    {/* Show price details if this size has a custom price */}
                                                                    {item?.productId?.sizePricing && 
                                                                     item?.productId?.sizePricing[item.size] !== undefined && 
                                                                     item?.productId?.sizePricing[item.size] !== item?.productId?.price && (
                                                                        <p className={`text-xs ${item?.productId?.sizePricing[item.size] > item?.productId?.price ? 'text-orange-600' : 'text-green-600'}`}>
                                                                            Price for this size: {DisplayPriceInRupees(item?.productId?.sizePricing[item.size])}
                                                                            {item?.productId?.sizePricing[item.size] > item?.productId?.price ? 
                                                                                ` (${((item?.productId?.sizePricing[item.size] - item?.productId?.price) / item?.productId?.price * 100).toFixed(0)}% higher)` : 
                                                                                ` (${((item?.productId?.price - item?.productId?.sizePricing[item.size]) / item?.productId?.price * 100).toFixed(0)}% lower)`
                                                                            }
                                                                        </p>
                                                                     )
                                                                    }
                                                                    
                                                                    {/* Display stock information */}
                                                                    {item?.productId?.sizes && item?.productId?.sizes[item.size] !== undefined && (
                                                                        <p className='text-xs text-gray-500'>
                                                                            Size stock: {item.productId.sizes[item.size]} | 
                                                                            Total stock: {item.productId.stock || 'N/A'}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {/* Quantity Controls with Stock Validation */}
                                                            <div className='mt-2 w-full max-w-[120px]'>
                                                                {item?.itemType === 'bundle' ? (
                                                                    <AddToCartButton 
                                                                        data={item?.bundleId} 
                                                                        isBundle={true}
                                                                        cartItemId={item?._id}
                                                                        currentQty={item?.quantity}
                                                                    />
                                                                ) : (
                                                                    <AddToCartButton 
                                                                        data={{
                                                                            ...item?.productId,
                                                                            // Ensure both size-specific and overall stock data are available
                                                                            sizes: item?.productId?.sizes || {},
                                                                            stock: item?.productId?.stock,
                                                                            // Add size-specific pricing
                                                                            sizePricing: item?.productId?.sizePricing || {},
                                                                            // Add any other necessary fields
                                                                            _id: item?.productId?._id,
                                                                            name: item?.productId?.name
                                                                        }}
                                                                        isBundle={false}
                                                                        cartItemId={item?._id}
                                                                        currentQty={item?.quantity}
                                                                        selectedSize={item?.size} // Pass the size information
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })
 
                                        )
                                    }
                            </div>
                            <div className='bg-white p-3 sm:p-4 rounded border border-gray-100'>
                                <h3 className='font-semibold text-black mb-2 sm:mb-3 text-base sm:text-lg font-["Playfair_Display"]'>Bill details</h3>
                                <div className='flex gap-2 sm:gap-4 justify-between mb-2 text-xs sm:text-sm font-["Inter"]'>
                                    <p className='text-gray-600'>Items total</p>
                                    <p className='flex items-center gap-1 sm:gap-2 flex-shrink-0 overflow-hidden'>
                                      <span className='line-through text-gray-400 text-xs truncate'>{DisplayPriceInRupees(notDiscountTotalPrice)}</span>
                                      <span className='font-medium text-black whitespace-nowrap'>{DisplayPriceInRupees(totalPrice)}</span>
                                    </p>
                                </div>
                                <div className='flex gap-2 sm:gap-4 justify-between mb-2 text-xs sm:text-sm font-["Inter"]'>
                                    <p className='text-gray-600'>Quantity total</p>
                                    <p className='flex items-center gap-2 text-black font-medium'>{totalQty} {totalQty === 1 ? 'item' : 'items'}</p>
                                </div>
                                {/* <div className='flex gap-2 sm:gap-4 justify-between ml-1 mb-2 sm:mb-3 pb-2 sm:pb-3 border-b border-gray-200 text-xs sm:text-sm'>
                                    <p className='text-gray-600'>Delivery Charge</p>
                                    <p className='flex items-center gap-2 text-black font-medium'>Free</p>
                                </div> */}
                                <div className='font-semibold flex items-center justify-between gap-2 sm:gap-4 pt-2 border-t border-gray-100 mt-2 font-["Inter"]'>
                                    <p className='text-black text-sm sm:text-base'>Grand total</p>
                                    <p className='text-black text-base sm:text-lg'>{DisplayPriceInRupees(totalPrice)}</p>
                                </div>
                            </div>
                        </>
                    ) : (
                      
                         <div className='bg-white flex flex-col justify-center items-center h-full py-6 px-4 rounded border border-gray-100'>
                         <img
                             src={imageEmpty}
                             alt="Empty Cart"
                             className='max-w-[180px] w-full h-auto object-contain'
                         />
                         <p className='text-gray-600 mt-4 text-center font-medium font-["Inter"]'>Your cart is empty</p>
                          <Link 
                            onClick={close} 
                            to={"/"} 
                            className='block bg-black hover:bg-gray-800 px-5 py-2.5 text-white rounded mt-4 font-medium transition-colors text-sm font-["Inter"]'
                          >
                            Shop Now
                          </Link>
                     </div>
                    )
                }
                
            </div>

            {
                cartItem[0] && (
                    <div className='p-2 sm:p-3 flex-shrink-0 border-t border-gray-100'>
                        <div 
                          onClick={redirectToCheckoutPage} 
                          className='bg-black hover:bg-gray-800 text-white px-3 sm:px-4 font-medium text-sm sm:text-base py-2.5 sm:py-3 rounded flex items-center gap-2 sm:gap-4 justify-between cursor-pointer transition-colors font-["Inter"]'
                        >
                            <div>
                                {DisplayPriceInRupees(totalPrice)}
                            </div>
                            <button className='flex items-center gap-1 whitespace-nowrap'>
                                Proceed to Checkout
                                <span><FaCaretRight className="text-xs sm:text-sm"/></span>
                            </button>
                        </div>
                    </div>
                )
            }
            
        </div>
    </section>
  )
}

export default DisplayCartItem