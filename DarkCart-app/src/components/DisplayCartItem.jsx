import React from 'react'
import { IoClose } from 'react-icons/io5'
import { Link, useNavigate } from 'react-router-dom'
import { useGlobalContext } from '../provider/GlobalProvider'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { FaCaretRight } from "react-icons/fa";
import { useSelector } from 'react-redux'
import AddToCartButton from './AddToCartButton'
import { pricewithDiscount } from '../utils/PriceWithDiscount'
import imageEmpty from '../assets/noCart.jpg'
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
      className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end overflow-hidden'
      onClick={handleBackgroundClick}
      style={{ touchAction: 'none' }}
    >
        <div className='bg-white w-full max-w-xs xs:max-w-sm sm:max-w-md md:max-w-sm lg:max-w-md h-full overflow-hidden flex flex-col'>
            <div className='flex items-center p-3 sm:p-4 shadow-md gap-3 justify-between border-b border-gray-200'>
                <h2 className='font-bold text-gray-900 font-serif text-base sm:text-lg'>Shopping Cart</h2>
                <button 
                  onClick={close} 
                  className='p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-800 transition-all'
                  aria-label="Close cart"
                >
                    <IoClose size={22}/>
                </button>
            </div>

            <div className='flex-grow overflow-y-auto bg-gray-50 p-2 sm:p-3 flex flex-col gap-3 sm:gap-4'>
                {/***display items */}
                {
                    cartItem[0] ? (
                        <>
                            <div className='flex items-center justify-between px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg border border-gray-200'>
                                    <p className='font-medium text-xs sm:text-sm'>Your total savings</p>
                                    <p className='font-semibold text-black text-sm sm:text-base'>{DisplayPriceInRupees(notDiscountTotalPrice - totalPrice )}</p>
                            </div>
                            <div className='bg-white rounded-lg p-3 sm:p-4 grid gap-3 sm:gap-4 overflow-auto shadow-sm border border-gray-100'>
                                    {
                                        cartItem[0] && (
                                            cartItem.map((item,index)=>{
                                                return(
                                                    <div key={item?._id+"cartItemDisplay"} className='flex w-full gap-3 sm:gap-4 pb-4 border-b border-gray-100 last:border-b-0'>
                                                        <div className='w-14 h-14 sm:w-16 sm:h-16 min-h-14 min-w-14 sm:min-h-16 sm:min-w-16 bg-gray-50 border border-gray-200 rounded-md overflow-hidden flex-shrink-0'>
                                                            <img
                                                                src={item?.itemType === 'bundle' ? item?.bundleId?.images?.[0] : item?.productId?.image?.[0]}
                                                                className='object-cover w-full h-full'
                                                                alt={item?.itemType === 'bundle' ? item?.bundleId?.title : item?.productId?.name}
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = imageEmpty;
                                                                }}
                                                            />
                                                        </div>
                                                        <div className='flex-grow min-w-0 text-xs'>
                                                            <p className='text-xs sm:text-sm text-ellipsis line-clamp-2 text-gray-900 font-medium'>
                                                                {item?.itemType === 'bundle' ? item?.bundleId?.title : item?.productId?.name}
                                                            </p>
                                                            <p className='text-gray-500 text-xs'>
                                                                {item?.itemType === 'bundle' ? 'Bundle Offer' : item?.productId?.unit}
                                                            </p>
                                                            <p className='font-semibold text-black mt-1'>
                                                                {item?.itemType === 'bundle' 
                                                                    ? DisplayPriceInRupees(item?.bundleId?.bundlePrice)
                                                                    : DisplayPriceInRupees(pricewithDiscount(item?.productId?.price,item?.productId?.discount))
                                                                }
                                                            </p>
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
                                                                        data={item?.productId}
                                                                        isBundle={false}
                                                                        cartItemId={item?._id}
                                                                        currentQty={item?.quantity}
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
                            <div className='bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100'>
                                <h3 className='font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base'>Bill details</h3>
                                <div className='flex gap-2 sm:gap-4 justify-between ml-1 mb-2 text-xs sm:text-sm'>
                                    <p className='text-gray-600'>Items total</p>
                                    <p className='flex items-center gap-1 sm:gap-2 flex-shrink-0 overflow-hidden'>
                                      <span className='line-through text-gray-400 text-xs truncate'>{DisplayPriceInRupees(notDiscountTotalPrice)}</span>
                                      <span className='font-medium text-black whitespace-nowrap'>{DisplayPriceInRupees(totalPrice)}</span>
                                    </p>
                                </div>
                                <div className='flex gap-2 sm:gap-4 justify-between ml-1 mb-2 text-xs sm:text-sm'>
                                    <p className='text-gray-600'>Quantity total</p>
                                    <p className='flex items-center gap-2 text-black font-medium'>{totalQty} {totalQty === 1 ? 'item' : 'items'}</p>
                                </div>
                                {/* <div className='flex gap-2 sm:gap-4 justify-between ml-1 mb-2 sm:mb-3 pb-2 sm:pb-3 border-b border-gray-200 text-xs sm:text-sm'>
                                    <p className='text-gray-600'>Delivery Charge</p>
                                    <p className='flex items-center gap-2 text-black font-medium'>Free</p>
                                </div> */}
                                <div className='font-semibold flex items-center justify-between gap-2 sm:gap-4'>
                                    <p className='text-gray-900 text-sm sm:text-base'>Grand total</p>
                                    <p className='text-black text-base sm:text-lg'>{DisplayPriceInRupees(totalPrice)}</p>
                                </div>
                            </div>
                        </>
                    ) : (
                      
                         <div className='bg-white flex flex-col justify-center items-center h-full py-5 px-4 rounded-lg shadow-sm'>
                         <img
                             src={imageEmpty}
                             alt="Empty Cart"
                             className='max-w-[200px] w-full h-auto object-contain'
                         />
                         <p className='text-gray-500 mt-4 text-center'>Your cart is empty</p>
                          <Link 
                            onClick={close} 
                            to={"/"} 
                            className='block bg-black hover:bg-gray-800 px-6 py-3 text-white rounded-md mt-4 font-medium tracking-wide transition-colors text-sm sm:text-base'
                          >
                            Shop Now
                          </Link>
                     </div>
                    )
                }
                
            </div>

            {
                cartItem[0] && (
                    <div className='p-2 sm:p-3 flex-shrink-0 border-t border-gray-200'>
                        <div 
                          onClick={redirectToCheckoutPage} 
                          className='bg-black hover:bg-gray-800 text-white px-3 sm:px-4 font-bold text-sm sm:text-base py-3 sm:py-4 rounded-lg flex items-center gap-2 sm:gap-4 justify-between cursor-pointer transition-colors'
                        >
                            <div>
                                {DisplayPriceInRupees(totalPrice)}
                            </div>
                            <button className='flex items-center gap-1 font-semibold tracking-wide whitespace-nowrap'>
                                Proceed to Checkout
                                <span><FaCaretRight/></span>
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