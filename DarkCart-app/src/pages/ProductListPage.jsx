import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/CardProduct';
import ProductFilter from '../components/ProductFilter';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';

const ProductListPage = () => {
    const { category } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        gender: searchParams.get('gender') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        search: searchParams.get('search') || ''
    });

    const handleFilterChange = (filterType, value) => {
        if (filterType === 'clear') {
            setFilters({
                gender: '',
                minPrice: '',
                maxPrice: '',
                search: ''
            });
            setSearchParams({});
            return;
        }

        const newFilters = { ...filters, [filterType]: value };
        setFilters(newFilters);
        
        // Update URL params
        const params = new URLSearchParams();
        Object.entries(newFilters).forEach(([key, val]) => {
            if (val) params.set(key, val);
        });
        if (category) params.set('category', category);
        setSearchParams(params);
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            // Extract category ID from the URL parameter
            const categoryId = category ? category.split('-')[category.split('-').length - 1] : null;
            
            console.log('Category:', category);
            console.log('Category ID:', categoryId);
            console.log('Current filters:', filters);

            // Build the request data object
            const requestData = {
                limit: 100, // Set a reasonable limit
                page: 1,    // Start from page 1
            };

            // Add filters to request data
            if (filters.gender) {
                requestData.gender = filters.gender;
            }
            
            if (categoryId) {
                requestData.category = categoryId;
            }
            
            if (filters.search) {
                requestData.search = filters.search;
            }

            console.log('Request data:', requestData);
            
            const response = await Axios({
                ...SummaryApi.getProduct,
                data: requestData
            });

            const { data: responseData } = response;
            console.log('API Response:', responseData);
            
            if (responseData.success) {
                let filteredProducts = responseData.data;
                console.log('Products from API:', filteredProducts);
                
                // Apply price filter on frontend
                if (filters.minPrice || filters.maxPrice) {
                    const originalCount = filteredProducts.length;
                    filteredProducts = filteredProducts.filter(product => {
                        const price = product.discount > 0 
                            ? product.price - (product.price * product.discount / 100)
                            : product.price;
                        
                        if (filters.minPrice && price < parseFloat(filters.minPrice)) return false;
                        if (filters.maxPrice && price > parseFloat(filters.maxPrice)) return false;
                        return true;
                    });
                    console.log(`Price filter applied: ${originalCount} -> ${filteredProducts.length} products`);
                }
                
                console.log('Final filtered products:', filteredProducts);
                setProducts(filteredProducts);
            } else {
                console.error('API returned error:', responseData.message);
                setProducts([]);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    // Update useEffect to include price filters
    useEffect(() => {
        fetchProducts();
    }, [category, filters.gender, filters.search, filters.minPrice, filters.maxPrice]);

    // Add useEffect to sync URL params with filter state
    useEffect(() => {
        setFilters({
            gender: searchParams.get('gender') || '',
            minPrice: searchParams.get('minPrice') || '',
            maxPrice: searchParams.get('maxPrice') || '',
            search: searchParams.get('search') || ''
        });
        console.log("Products : ",products)
    }, [searchParams]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Filters Sidebar */}
                <div className="lg:col-span-1">
                    <ProductFilter 
                        filters={filters} 
                        onFilterChange={handleFilterChange} 
                    />
                </div>
                
                {/* Products Grid */}
                <div className="lg:col-span-3">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {category ? `Products` : 'All Products'}
                            {filters.gender && ` for ${filters.gender}`}
                        </h1>
                        <span className="text-gray-500">
                            {products.length} product{products.length !== 1 ? 's' : ''} found
                        </span>
                    </div>
                    
                    {/* Debug info - remove in production
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mb-4 p-4 bg-gray-100 rounded-lg text-sm">
                            <strong>Debug Info:</strong>
                            <br />Category: {category}
                            <br />Filters: {JSON.stringify(filters)}
                            <br />Products count: {products.length}
                            <br />Loading: {loading.toString()}
                        </div>
                    )} */}
                    
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, index) => (
                                <div key={index} className="bg-gray-200 animate-pulse rounded-lg h-64"></div>
                            ))}
                        </div>
                    ) : products.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map(product => (
                                <ProductCard data={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="mb-4">
                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                            </div>
                            <p className="text-gray-500 text-lg font-medium">No products found</p>
                            <p className="text-gray-400 mt-2">
                                {category ? `No products found in "${category.replace(/-/g, ' ')}" category` : 'No products available'}
                                {filters.gender && ` for ${filters.gender}`}
                            </p>
                            <p className="text-gray-400 mt-1">Try adjusting your filters or search criteria</p>
                            
                            {/* Clear filters button */}
                            {(filters.gender || filters.minPrice || filters.maxPrice || filters.search) && (
                                <button
                                    onClick={() => handleFilterChange('clear')}
                                    className="mt-4 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                                >
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductListPage;