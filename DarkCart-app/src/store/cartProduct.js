import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    cart: [],
    selectedItems: [] // Track selected items for checkout
}

const cartSlice = createSlice({
    name: "cartItem",
    initialState: initialState,
    reducers: {
        handleAddItemCart: (state, action) => {
            state.cart = [...action.payload];
            // Auto-select all items when cart is updated, but preserve existing selections
            const currentItemIds = action.payload.map(item => item._id);
            
            // Keep only valid selections and add new items
            state.selectedItems = [
                ...state.selectedItems.filter(id => currentItemIds.includes(id)),
                ...currentItemIds.filter(id => !state.selectedItems.includes(id))
            ];
        },
        toggleItemSelection: (state, action) => {
            const itemId = action.payload;
            if (state.selectedItems.includes(itemId)) {
                state.selectedItems = state.selectedItems.filter(id => id !== itemId);
            } else {
                state.selectedItems.push(itemId);
            }
        },
        selectAllItems: (state) => {
            state.selectedItems = state.cart.map(item => item._id);
        },
        deselectAllItems: (state) => {
            state.selectedItems = [];
        },
        setSelectedItems: (state, action) => {
            state.selectedItems = action.payload;
        },
        // Remove items from selection when they're deleted
        removeFromSelection: (state, action) => {
            const itemId = action.payload;
            state.selectedItems = state.selectedItems.filter(id => id !== itemId);
        }
    }
})

export const { 
    handleAddItemCart, 
    toggleItemSelection, 
    selectAllItems, 
    deselectAllItems, 
    setSelectedItems,
    removeFromSelection 
} = cartSlice.actions;

export default cartSlice.reducer;