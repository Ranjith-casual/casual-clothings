import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import Axios from "../utils/Axios"; 
import SummaryApi from "../common/SummaryApi.js";
import {toast} from "react-hot-toast"
import AxiosToastError from "../utils/AxiosTostError.js";
import { useGlobalContext } from "../provider/GlobalProvider.jsx";

// CSS for animation
const modalStyles = `
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
`;

const modalAnimation = {
  overlay: {
    animation: 'fadeIn 0.3s ease-out',
  },
  content: {
    animation: 'slideIn 0.3s ease-out'
  }
};

const EditAddressData = ({ close, data }) => {
  // Add the styles to the document
  React.useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = modalStyles;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
        _id: data._id || "",
        userId : data.userId || "",
        address_line: data.address_line || "",
        city: data.city || "",
        state: data.state || "",
        pincode: data.pincode || "",
        country: data.country || "",
        mobile: data.mobile || ""
        }
  });
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
      if (!data.address_line) {
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
        toast.error("Please enter a valid 10-digit mobile number");
        return;
      }
      
      // Validate pincode for India
      if (data.country === "India" && !/^\d{6}$/.test(data.pincode)) {
        toast.error("For India, please enter a valid 6-digit pincode");
        return;
      }
      
      const response = await Axios({
        ...SummaryApi.editAddress,
        data: {
          ...data,
          _id: data._id,
          userId: data.userId,
          address_line: data.address_line,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          country: data.country,
          mobile: data.mobile
        }
      });

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
    
    // Don't reset state and city if we're loading for the initial country
    if (country !== data.country) {
      setCities([]);
      setValue('state', '');
      setValue('city', '');
    }

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
    
    // Don't reset city if we're loading for the initial state
    if (country !== data.country || state !== data.state) {
      setCities([]);
      setValue('city', '');
    }

    try {
      const response = await fetch("https://countriesnow.space/api/v0.1/countries/state/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, state }),
      });

      const responseData = await response.json();
      if (responseData.data) {
        setCities(responseData.data);
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

  // Fetch states when component mounts or country changes
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
  
  // Initial setup: fetch states and cities for the initial country and state
  useEffect(() => {
    if (data.country) {
      fetchStates(data.country);
      
      if (data.state) {
        fetchCities(data.country, data.state);
      }
    }
  }, []);

  return (
    <section 
      className="bg-black/50 fixed top-0 left-0 right-0 bottom-0 z-50 overflow-auto h-screen flex items-center justify-center px-4 py-8 md:py-12"
      style={modalAnimation.overlay}
    >
      <div 
        className="bg-white p-4 sm:p-6 w-full max-w-lg mx-auto rounded-lg shadow-xl relative font-sans transition-all duration-300 transform"
        style={modalAnimation.content}
      >
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-900 transition-colors"
          onClick={close}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <h2 className="font-semibold text-gray-900 text-lg sm:text-xl tracking-wide mb-1">Edit Address</h2>
        <p className="text-gray-500 text-sm tracking-wide mb-4">Update your delivery location details</p>
        <form action="" className="mt-2 grid gap-4 sm:gap-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <label htmlFor="addressline" className="font-medium text-gray-700 tracking-wide text-sm">Address Line:</label>
            <input
              type="text"
              id="addressline"
              className="border border-gray-300 bg-gray-50 p-3 rounded-md outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all font-sans tracking-wide text-sm"
              {...register("address_line",{required: true})}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="country" className="font-medium text-gray-700 tracking-wide text-sm">Country:</label>
            <div className="relative">
              <select
                id="country"
                className="border border-gray-300 bg-gray-50 p-3 rounded-md outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all w-full appearance-none font-sans tracking-wide text-sm"
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
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <label htmlFor="state" className="font-medium text-gray-700 tracking-wide text-sm">State:</label>
            <div className="relative">
              <select
                id="state"
                className="border border-gray-300 bg-gray-50 p-3 rounded-md outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all w-full appearance-none font-sans tracking-wide text-sm"
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
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <label htmlFor="city" className="font-medium text-gray-700 tracking-wide text-sm">City:</label>
            <div className="relative">
              <select
                id="city"
                className="border border-gray-300 bg-gray-50 p-3 rounded-md outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all w-full appearance-none font-sans tracking-wide text-sm"
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
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label htmlFor="pincode" className="font-medium text-gray-700 tracking-wide text-sm">Pincode:</label>
              <input
                type="text"
                id="pincode"
                className="border border-gray-300 bg-gray-50 p-3 rounded-md outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all font-sans tracking-wide text-sm"
                placeholder={selectedCountry === "India" ? "Enter 6-digit pincode" : "Enter your pincode"}
                {...register("pincode",{
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
                <p className="text-xs text-gray-600 mt-1 italic">* For India, 6-digit pincode is required</p>
              )}
            </div>

            <div className="grid gap-2">
              <label htmlFor="mobile" className="font-medium text-gray-700 tracking-wide text-sm">Mobile No:</label>
              <input
                type="tel"
                id="mobile"
                className="border border-gray-300 bg-gray-50 p-3 rounded-md outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all font-sans tracking-wide text-sm"
                placeholder={selectedCountry === "India" ? "Enter 10-digit mobile number" : "Enter your mobile number"}
                {...register("mobile",{
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

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-2 sm:col-span-2 mt-2">
              <button 
                type="submit" 
                className="bg-black text-white w-full p-3 rounded-md hover:bg-gray-800 transition-all duration-300 font-semibold tracking-wider text-sm transform hover:translate-y-[-1px] hover:shadow-md active:translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-50"
              >
                Update Address
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};

export default EditAddressData;
