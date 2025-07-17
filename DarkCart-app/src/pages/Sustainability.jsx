import React from 'react';
import { Link } from 'react-router-dom';

function Sustainability() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className='bg-white shadow-sm p-4 mb-6 flex items-center justify-between border-b border-gray-200'>
        <h1 className='text-xl font-bold text-gray-900 font-serif'>Our Sustainability Commitment</h1>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="h-80 md:h-96 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30 z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1605289982774-9a6fef564df8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1474&q=80" 
            alt="Sustainability" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center z-20 p-8 md:p-12 max-w-4xl">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Fashioning a Sustainable Future</h2>
              <p className="text-gray-200 text-lg md:text-xl">
                Our commitment to sustainability goes beyond words—it's woven into every garment we create.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Introduction */}
        <div className="max-w-3xl mx-auto mb-16">
          <p className="text-xl text-gray-700 leading-relaxed">
            At Casual Clothing Fashion, sustainability isn't just a trend—it's a core value that guides every decision we make. We believe that looking good shouldn't come at the expense of our planet or its people. That's why we've made it our mission to create clothing that's as kind to the environment as it is stylish.
          </p>
        </div>

        {/* Our Commitments */}
        <section className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Our Sustainability Commitments</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="w-14 h-14 bg-black/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">Sustainable Materials</h4>
              <p className="text-gray-600 mb-4">
                We prioritize eco-friendly fabrics like organic cotton, recycled polyester, Tencel, hemp, and other sustainable materials that reduce our environmental footprint.
              </p>
              <Link to="/materials" className="text-black hover:text-gray-800 font-medium inline-flex items-center">
                Learn about our materials
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="w-14 h-14 bg-black/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">Ethical Production</h4>
              <p className="text-gray-600 mb-4">
                We partner with factories that provide safe working conditions, fair wages, and ethical treatment of workers throughout our supply chain.
              </p>
              <Link to="/ethical-production" className="text-black hover:text-gray-800 font-medium inline-flex items-center">
                Meet our partners
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="w-14 h-14 bg-black/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">Reduced Carbon Footprint</h4>
              <p className="text-gray-600 mb-4">
                We're committed to minimizing our carbon emissions through efficient shipping methods, local sourcing when possible, and carbon offset programs.
              </p>
              <Link to="/carbon-footprint" className="text-black hover:text-gray-800 font-medium inline-flex items-center">
                View our climate action
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="w-14 h-14 bg-black/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">Product Longevity</h4>
              <p className="text-gray-600 mb-4">
                We design our garments to last, with quality construction and timeless styles that transcend seasonal trends, reducing the need for frequent replacements.
              </p>
              <Link to="/quality-promise" className="text-black hover:text-gray-800 font-medium inline-flex items-center">
                Our quality promise
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="w-14 h-14 bg-black/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">Circular Fashion</h4>
              <p className="text-gray-600 mb-4">
                We're working towards a circular model by implementing recycling programs, upcycling initiatives, and designing products with end-of-life considerations in mind.
              </p>
              <Link to="/circular-fashion" className="text-black hover:text-gray-800 font-medium inline-flex items-center">
                How it works
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="w-14 h-14 bg-black/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">Environmental Initiatives</h4>
              <p className="text-gray-600 mb-4">
                We invest in environmental conservation through partnerships with organizations that protect and restore natural habitats and combat climate change.
              </p>
              <Link to="/initiatives" className="text-black hover:text-gray-800 font-medium inline-flex items-center">
                Our partnerships
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Materials Spotlight */}
        <section className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Our Sustainable Materials</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/3">
                  <img 
                    src="https://images.unsplash.com/photo-1605618006668-206b430cc7f6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80" 
                    alt="Organic Cotton" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 md:w-2/3">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Organic Cotton</h4>
                  <p className="text-gray-600 mb-4">
                    Grown without synthetic pesticides or fertilizers, organic cotton uses 88% less water and 62% less energy than conventional cotton. It's better for farmers, soil health, and reduces the presence of toxins in your clothing.
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="inline-block bg-black/5 rounded-full px-3 py-1 text-xs font-medium text-black">
                      91% Lower Water Impact
                    </span>
                    <span className="mx-2">•</span>
                    <span className="inline-block bg-black/5 rounded-full px-3 py-1 text-xs font-medium text-black">
                      46% Reduced Carbon Emissions
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/3">
                  <img 
                    src="https://images.unsplash.com/photo-1614236224416-9a88c2e195e1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80" 
                    alt="Recycled Polyester" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 md:w-2/3">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Recycled Polyester</h4>
                  <p className="text-gray-600 mb-4">
                    Made from post-consumer plastic bottles, recycled polyester diverts waste from landfills and requires less energy to produce than virgin polyester. It's durable, lightweight, and helps reduce our reliance on petroleum.
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="inline-block bg-black/5 rounded-full px-3 py-1 text-xs font-medium text-black">
                      30-50% Lower Energy Use
                    </span>
                    <span className="mx-2">•</span>
                    <span className="inline-block bg-black/5 rounded-full px-3 py-1 text-xs font-medium text-black">
                      Reduces Landfill Waste
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/3">
                  <img 
                    src="https://images.unsplash.com/photo-1529720317453-c8da503f2051?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80" 
                    alt="Tencel Lyocell" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 md:w-2/3">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">TENCEL™ Lyocell</h4>
                  <p className="text-gray-600 mb-4">
                    Derived from sustainably harvested wood pulp in a closed-loop process, TENCEL™ uses less water and energy than cotton. It's biodegradable, incredibly soft, breathable, and has excellent moisture-wicking properties.
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="inline-block bg-black/5 rounded-full px-3 py-1 text-xs font-medium text-black">
                      Closed-Loop Production
                    </span>
                    <span className="mx-2">•</span>
                    <span className="inline-block bg-black/5 rounded-full px-3 py-1 text-xs font-medium text-black">
                      Biodegradable
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/3">
                  <img 
                    src="https://images.unsplash.com/photo-1579628276793-49971a09c15c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80" 
                    alt="Hemp" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 md:w-2/3">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Hemp</h4>
                  <p className="text-gray-600 mb-4">
                    One of the most environmentally friendly crops, hemp requires minimal water, no pesticides, and helps regenerate soil health. It produces strong, durable fabric that gets softer with each wash and has natural UV protection properties.
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="inline-block bg-black/5 rounded-full px-3 py-1 text-xs font-medium text-black">
                      Low Water Usage
                    </span>
                    <span className="mx-2">•</span>
                    <span className="inline-block bg-black/5 rounded-full px-3 py-1 text-xs font-medium text-black">
                      Regenerates Soil
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link 
              to="/materials" 
              className="bg-black hover:bg-gray-900 text-white px-5 py-2 rounded-md font-medium transition-colors inline-block"
            >
              Explore All Our Materials
            </Link>
          </div>
        </section>

        {/* Certifications */}
        <section className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Our Certifications</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-5 flex flex-col items-center text-center">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/GOTS_Logo.svg/1200px-GOTS_Logo.svg.png" 
                alt="GOTS Certified" 
                className="h-16 mb-4"
              />
              <h4 className="font-medium text-gray-900 mb-2">GOTS Certified</h4>
              <p className="text-sm text-gray-600">
                Global Organic Textile Standard ensures organic status and responsible social and environmental practices.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-5 flex flex-col items-center text-center">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Fair_Trade_Certified_seal.svg/1200px-Fair_Trade_Certified_seal.svg.png" 
                alt="Fair Trade Certified" 
                className="h-16 mb-4"
              />
              <h4 className="font-medium text-gray-900 mb-2">Fair Trade Certified</h4>
              <p className="text-sm text-gray-600">
                Ensures products are made according to rigorous social, environmental, and economic standards.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-5 flex flex-col items-center text-center">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Bluesign_Logo.svg/1200px-Bluesign_Logo.svg.png" 
                alt="Bluesign Certified" 
                className="h-16 mb-4"
              />
              <h4 className="font-medium text-gray-900 mb-2">Bluesign Certified</h4>
              <p className="text-sm text-gray-600">
                Ensures responsible and sustainable manufacturing of textile consumer products.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-5 flex flex-col items-center text-center">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Oeko-tex_logo.svg/1200px-Oeko-tex_logo.svg.png" 
                alt="OEKO-TEX Certified" 
                className="h-16 mb-4"
              />
              <h4 className="font-medium text-gray-900 mb-2">OEKO-TEX Certified</h4>
              <p className="text-sm text-gray-600">
                Certifies that textiles are free from harmful substances and are safe for human use.
              </p>
            </div>
          </div>
        </section>

        {/* Sustainability Goals */}
        <section className="mb-16 bg-black/5 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Our Sustainability Goals</h3>
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-xl font-bold text-black">1</span>
                </div>
                <h4 className="text-lg font-bold text-gray-900">Carbon Neutral by 2026</h4>
              </div>
              <div className="pl-16">
                <p className="text-gray-600">
                  We're working towards becoming carbon neutral across all operations by implementing renewable energy sources, optimizing shipping, and investing in verified carbon offset projects.
                </p>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-black h-2.5 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <div className="flex justify-between mt-2 text-sm text-gray-500">
                    <span>Current: 65% Complete</span>
                    <span>Target: 2026</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-xl font-bold text-black">2</span>
                </div>
                <h4 className="text-lg font-bold text-gray-900">100% Sustainable Materials by 2025</h4>
              </div>
              <div className="pl-16">
                <p className="text-gray-600">
                  We're transitioning all our products to use only sustainable, recycled, or organically grown materials, eliminating virgin synthetic fibers from our supply chain.
                </p>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-black h-2.5 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                  <div className="flex justify-between mt-2 text-sm text-gray-500">
                    <span>Current: 78% Complete</span>
                    <span>Target: 2025</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-xl font-bold text-black">3</span>
                </div>
                <h4 className="text-lg font-bold text-gray-900">Zero Waste Production by 2027</h4>
              </div>
              <div className="pl-16">
                <p className="text-gray-600">
                  We're implementing innovative production techniques and recycling programs to eliminate waste throughout our manufacturing process, ensuring nothing ends up in landfills.
                </p>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-black h-2.5 rounded-full" style={{ width: '42%' }}></div>
                  </div>
                  <div className="flex justify-between mt-2 text-sm text-gray-500">
                    <span>Current: 42% Complete</span>
                    <span>Target: 2027</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-xl font-bold text-black">4</span>
                </div>
                <h4 className="text-lg font-bold text-gray-900">Water Neutral Operations by 2028</h4>
              </div>
              <div className="pl-16">
                <p className="text-gray-600">
                  We're reducing water consumption in our manufacturing processes and investing in water conservation projects that restore local watersheds and improve water access in communities where we operate.
                </p>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-black h-2.5 rounded-full" style={{ width: '35%' }}></div>
                  </div>
                  <div className="flex justify-between mt-2 text-sm text-gray-500">
                    <span>Current: 35% Complete</span>
                    <span>Target: 2028</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sustainability Report */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden md:flex">
            <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our 2024 Sustainability Report</h3>
              <p className="text-gray-600 mb-6">
                Transparency is a key part of our sustainability journey. Our annual report details our progress, challenges, and future goals. Learn about our environmental impact, social initiatives, and how we're working to create positive change in the fashion industry.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="#" 
                  className="bg-black hover:bg-gray-900 text-white px-5 py-2 rounded-md font-medium transition-colors inline-flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Download Report
                </a>
                <a 
                  href="#" 
                  className="border border-gray-300 hover:border-gray-400 text-gray-700 px-5 py-2 rounded-md font-medium transition-colors"
                >
                  View Summary
                </a>
              </div>
            </div>
            <div className="md:w-1/2">
              <img 
                src="https://images.unsplash.com/photo-1470790376778-a9fbc86d70e2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=704&q=80" 
                alt="Sustainability Report" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Take Action */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Join Us in Making a Difference</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">Care for Your Clothes</h4>
              <p className="text-gray-600 mb-4">
                Extend the life of your garments by washing less frequently, using cold water, line drying, and repairing instead of replacing.
              </p>
              <Link to="/garment-care" className="text-black hover:text-gray-800 font-medium">
                View Care Guide
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">Recycle With Us</h4>
              <p className="text-gray-600 mb-4">
                Return your worn Casual Clothing Fashion items to be recycled or upcycled, and receive a discount on your next purchase.
              </p>
              <Link to="/recycling-program" className="text-black hover:text-gray-800 font-medium">
                Learn About Our Program
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">Shop Consciously</h4>
              <p className="text-gray-600 mb-4">
                Look for our eco-friendly tags to identify products made with sustainable materials and low-impact processes.
              </p>
              <Link to="/eco-collection" className="text-black hover:text-gray-800 font-medium">
                Shop Eco Collection
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h3>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-200">
              <div className="p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2">How do I know if a product is sustainable?</h4>
                <p className="text-gray-600">
                  Look for our green leaf icon on product pages, which indicates items made with sustainable materials. Each product page also includes detailed information about the materials used and their environmental impact.
                </p>
              </div>
              <div className="p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2">Are your packaging materials eco-friendly?</h4>
                <p className="text-gray-600">
                  Yes, we use 100% recycled and recyclable packaging materials. Our shipping boxes are made from post-consumer waste, our mailers are compostable, and we've eliminated plastic packaging from our supply chain.
                </p>
              </div>
              <div className="p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2">How can I recycle my old Casual Clothing Fashion items?</h4>
                <p className="text-gray-600">
                  You can return any used Casual Clothing Fashion item to our stores or mail them back to us using our prepaid shipping label. These items will be recycled or upcycled, and you'll receive a 15% discount on your next purchase.
                </p>
              </div>
              <div className="p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2">How are you reducing water usage in production?</h4>
                <p className="text-gray-600">
                  We partner with factories that use closed-loop water systems, water-efficient dyeing technologies, and rainwater harvesting. We also prioritize materials like Tencel and hemp that require significantly less water than conventional cotton.
                </p>
              </div>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link to="/sustainability-faq" className="text-black hover:text-gray-800 font-medium inline-flex items-center">
              View all sustainability FAQs
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>

        {/* Call to Action */}
        <div className="bg-black rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Shop Sustainably, Live Consciously</h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Every purchase you make is a choice for the future. Join us in creating a more sustainable fashion industry by choosing products that are better for people and the planet.
          </p>
          <Link 
            to="/eco-collection" 
            className="bg-white hover:bg-gray-100 text-black font-medium py-3 px-8 rounded-md transition duration-200 inline-block"
          >
            Shop Our Eco Collection
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Sustainability;
