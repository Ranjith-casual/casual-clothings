import React, { useState, useEffect } from "react";
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
      const response = await fetch("https://countriesnow.space/api/v0.1/countries/positions");
      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        // Extract countries and place India at the top
        const allCountries = data.data.map((c) => ({ name: c.name, code: c.iso2 || "" }));
        const indiaCountry = allCountries.find(country => country.name === "India");
        const otherCountries = allCountries.filter(country => country.name !== "India");
        
        // Set India at the top followed by other countries
        if (indiaCountry) {
          setCountries([indiaCountry, ...otherCountries]);
        } else {
          setCountries(allCountries);
        }
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
    } finally {
      setIsLoadingCountries(false);
    }
  };

  const fetchStates = async (country) => {
    if (!country) return;

    setIsLoadingStates(true);
    setStates([]);
    setCities([]);
    setValue('state', '');
    setValue('city', '');

    try {
      const response = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country }),
      });

      const data = await response.json();
      if (data.data && data.data.states) {
        setStates(data.data.states);
      }
    } catch (error) {
      console.error("Error fetching states:", error);
    } finally {
      setIsLoadingStates(false);
    }
  };

  const fetchCities = async (country, state) => {
    if (!country || !state) return;

    setIsLoadingCities(true);
    setCities([]);
    setValue('city', '');

    try {
      const response = await fetch("https://countriesnow.space/api/v0.1/countries/state/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, state }),
      });

      const data = await response.json();
      if (data.data) {
        setCities(data.data);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
    } finally {
      setIsLoadingCities(false);
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
    <section className="bg-black/70 backdrop-blur-sm fixed top-0 left-0 right-0 bottom-0 z-50 overflow-auto h-screen flex items-start justify-center px-4 py-6 sm:py-12 font-poppins">
      <div className="bg-white p-6 sm:p-8 w-full max-w-xl mx-auto rounded-xl shadow-2xl relative border border-gray-100 animate-fadeIn">
        <button
          className="absolute top-4 right-6 text-gray-400 hover:text-gray-800 text-3xl transition-all hover:rotate-90 hover:scale-110 duration-300"
          onClick={close}
          aria-label="Close"
        >
          &times;
        </button>
        <div className="border-b border-gray-100 pb-4 mb-6">
          <h2 className="font-bold text-2xl md:text-2xl text-gray-900 font-sans mb-2 tracking-tight">Add New Address</h2>
          <p className="text-gray-600 text-sm md:text-base">Please fill in your delivery address details</p>
        </div>
        
        <form action="" className="mt-4 grid gap-5 sm:gap-6 font-sans" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <label htmlFor="addressline" className="font-medium text-gray-700 tracking-wide font-sans">Address Line:</label>
            <input
              type="text"
              id="addressline"
              className="border border-gray-300 bg-gray-50 p-3 rounded-md outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-200 transition-all shadow-sm font-sans"
              placeholder="Enter your street address"
              {...register("addressline",{required: true})}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="country" className="font-medium text-gray-700 tracking-wide">Country:</label>
            <div className="relative">
              <select
                id="country"
                className="border border-gray-300 bg-gray-50 p-3 rounded-md outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-200 transition-all shadow-sm appearance-none cursor-pointer w-full font-sans"
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
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <label htmlFor="state" className="font-medium text-gray-700 tracking-wide">State:</label>
            <div className="relative">
              <select
                id="state"
                className="border border-gray-300 bg-gray-50 p-3 rounded-md outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-200 transition-all shadow-sm w-full appearance-none cursor-pointer font-sans"
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
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <label htmlFor="city" className="font-medium text-gray-700 tracking-wide">City:</label>
            <div className="relative">
              <select
                id="city"
                className="border border-gray-300 bg-gray-50 p-3 rounded-md outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-200 transition-all shadow-sm w-full appearance-none cursor-pointer font-sans"
                {...register("city", { required: true })}
                disabled={!selectedState || isLoadingCities}
              >
                <option value="">-- Select City --</option>
                {isLoadingCities ? (
                  <option value="" disabled>Loading cities...</option>
                ) : (
                  cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="md:grid md:grid-cols-2 md:gap-6 space-y-5 md:space-y-0">
            <div className="grid gap-2">
              <label htmlFor="pincode" className="font-medium text-gray-700 tracking-wide">Pincode:</label>
              <div className="relative">
                <input
                  type="text"
                  id="pincode"
                  className="border border-gray-300 bg-gray-50 p-3 rounded-md outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-200 transition-all shadow-sm"
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
                  <p className="text-xs text-gray-600 mt-1 italic">* For India,6-digit pincode is required</p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="mobile" className="font-medium text-gray-700 tracking-wide font-sans">Mobile Number:</label>
              <div className="relative">
                <input
                  type="tel"
                  id="mobile"
                  className="border border-gray-300 bg-gray-50 p-3 rounded-md outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-200 transition-all shadow-sm font-sans"
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
                  <p className="text-xs text-gray-600 mt-1 italic">* For India, a 10-digit number is required</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="addIframe" className="font-medium text-gray-700 tracking-wide font-sans">
              Add Iframe:
              <span className="text-gray-500 text-sm ml-1 font-normal"> Go to Google Maps and copy the iframe embed code</span>
            </label>
            <input
              type="text"
              id="addIframe"
              className="border border-gray-300 bg-gray-50 p-3 rounded-md outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-200 transition-all shadow-sm font-sans"
              placeholder="Enter iframe URL (optional)"
              {...register("addIframe")}
            />
          </div>

          <button 
            type="submit" 
            className="bg-black hover:bg-gray-800 text-white w-full p-3.5 rounded-md mt-8 transition-all font-semibold tracking-wider text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-sans"
          >
            Add Address
          </button>
        </form>
      </div>
    </section>
  );
};

export default AddAddress;
