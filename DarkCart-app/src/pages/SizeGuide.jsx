import React, { useState } from 'react';
import { Tab } from '@headlessui/react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function SizeGuide() {
  const [measurementSystem, setMeasurementSystem] = useState('inches');
  
  // Categories for tabs
  const categories = {
    'Men': {
      tops: [
        { size: 'XS', chest: measurementSystem === 'inches' ? '33-35"' : '84-89cm', waist: measurementSystem === 'inches' ? '26-28"' : '66-71cm', hips: measurementSystem === 'inches' ? '34-36"' : '86-91cm' },
        { size: 'S', chest: measurementSystem === 'inches' ? '36-38"' : '91-96cm', waist: measurementSystem === 'inches' ? '29-31"' : '74-79cm', hips: measurementSystem === 'inches' ? '37-39"' : '94-99cm' },
        { size: 'M', chest: measurementSystem === 'inches' ? '39-41"' : '99-104cm', waist: measurementSystem === 'inches' ? '32-34"' : '81-86cm', hips: measurementSystem === 'inches' ? '40-42"' : '102-107cm' },
        { size: 'L', chest: measurementSystem === 'inches' ? '42-44"' : '107-112cm', waist: measurementSystem === 'inches' ? '35-37"' : '89-94cm', hips: measurementSystem === 'inches' ? '43-45"' : '109-114cm' },
        { size: 'XL', chest: measurementSystem === 'inches' ? '45-47"' : '114-119cm', waist: measurementSystem === 'inches' ? '38-40"' : '97-102cm', hips: measurementSystem === 'inches' ? '46-48"' : '117-122cm' },
        { size: '2XL', chest: measurementSystem === 'inches' ? '48-50"' : '122-127cm', waist: measurementSystem === 'inches' ? '41-43"' : '104-109cm', hips: measurementSystem === 'inches' ? '49-51"' : '124-130cm' },
      ],
      bottoms: [
        { size: 'XS (28)', waist: measurementSystem === 'inches' ? '28"' : '71cm', hips: measurementSystem === 'inches' ? '34"' : '86cm', inseam: measurementSystem === 'inches' ? '30"' : '76cm' },
        { size: 'S (30)', waist: measurementSystem === 'inches' ? '30"' : '76cm', hips: measurementSystem === 'inches' ? '36"' : '91cm', inseam: measurementSystem === 'inches' ? '30"' : '76cm' },
        { size: 'M (32)', waist: measurementSystem === 'inches' ? '32"' : '81cm', hips: measurementSystem === 'inches' ? '38"' : '97cm', inseam: measurementSystem === 'inches' ? '31"' : '79cm' },
        { size: 'L (34)', waist: measurementSystem === 'inches' ? '34"' : '86cm', hips: measurementSystem === 'inches' ? '40"' : '102cm', inseam: measurementSystem === 'inches' ? '32"' : '81cm' },
        { size: 'XL (36)', waist: measurementSystem === 'inches' ? '36"' : '91cm', hips: measurementSystem === 'inches' ? '42"' : '107cm', inseam: measurementSystem === 'inches' ? '32"' : '81cm' },
        { size: '2XL (38)', waist: measurementSystem === 'inches' ? '38"' : '97cm', hips: measurementSystem === 'inches' ? '44"' : '112cm', inseam: measurementSystem === 'inches' ? '33"' : '84cm' },
      ],
    },
    'Women': {
      tops: [
        { size: 'XS', chest: measurementSystem === 'inches' ? '31-32"' : '79-81cm', waist: measurementSystem === 'inches' ? '24-25"' : '61-64cm', hips: measurementSystem === 'inches' ? '34-35"' : '86-89cm' },
        { size: 'S', chest: measurementSystem === 'inches' ? '33-34"' : '84-86cm', waist: measurementSystem === 'inches' ? '26-27"' : '66-69cm', hips: measurementSystem === 'inches' ? '36-37"' : '91-94cm' },
        { size: 'M', chest: measurementSystem === 'inches' ? '35-36"' : '89-91cm', waist: measurementSystem === 'inches' ? '28-29"' : '71-74cm', hips: measurementSystem === 'inches' ? '38-39"' : '97-99cm' },
        { size: 'L', chest: measurementSystem === 'inches' ? '37-39"' : '94-99cm', waist: measurementSystem === 'inches' ? '30-32"' : '76-81cm', hips: measurementSystem === 'inches' ? '40-42"' : '102-107cm' },
        { size: 'XL', chest: measurementSystem === 'inches' ? '40-42"' : '102-107cm', waist: measurementSystem === 'inches' ? '33-35"' : '84-89cm', hips: measurementSystem === 'inches' ? '43-45"' : '109-114cm' },
        { size: '2XL', chest: measurementSystem === 'inches' ? '43-45"' : '109-114cm', waist: measurementSystem === 'inches' ? '36-38"' : '91-97cm', hips: measurementSystem === 'inches' ? '46-48"' : '117-122cm' },
      ],
      bottoms: [
        { size: 'XS (0-2)', waist: measurementSystem === 'inches' ? '24-25"' : '61-64cm', hips: measurementSystem === 'inches' ? '34-35"' : '86-89cm', inseam: measurementSystem === 'inches' ? '28"' : '71cm' },
        { size: 'S (4-6)', waist: measurementSystem === 'inches' ? '26-27"' : '66-69cm', hips: measurementSystem === 'inches' ? '36-37"' : '91-94cm', inseam: measurementSystem === 'inches' ? '28.5"' : '72cm' },
        { size: 'M (8-10)', waist: measurementSystem === 'inches' ? '28-29"' : '71-74cm', hips: measurementSystem === 'inches' ? '38-39"' : '97-99cm', inseam: measurementSystem === 'inches' ? '29"' : '74cm' },
        { size: 'L (12-14)', waist: measurementSystem === 'inches' ? '30-32"' : '76-81cm', hips: measurementSystem === 'inches' ? '40-42"' : '102-107cm', inseam: measurementSystem === 'inches' ? '29.5"' : '75cm' },
        { size: 'XL (16-18)', waist: measurementSystem === 'inches' ? '33-35"' : '84-89cm', hips: measurementSystem === 'inches' ? '43-45"' : '109-114cm', inseam: measurementSystem === 'inches' ? '30"' : '76cm' },
        { size: '2XL (20-22)', waist: measurementSystem === 'inches' ? '36-38"' : '91-97cm', hips: measurementSystem === 'inches' ? '46-48"' : '117-122cm', inseam: measurementSystem === 'inches' ? '30.5"' : '77cm' },
      ],
      dresses: [
        { size: 'XS (0-2)', bust: measurementSystem === 'inches' ? '31-32"' : '79-81cm', waist: measurementSystem === 'inches' ? '24-25"' : '61-64cm', hips: measurementSystem === 'inches' ? '34-35"' : '86-89cm' },
        { size: 'S (4-6)', bust: measurementSystem === 'inches' ? '33-34"' : '84-86cm', waist: measurementSystem === 'inches' ? '26-27"' : '66-69cm', hips: measurementSystem === 'inches' ? '36-37"' : '91-94cm' },
        { size: 'M (8-10)', bust: measurementSystem === 'inches' ? '35-36"' : '89-91cm', waist: measurementSystem === 'inches' ? '28-29"' : '71-74cm', hips: measurementSystem === 'inches' ? '38-39"' : '97-99cm' },
        { size: 'L (12-14)', bust: measurementSystem === 'inches' ? '37-39"' : '94-99cm', waist: measurementSystem === 'inches' ? '30-32"' : '76-81cm', hips: measurementSystem === 'inches' ? '40-42"' : '102-107cm' },
        { size: 'XL (16-18)', bust: measurementSystem === 'inches' ? '40-42"' : '102-107cm', waist: measurementSystem === 'inches' ? '33-35"' : '84-89cm', hips: measurementSystem === 'inches' ? '43-45"' : '109-114cm' },
        { size: '2XL (20-22)', bust: measurementSystem === 'inches' ? '43-45"' : '109-114cm', waist: measurementSystem === 'inches' ? '36-38"' : '91-97cm', hips: measurementSystem === 'inches' ? '46-48"' : '117-122cm' },
      ]
    },
    'Kids': {
      general: [
        { size: '2T', height: measurementSystem === 'inches' ? '33-35"' : '84-89cm', weight: measurementSystem === 'inches' ? '28-32 lbs' : '13-15 kg', chest: measurementSystem === 'inches' ? '21"' : '53cm' },
        { size: '3T', height: measurementSystem === 'inches' ? '36-38"' : '91-97cm', weight: measurementSystem === 'inches' ? '32-35 lbs' : '15-16 kg', chest: measurementSystem === 'inches' ? '22"' : '56cm' },
        { size: '4T', height: measurementSystem === 'inches' ? '39-41"' : '99-104cm', weight: measurementSystem === 'inches' ? '35-41 lbs' : '16-19 kg', chest: measurementSystem === 'inches' ? '23"' : '58cm' },
        { size: '5', height: measurementSystem === 'inches' ? '42-44"' : '107-112cm', weight: measurementSystem === 'inches' ? '41-46 lbs' : '19-21 kg', chest: measurementSystem === 'inches' ? '24"' : '61cm' },
        { size: '6', height: measurementSystem === 'inches' ? '45-47"' : '114-119cm', weight: measurementSystem === 'inches' ? '46-51 lbs' : '21-23 kg', chest: measurementSystem === 'inches' ? '25"' : '64cm' },
        { size: '7', height: measurementSystem === 'inches' ? '48-50"' : '122-127cm', weight: measurementSystem === 'inches' ? '52-57 lbs' : '24-26 kg', chest: measurementSystem === 'inches' ? '26"' : '66cm' },
        { size: '8', height: measurementSystem === 'inches' ? '51-52"' : '130-132cm', weight: measurementSystem === 'inches' ? '58-64 lbs' : '26-29 kg', chest: measurementSystem === 'inches' ? '27"' : '69cm' },
        { size: '10', height: measurementSystem === 'inches' ? '53-55"' : '135-140cm', weight: measurementSystem === 'inches' ? '65-73 lbs' : '29-33 kg', chest: measurementSystem === 'inches' ? '28-29"' : '71-74cm' },
        { size: '12', height: measurementSystem === 'inches' ? '56-58"' : '142-147cm', weight: measurementSystem === 'inches' ? '74-84 lbs' : '34-38 kg', chest: measurementSystem === 'inches' ? '30-31"' : '76-79cm' },
        { size: '14', height: measurementSystem === 'inches' ? '59-61"' : '150-155cm', weight: measurementSystem === 'inches' ? '85-95 lbs' : '39-43 kg', chest: measurementSystem === 'inches' ? '32-33"' : '81-84cm' },
      ],
    },
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className='bg-white shadow-sm p-4 mb-6 flex items-center justify-between border-b border-gray-200'>
        <h1 className='text-xl font-bold text-gray-900 font-["Playfair_Display"]'>Size Guide</h1>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-medium text-gray-900 mb-4 font-['Playfair_Display']">Find Your Perfect Fit</h2>
          <p className="max-w-2xl mx-auto text-gray-600 font-['Poppins']">
            Use our comprehensive size guides to find your ideal fit. Measure yourself correctly for the most accurate sizing.
          </p>
        </div>

        {/* Measurement system toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-md shadow-sm font-['Poppins']">
            <button
              onClick={() => setMeasurementSystem('inches')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                measurementSystem === 'inches' 
                  ? 'bg-black text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Inches
            </button>
            <button
              onClick={() => setMeasurementSystem('cm')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                measurementSystem === 'cm' 
                  ? 'bg-black text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 border-l-0'
              }`}
            >
              Centimeters
            </button>
          </div>
        </div>

        {/* Size charts by category */}
        <div className="mb-10">
          <Tab.Group>
            <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 font-['Poppins']">
              {Object.keys(categories).map((category) => (
                <Tab
                  key={category}
                  className={({ selected }) =>
                    classNames(
                      'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                      'ring-white/60 ring-offset-2 focus:outline-none',
                      selected
                        ? 'bg-white text-black shadow'
                        : 'text-gray-700 hover:bg-white/[0.12] hover:text-black'
                    )
                  }
                >
                  {category}
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels className="mt-4 font-['Poppins']">
              {/* Men's Size Chart Panel */}
              <Tab.Panel>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Men's Tops</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chest</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waist</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hips</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {categories.Men.tops.map((item, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.size}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.chest}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.waist}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.hips}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Men's Bottoms</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waist</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hips</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inseam</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {categories.Men.bottoms.map((item, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.size}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.waist}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.hips}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.inseam}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </Tab.Panel>

              {/* Women's Size Chart Panel */}
              <Tab.Panel>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Women's Tops</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chest</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waist</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hips</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {categories.Women.tops.map((item, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.size}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.chest}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.waist}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.hips}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Women's Bottoms</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waist</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hips</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inseam</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {categories.Women.bottoms.map((item, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.size}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.waist}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.hips}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.inseam}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Women's Dresses</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bust</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waist</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hips</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {categories.Women.dresses.map((item, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.size}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.bust}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.waist}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.hips}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </Tab.Panel>

              {/* Kids' Size Chart Panel */}
              <Tab.Panel>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Kids' Sizes</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Height</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chest</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {categories.Kids.general.map((item, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.size}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.height}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.weight}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.chest}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>

        {/* How to measure section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-10">
          <h3 className="text-xl font-medium text-gray-900 mb-4 font-['Playfair_Display']">How to Measure</h3>
          <div className="prose max-w-none text-gray-700 font-['Poppins']">
            <p className="mb-4">
              To ensure the best fit, please follow these measuring instructions carefully. Use a soft measuring tape and wear minimal clothing for the most accurate measurements.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-black/5 p-4 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Chest/Bust</h4>
                <p className="text-gray-600 text-sm">Measure around the fullest part of your chest/bust, keeping the tape measure horizontal.</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-black/5 p-4 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Waist</h4>
                <p className="text-gray-600 text-sm">Measure around your natural waistline, keeping the tape measure comfortably loose.</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-black/5 p-4 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Hips</h4>
                <p className="text-gray-600 text-sm">Measure around the fullest part of your hips, about 8" below your natural waistline.</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-black/5 p-4 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Inseam</h4>
                <p className="text-gray-600 text-sm">Measure from the crotch to the desired pant length along the inside of the leg.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Size conversion section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-medium text-gray-900 mb-4 font-['Playfair_Display']">International Size Conversion</h3>
          <div className="overflow-x-auto font-['Poppins']">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">US Size</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UK Size</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EU Size</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">JP Size</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Example row - replace with dynamic content */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">6</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">10</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">38</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">9</td>
                </tr>
                {/* Repeat rows as necessary */}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SizeGuide;
