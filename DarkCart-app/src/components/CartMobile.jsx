import { useGlobalContext } from "../provider/GlobalProvider";
import { FaCartShopping } from "react-icons/fa6";
import { DisplayPriceInRupees } from "../utils/DisplayPriceInRupees";
import { FaCaretRight } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

const CartMobileLink = () => {
  const { totalPrice, totalQty, setOpenCartSection } = useGlobalContext(); // Accessing global context
  const cartItem = useSelector((state) => state.cartItem.cart); // Accessing cart items from redux
  const user = useSelector((state) => state.user); // Get user state
  const location = useLocation(); // Get current route location

  const handleViewCart = () => {
    setOpenCartSection(true);
  };
  
  // Check if current page is one of checkout-related pages
  const isCheckoutPage = ['/bag', '/address', '/payment', '/checkout'].some(path => 
    location.pathname.includes(path)
  );

  return (
    <>
      {/* Only show if user is logged in and cart has items */}
      {user?._id && cartItem.length > 0 && (
        <div className={`fixed ${isCheckoutPage ? 'bottom-4 right-2 w-auto' : 'w-full bottom-4 p-2'} z-20 transition-all duration-300`}>
          <div className={`bg-black ${isCheckoutPage ? 'px-2 py-2 rounded-full' : 'px-4 py-3 rounded-lg'} text-white text-sm flex items-center ${isCheckoutPage ? 'justify-center' : 'justify-between gap-3'} lg:hidden shadow-lg border border-gray-800 transition-all duration-300`}>
            {!isCheckoutPage && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-800 rounded-md w-fit">
                  <FaCartShopping size={16} />
                </div>
                <div className="text-xs">
                  <p className="font-medium">{totalQty} items</p>
                  <p className="font-semibold text-sm">{DisplayPriceInRupees(totalPrice)}</p>
                </div>
              </div>
            )}

            {/* View Cart Button */}
            <button 
              onClick={handleViewCart}
              className={`flex items-center ${isCheckoutPage ? 'p-2 bg-gray-800 rounded-full w-10 h-10 justify-center checkout-cart-button relative' : 'gap-2 bg-white text-black px-4 py-2 rounded-md hover:bg-gray-100 font-medium'}`}
            >
              {isCheckoutPage ? (
                <>
                  <FaCartShopping size={16} className="text-white" />
                  <span className="absolute -top-1 -right-1 bg-white text-black text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {cartItem.length}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-sm">View Cart</span>
                  <FaCaretRight />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CartMobileLink;
