import { createSlice } from '@reduxjs/toolkit';

const initialValue = {
    wishlistItems: [],
    loading: false,
    error: null
};

const wishlistSlice = createSlice({
    name: 'wishlist',
    initialState: initialValue,
    reducers: {
        setWishlistItems: (state, action) => {
            state.wishlistItems = action.payload;
        },
        addWishlistItem: (state, action) => {
            // Check if item already exists in wishlist (handle both products and bundles)
            const existingItem = state.wishlistItems.find(item => {
                const itemId = item.productId?._id || item.bundleId?._id;
                const payloadId = action.payload.productId?._id || action.payload.bundleId?._id;
                return itemId === payloadId;
            });
            
            if (!existingItem) {
                state.wishlistItems.push(action.payload);
            }
        },
        removeWishlistItem: (state, action) => {
            state.wishlistItems = state.wishlistItems.filter(item => item._id !== action.payload);
        },
        clearWishlist: (state) => {
            state.wishlistItems = [];
        },
        setWishlistLoading: (state, action) => {
            state.loading = action.payload;
        },
        setWishlistError: (state, action) => {
            state.error = action.payload;
        }
    }
});

export const { 
    setWishlistItems, 
    addWishlistItem, 
    removeWishlistItem, 
    clearWishlist,
    setWishlistLoading,
    setWishlistError
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
