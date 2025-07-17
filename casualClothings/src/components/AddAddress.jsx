import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import Axios from "../utils/Axios"; 
import SummaryApi from "../common/SummaryApi.js";
import {toast} from "react-hot-toast"
import AxiosToastError from "../utils/AxiosTostError.js";
import { useGlobalContext } from "../provider/GlobalProvider.jsx";

const AddAddress = ({ close }) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm();
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
        setCountries(data.data.map((c) => ({ name: c.name, code: c.iso2 || "" })));
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
    <section className="bg-black/70 backdrop-blur-sm fixed top-0 left-0 right-0 bottom-0 z-50 overflow-auto h-screen">
      <div className="bg-white p-8 w-full max-w-lg mt-10 mx-auto rounded-lg shadow-xl relative border border-gray-100">
        <button
          className="absolute top-4 right-6 text-gray-400 hover:text-gray-800 text-3xl transition-colors"
          onClick={close}
        >
          &times;
        </button>
        <h2 className="font-bold text-xl text-gray-900 font-serif mb-2">Add New Address</h2>
        <p className="text-gray-600 text-sm mb-6">Please fill in your delivery address details</p>
        
        <form action="" className="mt-4 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <label htmlFor="addressline" className="font-medium text-gray-700">Address Line:</label>
            <input
              type="text"
              id="addressline"
              className="border border-gray-300 bg-gray-50 p-3 rounded-md outline-none focus:border-black focus:bg-white transition-colors"
              placeholder="Enter your street address"
              {...register("addressline",{required: true})}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="country" className="font-medium text-gray-700">Country:</label>
            <select
              id="country"
              className="border border-gray-300 bg-gray-50 p-3 rounded-md outline-none focus:border-black focus:bg-white transition-colors"
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
          </div>

          <div className="grid gap-2">
            <label htmlFor="state" className="font-medium text-gray-700">State:</label>
            <select
              id="state"
              className="border border-gray-300 bg-gray-50 p-3 rounded-md outline-none focus:border-black focus:bg-white transition-colors"
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
          </div>

          <div className="grid gap-2">
            <label htmlFor="city" className="font-medium text-gray-700">City:</label>
            <select
              id="city"
              className="border border-gray-300 bg-gray-50 p-3 rounded-md outline-none focus:border-black focus:bg-white transition-colors"
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
          </div>

          <div className="grid gap-2">
            <label htmlFor="pincode" className="font-medium text-gray-700">Pincode:</label>
            <input
              type="text"
              id="pincode"
              className="border border-gray-300 bg-gray-50 p-3 rounded-md outline-none focus:border-black focus:bg-white transition-colors"
              placeholder="Enter your pincode"
              {...register("pincode",{required: true})}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="mobile" className="font-medium text-gray-700">Mobile Number:</label>
            <input
              type="text"
              id="mobile"
              className="border border-gray-300 bg-gray-50 p-3 rounded-md outline-none focus:border-black focus:bg-white transition-colors"
              placeholder="Enter your mobile number"
              {...register("mobile",{required: true})}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="addIframe" className="font-medium text-gray-700">Add Iframe:<span className="text-gray-500"> Go to google map and copy the iframe embed code(delivery address)</span></label>
            <input
              type="text"
              id="addIframe"
              className="border border-gray-300 bg-gray-50 p-3 rounded-md outline-none focus:border-black focus:bg-white transition-colors"
              placeholder="Enter iframe URL (optional)"
              {...register("addIframe")}
            />
          </div>

          <button type="submit" className="bg-black hover:bg-gray-800 text-white w-full p-3 rounded-md mt-6 transition-colors font-semibold tracking-wide">
            Add Address
          </button>
        </form>
      </div>
    </section>
  );
};

export default AddAddress;
