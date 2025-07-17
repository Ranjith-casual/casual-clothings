import { useGlobalContext } from "../provider/GlobalProvider";
import { FaCartShopping } from "react-icons/fa6";
import { DisplayPriceInRupees } from "../utils/DisplayPriceInRupees";
import { FaCaretRight } from "react-icons/fa";
import { useSelector } from "react-redux";

const CartMobileLink = () => {
  const { totalPrice, totalQty, setOpenCartSection } = useGlobalContext(); // Accessing global context
  const cartItem = useSelector((state) => state.cartItem.cart); // Accessing cart items from redux

  const handleViewCart = () => {
    setOpenCartSection(true);
  };

  return (
    <>
      {/* Only show if cart has items */}
      {cartItem.length > 0 && (
        <div className="sticky bottom-4 p-2 z-20">
          <div className="bg-black px-4 py-3 rounded-lg text-white text-sm flex items-center justify-between gap-3 lg:hidden shadow-lg border border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-800 rounded-md w-fit">
                <FaCartShopping size={16} />
              </div>
              <div className="text-xs">
                <p className="font-medium">{totalQty} items</p>
                <p className="font-semibold text-sm">{DisplayPriceInRupees(totalPrice)}</p>
              </div>
            </div>

            {/* View Cart Button */}
            <button 
              onClick={handleViewCart}
              className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-md hover:bg-gray-100 transition-colors font-medium"
            >
              <span className="text-sm">View Cart</span>
              <FaCaretRight />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CartMobileLink;
