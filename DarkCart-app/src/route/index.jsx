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
import AdminPermision from "../layout/AdminPermission";
import DeliveryChargeCalculator from "../pages/test";
import BundleOffers from "../pages/BundleOffers";
import BundleDetail from "../pages/BundleDetail";
import SeasonalSale from "../pages/SeasonalSale";
import BundleAdmin from "../pages/BundleAdmin";
import AdminDashboard from "../pages/AdminDashboard";
import UserManagement from "../pages/UserManagement";
import PaymentManagement from "../pages/PaymentManagement";
import CancellationManagementPage from "../pages/CancellationManagementPage";
import CancellationPolicyPage from "../pages/CancellationPolicyPage";

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
                path:"/lookbook",
                element : <Lookbook/>
            },
            {
                path:"/sustainability",
                element : <Sustainability/>
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
            },{
                path:"/user-menu-mobile",
                element : <UserMenuMobile/>
            },{
                path:"/dashboard",
                element:<Dashboard/>,
                children :[{
                    path:"profile",
                    element:<Profile/>
                },{
                    path:"myorders",
                    element:<MyOrders/>
                },{
                    path:"address",
                    element:<Address/>
                },{
                    path:"wishlist",
                    element:<WishlistPage/>
                },
                {
                    path:"admin",
                    element:<AdminPermision><AdminDashboard/></AdminPermision>
                },
                {
                    path:"category",
                    element:<AdminPermision><CategoryPage/></AdminPermision>
                },
                {
                    path:"upload-product",
                    element:<AdminPermision><UploadProduct/></AdminPermision>
                },
                {
                    path:"product",
                    element:<AdminPermision><ProductAdmin/></AdminPermision>
                },
                {
                    path:"bundle-admin",
                    element:<AdminPermision><BundleAdmin/></AdminPermision>
                },
                {
                    path:"orders-admin",
                    element:<AdminPermision><AdminOrderDashboard/></AdminPermision>
                },
                {
                    path:"user-management",
                    element:<AdminPermision><UserManagement/></AdminPermision>
                },
                {
                    path:"payment-management",
                    element:<AdminPermision><PaymentManagement/></AdminPermision>
                },
                {
                    path:"cancellation-management",
                    element:<AdminPermision><CancellationManagementPage/></AdminPermision>
                },
                {
                    path:"cancellation-policy",
                    element:<AdminPermision><CancellationPolicyPage/></AdminPermision>
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
            {
                path:"seasonal-sale",
                element : <SeasonalSale/>
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