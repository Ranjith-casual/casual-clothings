import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function Lookbook() {
  const [activeCollection, setActiveCollection] = useState('summer2025');

  // Collection data
  const collections = {
    summer2025: {
      title: "Summer 2025 Collection",
      subtitle: "Vibrant colors and sustainable fabrics for the season",
      description: "Our Summer 2025 collection embraces vibrant colors, lightweight fabrics, and breezy silhouettes. Designed for comfort without compromising on style, each piece is crafted with sustainable materials to reduce environmental impact while keeping you fashionable all season long.",
      items: [
        {
          id: 1,
          name: "Linen Blend Relaxed Shirt",
          image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=776&q=80",
          category: "Shirts"
        },
        {
          id: 2,
          name: "Organic Cotton Wide-Leg Pants",
          image: "https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
          category: "Bottoms"
        },
        {
          id: 3,
          name: "Eco-Friendly Summer Dress",
          image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=746&q=80",
          category: "Dresses"
        },
        {
          id: 4,
          name: "Lightweight Denim Jacket",
          image: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80",
          category: "Outerwear"
        },
        {
          id: 5,
          name: "Breathable Athletic Shorts",
          image: "https://images.unsplash.com/photo-1564400135515-50db5cb6d066?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80",
          category: "Activewear"
        },
        {
          id: 6,
          name: "Recycled Polyester Swimwear",
          image: "https://images.unsplash.com/photo-1570976447640-ac859a527b8e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
          category: "Swimwear"
        },
        {
          id: 7,
          name: "Bamboo Fiber Casual Tee",
          image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=764&q=80",
          category: "T-shirts"
        },
        {
          id: 8,
          name: "Hemp Blend Sun Hat",
          image: "https://images.unsplash.com/photo-1556306535-0f09a537f0a3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=770&q=80",
          category: "Accessories"
        }
      ]
    },
    spring2025: {
      title: "Spring 2025 Collection",
      subtitle: "Fresh pastels and floral patterns",
      description: "Our Spring 2025 collection celebrates renewal and growth with soft pastels, floral patterns, and light fabrics. Every piece is designed to transition seamlessly from cool mornings to warm afternoons, perfect for the unpredictable spring weather. This season's styles focus on versatility and layering options.",
      items: [
        {
          id: 9,
          name: "Floral Print Midi Dress",
          image: "https://images.unsplash.com/photo-1511130558090-00af810c21b1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
          category: "Dresses"
        },
        {
          id: 10,
          name: "Lightweight Cardigan",
          image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=736&q=80",
          category: "Knitwear"
        },
        {
          id: 11,
          name: "Cropped Trousers",
          image: "https://images.unsplash.com/photo-1551854838-212c9a5f7d12?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
          category: "Bottoms"
        },
        {
          id: 12,
          name: "Pastel Blazer",
          image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
          category: "Outerwear"
        },
        {
          id: 13,
          name: "Floral Embroidered Top",
          image: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
          category: "Tops"
        },
        {
          id: 14,
          name: "Rain Jacket",
          image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
          category: "Outerwear"
        }
      ]
    },
    essentials: {
      title: "Timeless Essentials",
      subtitle: "Wardrobe staples for every season",
      description: "Our Timeless Essentials collection features classic pieces that form the foundation of any well-curated wardrobe. With a focus on quality materials and expert craftsmanship, these versatile items are designed to last season after season. Each piece seamlessly blends with your existing wardrobe while elevating your everyday style.",
      items: [
        {
          id: 15,
          name: "Classic White Button-Down",
          image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1480&q=80",
          category: "Shirts"
        },
        {
          id: 16,
          name: "Straight Leg Jeans",
          image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
          category: "Bottoms"
        },
        {
          id: 17,
          name: "Tailored Blazer",
          image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80",
          category: "Outerwear"
        },
        {
          id: 18,
          name: "Leather Belt",
          image: "https://images.unsplash.com/photo-1553143820-6bb68bc34679?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=735&q=80",
          category: "Accessories"
        },
        {
          id: 19,
          name: "Cashmere Sweater",
          image: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=711&q=80",
          category: "Knitwear"
        },
        {
          id: 20,
          name: "Little Black Dress",
          image: "https://images.unsplash.com/photo-1559741215-71dafb8ca8c0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
          category: "Dresses"
        },
        {
          id: 21,
          name: "Chelsea Boots",
          image: "https://images.unsplash.com/photo-1638012384859-7245a9d0c15e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
          category: "Footwear"
        },
        {
          id: 22,
          name: "Premium T-shirt",
          image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
          category: "T-shirts"
        }
      ]
    },
    sustainable: {
      title: "Eco-Conscious Collection",
      subtitle: "Fashion that's kind to the planet",
      description: "Our Eco-Conscious Collection represents our commitment to sustainable fashion. Each piece is made from environmentally friendly materials like organic cotton, recycled polyester, and sustainable plant fibers. With responsible manufacturing practices and reduced waste, this collection allows you to look good while making conscious choices for the planet.",
      items: [
        {
          id: 23,
          name: "Organic Cotton T-shirt",
          image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1480&q=80",
          category: "T-shirts"
        },
        {
          id: 24,
          name: "Recycled Denim Jeans",
          image: "https://images.unsplash.com/photo-1582552938357-32b906df40cb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=735&q=80",
          category: "Bottoms"
        },
        {
          id: 25,
          name: "Tencel Jumpsuit",
          image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=688&q=80",
          category: "Jumpsuits"
        },
        {
          id: 26,
          name: "Hemp Blend Jacket",
          image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=736&q=80",
          category: "Outerwear"
        },
        {
          id: 27,
          name: "Bamboo Lounge Set",
          image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=688&q=80",
          category: "Loungewear"
        },
        {
          id: 28,
          name: "Plant-Based Leather Bag",
          image: "https://images.unsplash.com/photo-1590739292103-d5e3201f1618?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80",
          category: "Accessories"
        }
      ]
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className='bg-white shadow-sm p-4 mb-6 flex items-center justify-between border-b border-gray-200'>
        <h1 className='text-xl font-bold text-gray-900 font-serif'>Collections</h1>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Collection Selection */}
        <div className="mb-12 overflow-x-auto">
          <div className="inline-flex min-w-full pb-2 space-x-4">
            {Object.keys(collections).map(collection => (
              <button
                key={collection}
                onClick={() => setActiveCollection(collection)}
                className={`px-6 py-3 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                  activeCollection === collection
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {collections[collection].title}
              </button>
            ))}
          </div>
        </div>

        {/* Collection Hero */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-12">
          <div className="md:flex">
            <div className="md:flex-1">
              <motion.div 
                key={activeCollection}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="h-64 md:h-auto relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent z-10"></div>
                <img 
                  src={collections[activeCollection].items[0].image}
                  alt={collections[activeCollection].title}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>
            <div className="md:flex-1 p-6 md:p-8 flex flex-col justify-center">
              <motion.div
                key={activeCollection + "-text"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{collections[activeCollection].title}</h2>
                <p className="text-lg text-black mb-4">{collections[activeCollection].subtitle}</p>
                <p className="text-gray-600 mb-6">{collections[activeCollection].description}</p>
                <div className="flex space-x-4">
                  <Link 
                    to={`/collection/${activeCollection}`} 
                    className="bg-black hover:bg-black/90 text-white px-5 py-2 rounded-md font-medium transition-colors"
                  >
                    Shop Collection
                  </Link>
                  <button className="border border-gray-300 hover:border-gray-400 px-5 py-2 rounded-md font-medium transition-colors">
                    View Lookbook
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Collection Items */}
        <motion.div
          key={activeCollection + "-grid"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-12"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">Featured Items</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {collections[activeCollection].items.map((item) => (
              <div 
                key={item.id} 
                className="bg-white rounded-lg shadow-sm overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative pb-[125%]">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-white rounded-full px-3 py-1 text-xs font-medium text-gray-700">
                    {item.category}
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-medium text-gray-900 mb-1">{item.name}</h4>
                  <div className="flex justify-between items-center">
                    <Link 
                      to={`/product/${item.id}`} 
                      className="text-sm text-black hover:text-gray-800 font-medium"
                    >
                      View Details
                    </Link>
                    <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Behind the Collection */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-12">
          <div className="md:grid md:grid-cols-2">
            <div className="p-6 md:p-8 flex flex-col justify-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Behind the Collection</h3>
              <p className="text-gray-600 mb-6">
                Each collection starts with inspiration from global trends, cultural movements, and innovative materials. Our designers carefully craft every piece to ensure comfort, durability, and style, while our commitment to sustainability influences every decision in the production process.
              </p>
              <Link 
                to="/about-our-process" 
                className="text-black hover:text-gray-800 font-medium inline-flex items-center"
              >
                Learn about our design process
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="h-64 md:h-auto">
              <img 
                src="https://images.unsplash.com/photo-1508997449629-303059a039c0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80" 
                alt="Design Process" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Styling Tips */}
        <div className="bg-black/5 rounded-lg p-6 md:p-8 mb-12">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Styling Tips for this Collection</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-5">
              <div className="flex items-center mb-4">
                <div className="rounded-full bg-black/5 p-3 mr-3">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900">Layering Techniques</h4>
              </div>
              <p className="text-gray-600">
                Master the art of layering with lightweight pieces from our collection. Mix textures and lengths for a dynamic look that adapts to changing temperatures throughout the day.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-5">
              <div className="flex items-center mb-4">
                <div className="rounded-full bg-indigo-100 p-3 mr-3">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900">Color Coordination</h4>
              </div>
              <p className="text-gray-600">
                This season's color palette is designed to mix and match effortlessly. Try pairing bold pieces with neutrals, or create monochromatic looks with varying shades of the same color.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-5">
              <div className="flex items-center mb-4">
                <div className="rounded-full bg-black/5 p-3 mr-3">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900">Versatile Accessories</h4>
              </div>
              <p className="text-gray-600">
                Elevate your outfits with our carefully selected accessories. From minimalist jewelry to statement bags, these pieces are designed to complement multiple looks from the collection.
              </p>
            </div>
          </div>
        </div>

        {/* Instagram Feed */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">As Styled by Our Community</h3>
            <a href="#" className="text-black hover:text-gray-800 font-medium text-sm inline-flex items-center">
              Follow us on Instagram
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <a 
                key={index} 
                href="#" 
                className="block overflow-hidden rounded-lg group relative"
              >
                <img 
                  src={`https://source.unsplash.com/random/300x300/?fashion&sig=${index}`} 
                  alt="Instagram Post" 
                  className="w-full h-full object-cover aspect-square group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="text-white flex items-center">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M12 2c-2.714 0-3.055.012-4.123.06-1.064.049-1.791.218-2.427.465a4.902 4.902 0 00-1.772 1.153A4.902 4.902 0 002.525 5.45c-.247.636-.416 1.363-.465 2.427C2.012 8.945 2 9.286 2 12s.012 3.055.06 4.123c.049 1.064.218 1.791.465 2.427a4.902 4.902 0 001.153 1.772 4.902 4.902 0 001.772 1.153c.636.247 1.363.416 2.427.465 1.068.048 1.409.06 4.123.06s3.055-.012 4.123-.06c1.064-.049 1.791-.218 2.427-.465a4.902 4.902 0 001.772-1.153 4.902 4.902 0 001.153-1.772c.247-.636.416-1.363.465-2.427.048-1.068.06-1.409.06-4.123s-.012-3.055-.06-4.123c-.049-1.064-.218-1.791-.465-2.427a4.902 4.902 0 00-1.153-1.772 4.902 4.902 0 00-1.772-1.153c-.636-.247-1.363-.416-2.427-.465C15.055 2.012 14.714 2 12 2zm0 1.802c2.67 0 2.986.01 4.04.058.976.045 1.505.207 1.858.344.466.181.8.398 1.15.748.35.35.566.684.748 1.15.137.353.3.882.344 1.857.048 1.055.058 1.37.058 4.041 0 2.67-.01 2.986-.058 4.04-.045.976-.207 1.505-.344 1.858-.181.466-.398.8-.748 1.15-.35.35-.684.566-1.15.748-.353.137-.882.3-1.857.344-1.054.048-1.37.058-4.041.058-2.67 0-2.987-.01-4.04-.058-.976-.045-1.505-.207-1.858-.344-.466-.181-.8-.398-1.15-.748-.35-.35-.566-.684-.748-1.15-.137-.353-.3-.882-.344-1.857-.048-1.055-.058-1.37-.058-4.041 0-2.67.01-2.986.058-4.04.045-.976.207-1.505.344-1.858.181-.466.398-.8.748-1.15.35-.35.684-.566 1.15-.748.353-.137.882-.3 1.857-.344 1.055-.048 1.37-.058 4.041-.058zm0 11.531a3.333 3.333 0 110-6.666 3.333 3.333 0 010 6.666zm0-8.468a5.135 5.135 0 100 10.27 5.135 5.135 0 000-10.27zm6.538-.203a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Email Signup */}
        <div className="bg-black rounded-lg p-6 md:p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Get Early Access to New Collections</h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Subscribe to our newsletter to be the first to know about new arrivals, exclusive offers, and styling tips.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input 
              type="email" 
              className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
              placeholder="Enter your email" 
              required 
            />
            <button 
              type="submit" 
              className="bg-white hover:bg-gray-100 text-black font-medium py-2 px-6 rounded-md transition duration-200"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Lookbook;
