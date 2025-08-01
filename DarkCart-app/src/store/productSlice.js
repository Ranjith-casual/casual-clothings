import { createSlice } from "@reduxjs/toolkit";

const initialValue = {
    allCategory : [],
    product : [],
    loadingCategory: false
}

const productSlice = createSlice({
    name : 'product',
    initialState : initialValue,
    reducers : {
        setAllCategory : (state,action)=>{
            state.allCategory = [...action.payload]
        },
        setLoadingCategory : (state,action)=>{
            state.loadingCategory = action.payload
        },
    }
})

export const  { setAllCategory, setLoadingCategory } = productSlice.actions;

export default productSlice.reducer;
