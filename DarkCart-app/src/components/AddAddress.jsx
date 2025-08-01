import { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import { useForm } from "react-hook-form";
import Axios from "../utils/Axios"; 
import SummaryApi from "../common/SummaryApi.js";
import {toast} from "react-hot-toast"
import AxiosToastError from "../utils/AxiosTostError.js";
import { useGlobalContext } from "../provider/GlobalProvider.jsx";

const AddAddress = ({ close }) => {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  const {fetchAddress} = useGlobalContext();
  
  // Add state for countries, states, cities
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  
  const selectedCountry = watch('country');
  const selectedState = watch('state');

  const onSubmit = async(data) => {
    try {
      // Field validation
      if (!data.addressline) {
        toast.error("Please enter your address");
        return;
      }
      if (!data.country) {
        toast.error("Please select your country");
        return;
      }
      if (!data.state) {
        toast.error("Please select your state");
        return;
      }
      if (!data.city) {
        toast.error("Please select your city");
        return;
      }
      if (!data.pincode) {
        toast.error("Please enter your pincode");
        return;
      }
      if (!data.mobile) {
        toast.error("Please enter your mobile number");
        return;
      }
      
      // Validate mobile number for India
      if (data.country === "India" && !/^\d{10}$/.test(data.mobile)) {
        toast.error("please enter a valid 10-digit mobile number");
        return;
      }
      
      // Validate pincode for India
      if (data.country === "India" && !/^\d{6}$/.test(data.pincode)) {
        toast.error("For India, please enter a valid 6-digit pincode");
        return;
      }

      const response = await Axios({
        ...SummaryApi.createAddress,
        data: {
          address_line: data.addressline,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          country: data.country,
          mobile: data.mobile,
          addIframe: data.addIframe
        }
      })

      const {data:responseData} = response;

      if (responseData.success) {
        toast.success(responseData.message);
        if(close) {
          close();
          reset(); // Reset the form fields after successful submission
          fetchAddress(); // Fetch the updated address list
        }
      }
    } catch (error) {
      AxiosToastError(error);
    }
  };

  // Functions to fetch countries, states and cities
  const fetchCountries = async () => {
    setIsLoadingCountries(true);
    try {
      console.log("🇮🇳 Loading India as default country...");
      
      // Set only India as the country
      const indiaCountry = [{ name: "India", code: "IN" }];
      setCountries(indiaCountry);
      
      console.log("✅ India loaded as default country");
      toast.success("Country set to India");
    } catch (error) {
      console.error("💥 Error setting country:", error);
    } finally {
      setIsLoadingCountries(false);
    }
  };

  const fetchStates = async (country) => {
    if (!country || country !== "India") {
      console.log("⚠️ Only India is supported for states");
      return;
    }

    console.log("🏛️ Loading Indian states...");
    setIsLoadingStates(true);
    setStates([]);
    setCities([]);
    setValue('state', '');
    setValue('city', '');

    try {
      const response = await Axios({
        ...SummaryApi.getIndianStates
      });

      if (response.data.success) {
        setStates(response.data.data);
        console.log("✅ Indian states loaded:", response.data.data.length);
        toast.success(`Loaded ${response.data.data.length} Indian states`);
      } else {
        throw new Error(response.data.message || "Failed to load states");
      }
    } catch (error) {
      console.error("💥 Error loading states:", error);
      toast.error("Failed to load states");
      
      // Fallback to static data if API fails
      const fallbackStates = [
        { name: "Andhra Pradesh" }, { name: "Arunachal Pradesh" }, { name: "Assam" }, 
        { name: "Bihar" }, { name: "Chhattisgarh" }, { name: "Goa" }, { name: "Gujarat" },
        { name: "Haryana" }, { name: "Himachal Pradesh" }, { name: "Jharkhand" },
        { name: "Karnataka" }, { name: "Kerala" }, { name: "Madhya Pradesh" },
        { name: "Maharashtra" }, { name: "Manipur" }, { name: "Meghalaya" },
        { name: "Mizoram" }, { name: "Nagaland" }, { name: "Odisha" }, { name: "Punjab" },
        { name: "Rajasthan" }, { name: "Sikkim" }, { name: "Tamil Nadu" }, { name: "Telangana" },
        { name: "Tripura" }, { name: "Uttar Pradesh" }, { name: "Uttarakhand" }, { name: "West Bengal" },
        { name: "Andaman and Nicobar Islands" }, { name: "Chandigarh" },
        { name: "Dadra and Nagar Haveli and Daman and Diu" }, { name: "Delhi" },
        { name: "Jammu and Kashmir" }, { name: "Ladakh" }, { name: "Lakshadweep" }, { name: "Puducherry" }
      ];
      setStates(fallbackStates);
      console.log("🔄 Using fallback state data");
    } finally {
      setIsLoadingStates(false);
      console.log("🏁 Finished loading states");
    }
  };

  const fetchCities = async (country, state) => {
    if (!country || !state || country !== "India") {
      console.log("⚠️ Only Indian states are supported for districts");
      return;
    }

    console.log("🏙️ Loading districts for state:", state);
    setIsLoadingCities(true);
    setCities([]);
    setValue('city', '');

    try {
      const response = await Axios({
        url: `${SummaryApi.getDistrictsByState.url}/${encodeURIComponent(state)}/districts`,
        method: SummaryApi.getDistrictsByState.method
      });

      if (response.data.success) {
        const districts = response.data.data.districts.map(district => ({ name: district.name }));
        setCities(districts);
        console.log("✅ Districts loaded for", state, ":", districts.length);
        toast.success(`Loaded ${districts.length} districts for ${state}`);
      } else {
        throw new Error(response.data.message || "Failed to load districts");
      }
    } catch (error) {
      console.error("💥 Error loading districts:", error);
      toast.error("Failed to load districts");
      
      // Fallback message
      setCities([{ name: "Please select a major city or district name manually" }]);
    } finally {
      setIsLoadingCities(false);
      console.log("🏁 Finished loading districts");
    }
  };

  // Fetch countries when component mounts
  useEffect(() => {
    fetchCountries();
  }, []);

  // Fetch states when country changes
  useEffect(() => {
    if (selectedCountry) {
      fetchStates(selectedCountry);
    }
  }, [selectedCountry]);

  // Fetch cities when state changes
  useEffect(() => {
    if (selectedCountry && selectedState) {
      fetchCities(selectedCountry, selectedState);
    }
  }, [selectedCountry, selectedState]);

  return (
    <section className="bg-black/50 fixed top-0 left-0 right-0 bottom-0 z-50 overflow-auto h-screen flex items-center justify-center px-3 py-3 sm:py-8">
      <div className="bg-white p-4 sm:p-6 w-full max-w-md mx-auto rounded-lg shadow-xl relative border border-gray-100 animate-fadeIn font-sans">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-800 transition-colors"
          onClick={close}
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="border-b border-gray-100 pb-3 mb-4">
          <h2 className="font-bold text-lg sm:text-xl text-gray-900 mb-1 tracking-wider">Add New Address</h2>
          <p className="text-gray-600 text-xs sm:text-sm tracking-wide">Please fill in your delivery address details</p>
        </div>
        
        <form action="" className="mt-2 grid gap-3 sm:gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-1.5">
            <label htmlFor="addressline" className="font-medium text-gray-700 tracking-wider text-xs sm:text-sm">Address Line:</label>
            <input
              type="text"
              id="addressline"
              className="border border-gray-300 bg-gray-50 p-2 sm:p-3 rounded-md outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black transition-all shadow-sm tracking-wide text-xs sm:text-sm"
              placeholder="Enter your street address"
              {...register("addressline",{required: true})}
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="country" className="font-medium text-gray-700 tracking-wider text-xs sm:text-sm">Country:</label>
            <div className="relative">
              <select
                id="country"
                className="border border-gray-300 bg-gray-50 p-2 sm:p-3 rounded-md outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black transition-all shadow-sm appearance-none cursor-pointer w-full tracking-wide text-xs sm:text-sm"
                {...register("country", { required: true })}
                disabled={isLoadingCountries}
              >
                <option value="">-- Select Country --</option>
                {isLoadingCountries ? (
                  <option value="" disabled>Loading countries...</option>
                ) : (
                  countries.map((country) => (
                    <option key={country.name} value={country.name}>
                      {country.name}
                    </option>
                  ))
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-3 w-3 sm:h-4 sm:w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="state" className="font-medium text-gray-700 tracking-wider text-xs sm:text-sm">State:</label>
            <div className="relative">
              <select
                id="state"
                className="border border-gray-300 bg-gray-50 p-2 sm:p-3 rounded-md outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black transition-all shadow-sm w-full appearance-none cursor-pointer tracking-wide text-xs sm:text-sm"
                {...register("state", { required: true })}
                disabled={!selectedCountry || isLoadingStates}
              >
                <option value="">-- Select State --</option>
                {isLoadingStates ? (
                  <option value="" disabled>Loading states...</option>
                ) : (
                  states.map((state) => (
                    <option key={state.name} value={state.name}>
                      {state.name}
                    </option>
                  ))
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-3 w-3 sm:h-4 sm:w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="city" className="font-medium text-gray-700 tracking-wider text-xs sm:text-sm">City:</label>
            <div className="relative">
              <select
                id="city"
                className="border border-gray-300 bg-gray-50 p-2 sm:p-3 rounded-md outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black transition-all shadow-sm w-full appearance-none cursor-pointer tracking-wide text-xs sm:text-sm"
                {...register("city", { required: true })}
                disabled={!selectedState || isLoadingCities}
              >
                <option value="">-- Select City --</option>
                {isLoadingCities ? (
                  <option value="" disabled>Loading cities...</option>
                ) : (
                  cities.map((city, index) => (
                    <option key={city.name || city || index} value={city.name || city}>
                      {city.name || city}
                    </option>
                  ))
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-3 w-3 sm:h-4 sm:w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-4 gap-3">
            <div className="grid gap-1.5">
              <label htmlFor="pincode" className="font-medium text-gray-700 tracking-wider text-xs sm:text-sm">Pincode:</label>
              <div className="relative">
                <input
                  type="text"
                  id="pincode"
                  className="border border-gray-300 bg-gray-50 p-2 sm:p-3 rounded-md outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black transition-all shadow-sm tracking-wide text-xs sm:text-sm"
                  placeholder={selectedCountry === "India" ? "Enter 6-digit pincode" : "Enter your pincode"}
                  {...register("pincode", {
                    required: true,
                    validate: value => {
                      if (selectedCountry === "India" && !/^\d{6}$/.test(value)) {
                        return "India requires a 6-digit pincode";
                      }
                      return true;
                    }
                  })}
                />
                {selectedCountry === "India" && (
                  <p className="text-xs text-gray-500 mt-1 italic tracking-wide text-[10px] sm:text-xs">* For India, 6-digit pincode is required</p>
                )}
              </div>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="mobile" className="font-medium text-gray-700 tracking-wider text-xs sm:text-sm">Mobile Number:</label>
              <div className="relative">
                <input
                  type="tel"
                  id="mobile"
                  className="border border-gray-300 bg-gray-50 p-2 sm:p-3 rounded-md outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black transition-all shadow-sm tracking-wide text-xs sm:text-sm"
                  placeholder={selectedCountry === "India" ? "Enter 10-digit mobile number" : "Enter your mobile number"}
                  {...register("mobile", { 
                    required: true,
                    validate: value => {
                      if (selectedCountry === "India" && !/^\d{10}$/.test(value)) {
                        return "India requires a 10-digit mobile number";
                      }
                      return true;
                    }
                  })}
                />
                {selectedCountry === "India" && (
                  <p className="text-xs text-gray-500 mt-1 italic tracking-wide text-[10px] sm:text-xs">* For India, a 10-digit number is required</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid gap-1.5">
            <label htmlFor="addIframe" className="font-medium text-gray-700 tracking-wider text-xs sm:text-sm">
              Add Iframe:
              <span className="text-gray-500 text-xs ml-1 font-normal tracking-wide"> Google Maps embed code (optional)</span>
            </label>
            <input
              type="text"
              id="addIframe"
              className="border border-gray-300 bg-gray-50 p-2 sm:p-3 rounded-md outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black transition-all shadow-sm tracking-wide text-xs sm:text-sm"
              placeholder="Enter iframe URL (optional)"
              {...register("addIframe")}
            />
          </div>

          <button 
            type="submit" 
            className="bg-black hover:bg-gray-800 text-white w-full p-2.5 sm:p-3 rounded-md mt-4 sm:mt-6 transition-all font-semibold tracking-wider text-sm sm:text-base shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-50"
          >
            Add Address
          </button>
        </form>
      </div>
    </section>
  );
};

AddAddress.propTypes = {
  close: PropTypes.func.isRequired
};

export default AddAddress;
