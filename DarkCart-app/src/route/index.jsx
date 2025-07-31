import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Home from "../pages/Home";
import SearchPage from "../pages/SearchPage";
import About from "../pages/About";
import Blog from "../pages/Blog";
import SizeGuide from "../pages/SizeGuide"; 
import FAQ from "../pages/FAQ";
import ShippingReturns from "../pages/ShippingReturns";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import TermsConditions from "../pages/TermsConditions";
import Lookbook from "../pages/Lookbook";
import Sustainability from "../pages/Sustainability";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import OtpVerify from "../pages/OtpVerify";
import ResetPassword from "../pages/ResetPassword";
import UserMenuMobile from "../pages/UserMenuMobile";
import Dashboard from "../layout/Dashboard";
import Profile from "../pages/Profile";
import MyOrders from "../pages/MyOrders";
// import MyRefunds from "../pages/MyRefunds";
import UserRefundManagement from "../pages/UserRefundManagement";
import ReturnProduct from "../pages/ReturnProduct";
import Address from "../pages/Address";
import WishlistPage from "../pages/WishlistPage";
import CategoryPage from "../pages/CategoryPage";
import UploadProduct from "../pages/UploadProduct";
import ProductAdmin from "../pages/ProductAdmin";
import AdminOrderDashboard from "../pages/AdminOrderDashboard";
import ProductListPage from "../pages/ProductListPage";
import ProductDisplayPage from "../pages/ProductDisplayPage";
import CartMobile from "../pages/CartMobile";
import CheckoutPage from "../pages/CheckoutPage";
import BagPage from "../pages/BagPage";
import AddressPage from "../pages/AddressPage";
import PaymentPage from "../pages/PaymentPage";
import Success from "../pages/Success";
import Cancel from "../pages/Cancel";
import OrderSuccessPage from "../pages/OrderSuccessPage";
import PageNotFound from "../pages/PageNotFound"; // Add this import
import AdminPermission from "../layout/AdminPermission";
import DeliveryChargeCalculator from "../pages/test";
import BundleOffers from "../pages/BundleOffers";
import BundleDetail from "../pages/BundleDetail";

import BundleAdmin from "../pages/BundleAdmin";
import AdminDashboard from "../pages/AdminDashboard";
import UserManagement from "../pages/UserManagement";
import PaymentManagement from "../pages/PaymentManagement";
import CancellationManagementPage from "../pages/CancellationManagementPage";
import AdminReturnManagement from "../pages/AdminReturnManagement";
import CustomTshirtRequest from "../pages/CustomTshirtRequest";
import MyCustomTshirts from "../pages/MyCustomTshirts";
import CustomTshirtRequestsAdmin from "../pages/CustomTshirtRequestsAdmin";
import StockManagementPage from "../pages/StockManagementPage";
import CancellationPolicyPage from "../pages/CancellationPolicyPage";
import RefundManagementPage from "../pages/RefundManagementPage";
import InventoryManagement from "../pages/InventoryManagement";
import Sitemap from "../pages/Sitemap";

const router = createBrowserRouter([
    {
        path:"/",
        element: <App/>,
        children: [
            {
                path:"/",
                element : <Home/>
            },
            {
                path:"/search",
                element : <SearchPage/>
            },
            {
                path:"/about",
                element : <About/>
            },
            {
                path:"/blog",
                element : <Blog/>
            },
            {
                path:"/size-guide",
                element : <SizeGuide/>
            },
            {
                path:"/faq",
                element : <FAQ/>
            },
            {
                path:"/shipping-returns",
                element : <ShippingReturns/>
            },
            {
                path:"/privacy-policy",
                element : <PrivacyPolicy/>
            },
            {
                path:"/terms-conditions",
                element : <TermsConditions/>
            },
            {
                path:"/sitemap",
                element : <Sitemap/>
            },
            {
                path:"/lookbook",
                element : <Lookbook/>
            },
            {
                path:"/sustainability",
                element : <Sustainability/>
            },
            {
                path:"/custom-tshirt",
                element : <CustomTshirtRequest/>
            },
            {
                path:"/return-product",
                element : <ReturnProduct/>
            },
            {
                path:"/login",
                element : <Login/>
            },{
                path:"/register",
                element : <Register/>
            },{
                path:"/forget-password",
                element : <ForgotPassword/>
            },{
                path:"/otp-verification",
                element : <OtpVerify/>
            },{
                path:"/reset-password",
                element : <ResetPassword/>
            },
            // {
            //     path:"/user-menu-mobile",
            //     element : <UserMenuMobile/>
            // },
            {
                path:"/dashboard",
                element:<Dashboard/>,
                children :[{
                    path:"profile",
                    element:<Profile/>
                },{
                    path:"myorders",
                    element:<MyOrders/>
                },
                // {
                //     path:"myrefunds",
                //     element:<MyRefunds/>
                // }
                ,{
                    path:"refund-dashboard", // User refund dashboard
                    element:<UserRefundManagement/>
                },{
                    path:"return-product",
                    element:<ReturnProduct/>
                },{
                    path:"address",
                    element:<Address/>
                },{
                    path:"wishlist",
                    element:<WishlistPage/>
                },
                {
                    path:"my-custom-tshirts",
                    element:<MyCustomTshirts/>
                },
                {
                    path:"admin",
                    element:<AdminPermission><AdminDashboard/></AdminPermission>
                },
                {
                    path:"category",
                    element:<AdminPermission><CategoryPage/></AdminPermission>
                },
                {
                    path:"upload-product",
                    element:<AdminPermission><UploadProduct/></AdminPermission>,
                    errorElement: <div className="min-h-screen flex items-center justify-center bg-white p-4">
                        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md border border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Error Loading Product Upload Page</h2>
                            <p className="text-gray-600 mb-4">
                                There was a problem loading the product upload functionality. This could be due to:
                            </p>
                            <ul className="list-disc pl-5 text-gray-600 mb-4">
                                <li className="mb-2">A connection issue with the server</li>
                                <li className="mb-2">Your session may have expired</li>
                                <li>You might not have the required permissions</li>
                            </ul>
                            <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                <button onClick={() => window.location.reload()} 
                                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-all">
                                    Try Again
                                </button>
                                <button onClick={() => window.location.href = '/dashboard/admin'} 
                                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-all">
                                    Return to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                },
                {
                    path:"product",
                    element:<AdminPermission><ProductAdmin/></AdminPermission>
                },
                {
                    path:"bundle-admin",
                    element:<AdminPermission><BundleAdmin/></AdminPermission>
                },
                {
                    path:"orders-admin",
                    element:<AdminPermission><AdminOrderDashboard/></AdminPermission>
                },
                {
                    path:"user-management",
                    element:<AdminPermission><UserManagement/></AdminPermission>
                },
                {
                    path:"payment-management",
                    element:<AdminPermission><PaymentManagement/></AdminPermission>
                },
                {
                    path:"cancellation-management",
                    element:<AdminPermission><CancellationManagementPage/></AdminPermission>
                },
                {
                    path:"return-management",
                    element:<AdminPermission><AdminReturnManagement/></AdminPermission>
                },
                {
                    path:"custom-tshirt-admin",
                    element:<AdminPermission><CustomTshirtRequestsAdmin/></AdminPermission>
                },
                {
                    path:"cancellation-policy",
                    element:<AdminPermission><CancellationPolicyPage/></AdminPermission>
                },
                {
                    path:"admin/refund-management", // Admin refund management
                    element:<AdminPermission><RefundManagementPage/></AdminPermission>
                },
                {
                    path:"stock-management",
                    element:<AdminPermission><StockManagementPage/></AdminPermission>
                },
                {
                    path:"inventory/:productId",
                    element:<AdminPermission><InventoryManagement/></AdminPermission>
                },
                {
                    path:"inventory-management/:productId",
                    element:<AdminPermission><InventoryManagement/></AdminPermission>
                },

                // Add catch-all for dashboard subroutes
                {
                    path:"*",
                    element:<PageNotFound/>
                }
            ]
            },
            {
                path:"category/:category",
                element :<ProductListPage/>
            },{
                path:"product/:product",
                element :<ProductDisplayPage />
            },
            {
                path : 'cart',
                element : <CartMobile/>
            },
            {
                path:"checkout/bag",
                element: <BagPage/>
            },
            {
                path:"checkout/address",
                element: <AddressPage/>
            },
            {
                path:"checkout/payment",
                element: <PaymentPage/>
            },
            {
                path:"checkout",
                element: <BagPage/>
            },
            {
                path:"success",
                element : <Success/>
            },
            {
                path:"cancel",
                element : <Cancel/>
            },
            {
                path:"order-success",
                element : <OrderSuccessPage/>
            },
            {
                path:"delivery-charge-calculator",
                element : <DeliveryChargeCalculator/>
            },
            {
                path:"bundle-offers",
                element : <BundleOffers/>
            },
            {
                path:"bundle/:bundleId",
                element : <BundleDetail/>
            },
          
            // Add catch-all route for any invalid URLs - THIS MUST BE LAST
            {
                path:"*",
                element : <PageNotFound/>
            }
        ]
    }
])

export default router;