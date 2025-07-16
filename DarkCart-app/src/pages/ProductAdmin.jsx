import React from "react";
import SummaryApi from "../common/SummaryApi.js";
import { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import AxiosTostError from "../utils/AxiosTostError.js";
import Axios from "../utils/Axios.js";
import Loading from "../components/Loading.jsx";
import ProductCardAdmin from "../components/ProductCardAdmin.jsx";
import { IoSearchOutline } from "react-icons/io5";

const ProductAdmin = () => {
  const [productData, setProductData] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [totalPageCount, setTotalPageCount] = useState(1);
  const [filters, setFilters] = useState({
    gender: "",
    category: "",
    search: "",
  });
  const navigate = useNavigate();

  const genderOptions = [
    { value: "", label: "All Genders" },
    { value: "Men", label: "Men" },
    { value: "Women", label: "Women" },
    { value: "Kids", label: "Kids" },
  ];

  const fetchProductData = async () => {
    try {
      setLoading(true);
      const response = await Axios({
        ...SummaryApi.getProduct,
        data: {
          page: page,
          limit: 10,
          search: filters.search,
        },
      });
      const { data: responseData } = response;
      console.log(responseData);
      if (responseData.success) {
        setProductData(responseData.data);
        setTotalPageCount(responseData.totalPages);
      }
      console.log(page)
    } catch (error) {
      AxiosTostError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductData();
  }, [page]);

  const handleNext = () => {
    if (page !== totalPageCount) {
      setPage((preve) => preve + 1);
      // fetchProductData();
    }
  };

  const handlePrevious = () => {
    if (page > 1) {
      setPage((preve) => preve - 1);
      // fetchProductData();
    }
  };

  const handleOnChange = (e) => {
    const { value } = e.target;
    setFilters((prev) => ({ ...prev, search: value }));
    setPage(1);
  };

  useEffect(() => {
    let flag = true;
    const interval = setTimeout(() => {
      if (flag) {
        fetchProductData();
        flag = false;
      }
    }, 300);
    return () => {
      clearTimeout(interval);
    };
  }, [filters.search]);

  return (
    <section className="min-h-[75vh] max-h-[75vh] overflow-y-auto bg-gray-50">
      <div className="p-4 bg-white shadow-md flex items-center justify-between gap-4 sticky z-10 top-0 border-b border-gray-200">
        <h2 className="font-bold text-xl text-gray-900 font-serif">Products</h2>
        <div className="h-full min-w-24 max-w-56 w-full ml-auto bg-gray-50 px-4 flex items-center gap-3 py-2 rounded-md border border-gray-300 focus-within:border-black focus-within:bg-white transition-colors">
          <IoSearchOutline size={20} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search products..."
            className="h-full w-full outline-none bg-transparent text-gray-900 placeholder-gray-500"
            value={filters.search}
            onChange={handleOnChange}
          />
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <Loading />
        </div>
      )}

      <div className="p-4 bg-gray-50 grid">
        <div className="min-h-[55vh]">
          <div className="grid grid-cols-2 sm:items-center sm:justify-center md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 p-4">
            {productData.map((p, index) => {
              return (
                <ProductCardAdmin
                  key={p._id || index}
                  data={p}
                  fetchProductData={fetchProductData}
                />
              );
            })}
          </div>
        </div>

        <div className="flex justify-between items-center my-4 gap-3">
          <button
            onClick={handlePrevious}
            disabled={page === 1}
            className={`border px-4 py-2 rounded-md font-medium transition-colors ${
              page === 1
                ? "border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed"
                : "border-gray-300 text-gray-700 bg-white hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            Previous
          </button>

          <div className="flex-1 text-center bg-white border border-gray-300 py-2 rounded-md font-medium text-gray-900">
            {page} / {totalPageCount}
          </div>

          <button
            onClick={handleNext}
            disabled={page === totalPageCount}
            className={`border px-4 py-2 rounded-md font-medium transition-colors ${
              page === totalPageCount
                ? "border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed"
                : "border-gray-300 text-gray-700 bg-white hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProductAdmin;
