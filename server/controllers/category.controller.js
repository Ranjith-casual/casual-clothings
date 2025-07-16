import CategoryModel from "../models/category.model.js";
import productModel from "../models/product.model.js";

export const AddCategoryController = async(request,response)=>{
    try{
        const {name,image}= request.body
        if(!name|| !image){
            return response.json({
                message:"All fields are required",
                error:true,
                success:false
            })
        }
        const addCategory = CategoryModel({
            name,       
            image
        })
        const saveCategory = await addCategory.save()
        if(!saveCategory)
        {
            return response.status(400).json({
                message:"Category not added",
                error:true,
                success:false
            })
        }
        return response.status(201).json({
            message:"Category added successfully",
            data:saveCategory,
            error:false,
            success:true
        })
    }
    catch(error){
        return response.status(500).json({
            message: error.message || error,
            error:true,
            success: false
        });
    }
}

// Get all categories
export const getCategoryController = async (req, res) => {
    try {
        const categories = await CategoryModel.find({})
            .sort({ createdAt: -1 });

        return res.json({
            message: "Categories fetched successfully",
            data: categories,
            success: true,
            error: false
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// Get category by ID
export const getCategoryByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await CategoryModel.findById(id);

        if (!category) {
            return res.status(404).json({
                message: "Category not found",
                error: true,
                success: false
            });
        }

        return res.json({
            message: "Category fetched successfully",
            data: category,
            success: true,
            error: false
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export const updateCategoryController = async(request,response)=>{
    try {
        const { _id ,name, image } = request.body 

        const update = await CategoryModel.updateOne({
            _id : _id
        },{
           name, 
           image 
        })

        return response.json({
            message : "Updated Category",
            success : true,
            error : false,
            data : update
        })
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export const deleteCategoryController = async(request,response)=>{
    try {
        const { _id } = request.body 

        const checkProduct = await productModel.find({
            category : {
                "$in" : [ _id ]
            }
        }).countDocuments()

        if(checkProduct > 0){
            return response.status(400).json({
                message : "Category already in use can't delete",
                error : true,
                success : false
            })
        }

        const deleteCategory = await CategoryModel.deleteOne({ _id : _id})

        return response.json({
            message : "Delete category successfully",
            data : deleteCategory,
            error : false,
            success : true
        })

    } catch (error) {
       return response.status(500).json({
            message : error.message || error,
            success : false,
            error : true
       }) 
    }
}