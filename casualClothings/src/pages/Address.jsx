import React, { useState } from "react";
import { useSelector } from "react-redux";
import AddAddress from "../components/AddAddress";
import { MdDelete } from "react-icons/md";
import { MdEdit } from "react-icons/md";
import EditAddressData from "../components/EditAddressData";
import SummaryApi from "../common/SummaryApi";
import Axios from "../utils/Axios";
import toast from "react-hot-toast";
import AxiosTostError from "../utils/AxiosTostError";
import { useGlobalContext } from "../provider/GlobalProvider";

function Address() {
  const addressList = useSelector((state) => state.addresses.addressList);
  const [openAddress, setOpenAddress] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState({});
  const { fetchAddress } = useGlobalContext();

  const handleDelete = async (id) => {
    try {
      const response = await Axios({
        ...SummaryApi.deleteAddress,
        data: { _id: id },
      });
      if (response.data.success) {
        toast.success(response.data.message);
        fetchAddress();
      }
    } catch (error) {
      AxiosTostError(error);
    }
  };

  return (
    <div className="">
      <div className="bg-white p-4 mb-4 shadow-lg flex justify-between items-center rounded-lg border border-gray-200">
        <h1 className="font-bold text-xl text-gray-900 font-serif text-ellipsis line-clamp-1">
          Delivery Addresses
        </h1>
        <button
          onClick={() => setOpenAddress(true)}
          className="border-2 border-black text-black px-4 py-2 rounded-md hover:bg-black hover:text-white transition-colors font-medium tracking-wide"
        >
          Add Address
        </button>
      </div>
      <div className="bg-gray-50 p-2">
        {addressList.map((address, index) => (
          <div
            key={address._id}
            className={`${
              address.status ? "bg-white" : "hidden"
            } p-4 mb-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex gap-4 border border-gray-200`}
          >
            <div className="w-full">
              <h4 className="font-semibold text-gray-900">
                {address.address_line}
              </h4>
              <p className="text-gray-600">
                {address.city}, {address.state} - {address.pincode}
              </p>
              <p className="text-gray-600">{address.country}</p>
              <p className="text-gray-700 font-medium">
                Mobile: {address.mobile}
              </p>
            </div>

            <div className="flex flex-col justify-between items-center gap-2">
              <button
                onClick={() => {
                  setOpenEdit(true);
                  setEditData(address);
                }}
                className="bg-gray-100 border border-gray-300 p-2 rounded-md hover:bg-gray-200 hover:text-gray-900 transition-colors"
              >
                <MdEdit size={20} />
              </button>
              <button
                onClick={() => handleDelete(address._id)}
                className="bg-red-50 border border-red-300 text-red-600 p-2 rounded-md hover:bg-red-100 hover:text-red-700 transition-colors"
              >
                <MdDelete size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div
        onClick={() => setOpenAddress(true)}
        className="h-16 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors duration-200"
      >
        <span className="text-gray-600 font-medium">Add address</span>
      </div>

      {openAddress && <AddAddress close={() => setOpenAddress(false)} />}

      {openEdit && (
        <EditAddressData close={() => setOpenEdit(false)} data={editData} />
      )}
    </div>
  );
}

export default Address;
