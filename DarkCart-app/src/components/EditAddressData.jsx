import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import Axios from "../utils/Axios"; 
import SummaryApi from "../common/SummaryApi.js";
import {toast} from "react-hot-toast"
import AxiosToastError from "../utils/AxiosTostError.js";
import { useGlobalContext } from "../provider/GlobalProvider.jsx";

const EditAddressData = ({ close, data }) => {
    console.log(data);
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
    <section className="bg-black/50 fixed top-0 left-0 right-0 bottom-0 z-50 overflow-auto h-screen">
      <div className="bg-white p-6 w-full max-w-lg mt-10 mx-auto rounded shadow-lg relative ">
        <button
          className="absolute top-2 right-4 text-gray-500 hover:text-gray-800 text-2xl"
          onClick={close}
        >
          &times;
        </button>
        <h2 className="font-semibold text-gray-900">Edit Address</h2>
        <form action="" className="mt-4 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <label htmlFor="addressline" className="font-medium text-gray-700">Address Line:</label>
            <input
              type="text"
              id="addressline"
              className="border border-gray-300 bg-gray-50 p-3 rounded-md outline-none focus:border-black focus:bg-white transition-colors"
              {...register("address_line",{required: true})}
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
              {...register("pincode",{required: true})}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="mobile" className="font-medium text-gray-700">Mobile No :</label>
            <input
              type="text"
              id="mobile"
              className="border border-gray-300 bg-gray-50 p-3 rounded-md outline-none focus:border-black focus:bg-white transition-colors"
              {...register("mobile",{required: true})}
            />
          </div>

          <button type="submit" className="bg-black text-white w-full p-3 rounded-md mt-4 hover:bg-gray-800 transition-colors font-semibold tracking-wide">
            Update Address
          </button>
        </form>
      </div>
    </section>
  );
};

export default EditAddressData;
