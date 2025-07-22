import ProductModel from "../models/product.model.js";

// Create product with gender validation
export const createProductController = async (req, res) => {
    try {
        const { 
            name,
            image,
            gender,
            category,
            stock,
            price,
            discount,
            description,
            more_details,
            publish,
            // New size-related fields
            sizes,
            availableSizes 
        } = req.body;

        // Required field validation
        if (!name || !image[0] || !category[0] || !price || !description) {
            return res.status(400).json({
                message: "Enter required fields",
                error: true,
                success: false
            });
        }

        // Validate gender
        const validGenders = ['Men', 'Women', 'Kids'];
        if (gender && !validGenders.includes(gender)) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Invalid gender. Must be one of: Men, Women, Kids"
            });
        }
        
        // Process sizes data
        const sizeData = sizes || {};
        const validSizes = ['XS', 'S', 'M', 'L', 'XL'];
        const processedSizes = {
            XS: Number(sizeData.XS || 0),
            S: Number(sizeData.S || 0),
            M: Number(sizeData.M || 0),
            L: Number(sizeData.L || 0),
            XL: Number(sizeData.XL || 0)
        };
        
        // Calculate available sizes based on inventory
        const calculatedAvailableSizes = Object.entries(processedSizes)
            .filter(([_, quantity]) => quantity > 0)
            .map(([size, _]) => size);
        
        // Calculate total stock across all sizes
        const totalStock = Object.values(processedSizes).reduce((sum, qty) => sum + qty, 0);

        const product = new ProductModel({
            name,
            image,
            gender,
            category,
            // For backward compatibility, set stock to total of all sizes
            stock: totalStock,
            // Set individual size inventory
            sizes: processedSizes,
            // Set available sizes for filtering
            availableSizes: availableSizes || calculatedAvailableSizes,
            price: Number(price),
            discount: Number(discount),
            description,
            more_details,
            publish: publish !== undefined ? publish : true
        });

        const saveProduct = await product.save();

        return res.json({
            message: "Product Created Successfully",
            data: saveProduct,
            error: false,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// Get products with advanced filtering and search
export const getProductController = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            category, 
            gender, 
            search, 
            sortBy = 'createdAt', 
            sortOrder = 'desc' 
        } = req.body;
        
        console.log('Request body:', req.body);

        // Build filter object
        const filter = { publish: true };
        
        // Category filter
        if (category) {
            filter.category = { $in: [category] };
        }
        
        // Gender filter with validation
        if (gender) {
            const validGenders = ['Men', 'Women', 'Kids'];
            if (validGenders.includes(gender)) {
                filter.gender = gender;
            }
        }
        
        // Fixed search functionality
        if (search) {
            if (search.length <= 2) {
                // For short searches, use only regex
                const regexPattern = new RegExp(search, 'i');
                filter.$or = [
                    { name: { $regex: regexPattern } },
                    { description: { $regex: regexPattern } }
                ];
            } else {
                // For longer searches, try text search first
                try {
                    const textFilter = { 
                        ...filter, 
                        $text: { $search: search } 
                    };
                    
                    const skip = (page - 1) * limit;
                    const [products, total] = await Promise.all([
                        ProductModel.find(textFilter)
                            .populate('category')
                            .sort({ score: { $meta: "textScore" }, [sortBy]: sortOrder === 'desc' ? -1 : 1 })
                            .skip(skip)
                            .limit(limit),
                        ProductModel.countDocuments(textFilter)
                    ]);

                    if (products.length > 0) {
                        return res.json({
                            message: "Product data",
                            success: true,
                            error: false,
                            data: products,
                            totalCount: total,
                            totalPages: Math.ceil(total / limit),
                            totalNoPage: Math.ceil(total / limit),
                            currentPage: page,
                            total
                        });
                    }
                } catch (textError) {
                    console.log('Text search failed, using regex fallback');
                }
                
                // Fallback to regex
                const regexPattern = new RegExp(search, 'i');
                filter.$or = [
                    { name: { $regex: regexPattern } },
                    { description: { $regex: regexPattern } }
                ];
            }
        }

        const skip = (page - 1) * limit;

        // Execute queries
        const [products, total] = await Promise.all([
            ProductModel.find(filter)
                .populate('category')
                .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
                .skip(skip)
                .limit(limit),
            ProductModel.countDocuments(filter)
        ]);

        console.log('Total products found:', total);

        res.json({
            message: "Product data",
            success: true,
            error: false,
            data: products,
            totalCount: total,
            totalPages: Math.ceil(total / limit),
            totalNoPage: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        console.error('Product controller error:', error);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error fetching products",
            details: error.message
        });
    }
};

// Get products by category
export const getProductByCategory = async (request, response) => {
    try {
        const { id } = request.body;

        if (!id) {
            return response.status(400).json({
                message: "Category id required and should be array",
                error: true,
                success: false,
            });
        }

        const product = await ProductModel.find({
            category: id,
            publish: true
        }).limit(15).populate('category');

        return response.json({
            message: "category wise product",
            data: product,
            success: true,
            error: false,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// Get product details
export const getProductDetails = async (request, response) => {
    try {
        const { productId } = request.body;

        const product = await ProductModel.findOne({ _id: productId }).populate('category');

        return response.json({
            message: "product details",
            data: product,
            error: false,
            success: true
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// Update product with gender validation and size-specific inventory
export const updateProductDetails = async (request, response) => {
    try {
        const { _id, gender, sizes, availableSizes } = request.body;

        if (!_id) {
            return response.status(400).json({
                message: "provide product _id",
                error: true,
                success: false
            });
        }

        // Validate gender if provided
        if (gender) {
            const validGenders = ['Men', 'Women', 'Kids'];
            if (!validGenders.includes(gender)) {
                return response.status(400).json({
                    message: "Invalid gender. Must be one of: Men, Women, Kids",
                    error: true,
                    success: false
                });
            }
        }
        
        // Process size inventory if provided
        let updateData = { ...request.body };
        
        if (sizes) {
            // Ensure all size values are numbers
            const processedSizes = {
                XS: Number(sizes.XS || 0),
                S: Number(sizes.S || 0),
                M: Number(sizes.M || 0),
                L: Number(sizes.L || 0),
                XL: Number(sizes.XL || 0)
            };
            
            // Calculate total stock from size inventory
            const totalStock = Object.values(processedSizes).reduce((sum, qty) => sum + qty, 0);
            
            // Calculate available sizes based on inventory
            const calculatedAvailableSizes = Object.entries(processedSizes)
                .filter(([_, quantity]) => quantity > 0)
                .map(([size]) => size);
            
            // Update data with processed values
            updateData = {
                ...updateData,
                sizes: processedSizes,
                availableSizes: availableSizes || calculatedAvailableSizes,
                stock: totalStock // Update legacy stock field for backward compatibility
            };
        }

        const updateProduct = await ProductModel.updateOne({ _id: _id }, updateData);

        return response.json({
            message: "updated successfully",
            data: updateProduct,
            error: false,
            success: true
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// Delete product
export const deleteProductDetails = async (request, response) => {
    try {
        const { _id } = request.body;

        if (!_id) {
            return response.status(400).json({
                message: "provide _id ",
                error: true,
                success: false
            });
        }

        const deleteProduct = await ProductModel.deleteOne({ _id: _id });

        return response.json({
            message: "Delete successfully",
            error: false,
            success: true,
            data: deleteProduct
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// Enhanced search product with filters
export const searchProduct = async (request, response) => {
    try {
        let { search, page = 1, limit = 12, gender } = request.body;
        
        // Build base query
        let baseQuery = { publish: true };

        // Add gender filter
        if (gender) {
            const validGenders = ['Men', 'Women', 'Kids'];
            if (validGenders.includes(gender)) {
                baseQuery.gender = gender;
            }
        }

        let finalQuery = baseQuery;

        // Handle search with different strategies
        if (search) {
            const searchTerm = search.trim();
            
            if (searchTerm.length >= 3) {
                // For longer terms, use MongoDB text search
                finalQuery = {
                    ...baseQuery,
                    $text: { $search: searchTerm }
                };
            } else {
                // For short terms, use regex search
                const regexPattern = new RegExp(searchTerm, 'i');
                finalQuery = {
                    ...baseQuery,
                    $or: [
                        { name: { $regex: regexPattern } },
                        { description: { $regex: regexPattern } }
                    ]
                };
            }
        }

        console.log('Final search query:', JSON.stringify(finalQuery, null, 2));
        
        const skip = (page - 1) * limit;

        // Build sort object
        let sortOption = { createdAt: -1 };
        
        // Add text score sorting if using text search
        if (search && search.length >= 3) {
            sortOption = { score: { $meta: "textScore" }, createdAt: -1 };
        }

        const [data, totalCount] = await Promise.all([
            ProductModel.find(finalQuery)
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .populate('category'),
            ProductModel.countDocuments(finalQuery)
        ]);

        console.log(`Search results: ${data.length} products found`);

        return response.json({
            message: "Search Product data",
            error: false,
            success: true,
            totalCount: totalCount,
            totalNoPage: Math.ceil(totalCount / limit),
            data: data,
            searchTerm: search,
            searchType: search && search.length >= 3 ? 'text' : 'regex',
            appliedFilters: {
                gender: gender || null
            }
        });

    } catch (error) {
        console.error('Search error:', error);
        
        // Fallback to basic search
        try {
            let { search, page = 1, limit = 12, gender } = request.body;
            
            let fallbackQuery = { publish: true };
            
            if (gender) {
                const validGenders = ['Men', 'Women', 'Kids'];
                if (validGenders.includes(gender)) {
                    fallbackQuery.gender = gender;
                }
            }
            
            if (search) {
                const regexPattern = new RegExp(search, 'i');
                fallbackQuery.$or = [
                    { name: { $regex: regexPattern } },
                    { description: { $regex: regexPattern } }
                ];
            }
            
            const skip = (page - 1) * limit;
            
            const [data, totalCount] = await Promise.all([
                ProductModel.find(fallbackQuery)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('category'),
                ProductModel.countDocuments(fallbackQuery)
            ]);

            return response.json({
                message: "Search Product data (fallback)",
                error: false,
                success: true,
                totalCount: totalCount,
                totalNoPage: Math.ceil(totalCount / limit),
                data: data,
                searchType: 'regex-fallback'
            });
            
        } catch (fallbackError) {
            return response.status(500).json({
                message: fallbackError.message || error.message,
                error: true,
                success: false
            });
        }
    }
};

// Alternative search implementation that avoids text index conflicts
export const searchProductAlternative = async (request, response) => {
    try {
        let { search, page = 1, limit = 10, gender, category } = request.body;
        
        // Build base query
        let baseQuery = { publish: true };

        // Add gender filter
        if (gender) {
            const validGenders = ['Men', 'Women', 'Kids'];
            if (validGenders.includes(gender)) {
                baseQuery.gender = gender;
            }
        }

        // Add category filter
        if (category) {
            baseQuery.category = { $in: [category] };
        }

        let finalQuery = baseQuery;

        // Handle search with different strategies
        if (search) {
            const searchTerm = search.trim();
            
            if (searchTerm.length >= 3) {
                // For longer terms, use MongoDB text search
                finalQuery = {
                    ...baseQuery,
                    $text: { $search: searchTerm }
                };
            } else {
                // For short terms, use regex search
                const regexPattern = new RegExp(searchTerm, 'i');
                finalQuery = {
                    ...baseQuery,
                    $or: [
                        { name: { $regex: regexPattern } },
                        { description: { $regex: regexPattern } }
                    ]
                };
            }
        }

        console.log('Final search query:', JSON.stringify(finalQuery, null, 2));
        
        const skip = (page - 1) * limit;

        // Execute search
        let sortOption = { createdAt: -1 };
        
        // Add text score sorting if using text search
        if (search && search.length >= 3) {
            sortOption = { score: { $meta: "textScore" }, createdAt: -1 };
        }

        const [data, totalCount] = await Promise.all([
            ProductModel.find(finalQuery)
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .populate('category'),
            ProductModel.countDocuments(finalQuery)
        ]);

        console.log(`Search results: ${data.length} products found`);

        return response.json({
            message: "Search Product data",
            error: false,
            success: true,
            totalCount: totalCount,
            totalNoPage: Math.ceil(totalCount / limit),
            data: data,
            searchTerm: search,
            searchType: search && search.length >= 3 ? 'text' : 'regex'
        });

    } catch (error) {
        console.error('Search error:', error);
        
        // If search fails, try a fallback regex-only search
        try {
            let { search, page = 1, limit = 10, gender, category } = request.body;
            
            let fallbackQuery = { publish: true };
            
            if (gender) {
                const validGenders = ['Men', 'Women', 'Kids'];
                if (validGenders.includes(gender)) {
                    fallbackQuery.gender = gender;
                }
            }
            
            if (category) {
                fallbackQuery.category = { $in: [category] };
            }
            
            if (search) {
                const regexPattern = new RegExp(search, 'i');
                fallbackQuery.$or = [
                    { name: { $regex: regexPattern } },
                    { description: { $regex: regexPattern } }
                ];
            }
            
            const skip = (page - 1) * limit;
            
            const [data, totalCount] = await Promise.all([
                ProductModel.find(fallbackQuery)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('category'),
                ProductModel.countDocuments(fallbackQuery)
            ]);

            return response.json({
                message: "Search Product data (fallback)",
                error: false,
                success: true,
                totalCount: totalCount,
                totalNoPage: Math.ceil(totalCount / limit),
                data: data,
                searchType: 'regex-fallback'
            });
            
        } catch (fallbackError) {
            return response.status(500).json({
                message: fallbackError.message || error.message,
                error: true,
                success: false
            });
        }
    }
};

// Get all products for admin (including unpublished)
export const getAllProductsAdmin = async (request, response) => {
    try {
        let { page = 1, limit = 10, search, gender, category, publish } = request.body;

        // Build filter object
        const filter = {};

        // Filter by publish status
        if (publish !== undefined) {
            filter.publish = publish;
        }

        // Gender filter
        if (gender) {
            const validGenders = ['Men', 'Women', 'Kids'];
            if (validGenders.includes(gender)) {
                filter.gender = gender;
            }
        }

        // Category filter
        if (category) {
            filter.category = { $in: [category] };
        }

        // Search filter
        if (search) {
            if (search.length === 1) {
                const regexPattern = new RegExp(search, 'i');
                filter.$or = [
                    { name: { $regex: regexPattern } },
                    { description: { $regex: regexPattern } }
                ];
            } else {
                filter.$or = [
                    { $text: { $search: search } },
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }
        }

        const skip = (page - 1) * limit;

        const [data, totalCount] = await Promise.all([
            ProductModel.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('category'),
            ProductModel.countDocuments(filter)
        ]);

        return response.json({
            message: "All products data for admin",
            error: false,
            success: true,
            totalCount: totalCount,
            totalNoPage: Math.ceil(totalCount / limit),
            data: data
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};