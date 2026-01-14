import { createSlice } from "@reduxjs/toolkit";

const initialValue = {
    _id: "",
    name: "",
    email: "",
    avatar : "",
    mobile : "",
    verify_email : "",
    last_login_date : "", 
    status : "",
    address_details : [],
    shopping_cart : [],
    orderHistory : [],
    role : "",
    token: "", // Add token to store authentication state
}

const userSlice = createSlice({
    name: "user",
    initialState : initialValue,
    reducers: {
        setUserDetails: (state, action) => {
            state._id = action.payload?._id;
            state.name = action.payload?.name;
            state.email = action.payload?.email;
            state.avatar = action.payload?.avatar;
            state.mobile = action.payload?.mobile;
            state.verify_email = action.payload?.verify_email;
            state.last_login_date = action.payload?.last_login_date;
            state.status = action.payload?.status;
            state.address_details = action.payload?.address_details;
            state.shopping_cart = action.payload?.shopping_cart;
            state.orderHistory = action.payload?.orderHistory;
            state.role = action.payload?.role;
            
            // Handle token from various sources
            const incomingToken = action.payload?.token || action.payload?.accessToken;
            const existingToken = localStorage.getItem("accessToken");
            
            // Save token to Redux state
            state.token = incomingToken || existingToken;
            
            // For compatibility between systems:
            // If we have a new token from the payload, update both storage formats
            if (incomingToken) {
                localStorage.setItem("token", incomingToken);
                localStorage.setItem("accessToken", incomingToken);
                console.log("Token saved to both localStorage formats from Redux");
            } 
            // If we don't have a new token but have an existing accessToken, ensure token is set
            else if (existingToken) {
                localStorage.setItem("token", existingToken);
                console.log("Existing accessToken synchronized to token format");
            }
        },
        updateAvatar: (state,action)=>{
            state.avatar = action.payload; 
        }
        ,
        logout : (state,action)=>{
            state._id = "";
            state.name = "";
            state.email = "";
            state.avatar = "";
            state.mobile = "";
            state.verify_email = "";
            state.last_login_date = "";
            state.status = "";
            state.address_details = [];
            state.shopping_cart = [];
            state.orderHistory = [];
            state.role = "";
            state.token = ""; // Clear the token in Redux state
            
            // Remove all token variations from localStorage on logout
            localStorage.removeItem("token");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("userSession");
            localStorage.removeItem("userId");
            console.log("All tokens removed from localStorage during logout");
        }
    }
})

export const {setUserDetails,logout,updateAvatar} = userSlice.actions;

// Helper function to get authentication headers for API calls
export const getAuthHeader = () => {
    try {
        // Try to get token from Redux store first (if available)
        // If not available in Redux or not using Redux, fall back to localStorage
        // Check for accessToken (used in your system) first, then fall back to token
        const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
        
        if (!token) {
            console.warn("No authentication token found in localStorage");
            return {};
        }
        
        return { Authorization: `Bearer ${token}` };
    } catch (error) {
        console.error("Error getting authentication header:", error);
        return {};
    }
};

export default userSlice.reducer;
