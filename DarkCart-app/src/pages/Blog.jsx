import React from 'react';
import { Link } from 'react-router-dom';

function Blog() {
  // Sample blog posts data
  const blogPosts = [
    {
      id: 1,
      title: "Summer Fashion Trends 2025",
      excerpt: "Discover the hottest trends for summer 2025, from vibrant colors to sustainable fabrics.",
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      date: "July 8, 2025",
      category: "Trends"
    },
    {
      id: 2,
      title: "How to Style Casual Clothing for Office",
      excerpt: "Learn how to transform your casual wardrobe into office-appropriate outfits without sacrificing comfort.",
      image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      date: "July 2, 2025",
      category: "Style Tips"
    },
    {
      id: 3,
      title: "Sustainable Fashion: Making Better Choices",
      excerpt: "Explore how our brand is committed to sustainable practices and how you can make eco-friendly fashion choices.",
      image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      date: "June 25, 2025",
      category: "Sustainability"
    },
    {
      id: 4,
      title: "Care Guide: Extending the Life of Your Clothes",
      excerpt: "Tips and tricks to properly care for your garments and make them last longer while maintaining their quality.",
      image: "https://images.unsplash.com/photo-1574201635302-388dd92a4c3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      date: "June 18, 2025",
      category: "Care Guide"
    },
    {
      id: 5,
      title: "Meet the Designers Behind Our Collections",
      excerpt: "Get to know the creative minds who design our signature collections and their inspiration.",
      image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      date: "June 10, 2025",
      category: "Behind the Scenes"
    },
    {
      id: 6,
      title: "Accessorizing Your Casual Outfits",
      excerpt: "Learn how the right accessories can elevate your everyday casual look to something extraordinary.",
      image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      date: "June 5, 2025",
      category: "Style Tips"
    }
  ];

  // Categories for filter
  const categories = ["All", "Trends", "Style Tips", "Sustainability", "Care Guide", "Behind the Scenes"];
  
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className='bg-white shadow-sm p-4 mb-6 flex items-center justify-between border-b border-gray-200'>
        <h1 className='text-xl font-bold text-gray-900 font-serif'>Fashion Blog</h1>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Featured Post */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-10">
          <div className="md:flex">
            <div className="md:flex-shrink-0">
              <img 
                className="h-48 w-full object-cover md:w-64 md:h-full" 
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                alt="Featured blog post" 
              />
            </div>
            <div className="p-6">
              <div className="flex items-center">
                <span className="bg-black/5 text-black text-xs font-medium px-2.5 py-0.5 rounded">Featured</span>
                <span className="text-gray-500 text-sm ml-2">July 11, 2025</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mt-2">The Evolution of Casual Fashion: Past, Present, and Future</h2>
              <p className="mt-3 text-gray-600">
                From its humble beginnings to becoming a mainstay in modern wardrobes, casual fashion has transformed how we express ourselves. In this feature article, we explore the journey of casual wear and predict what's coming next.
              </p>
              <div className="mt-4">
                <Link to="/blog/featured" className="text-black hover:text-gray-800 font-medium">
                  Read full article →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category, index) => (
            <button
              key={index}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                index === 0 
                  ? 'theme-bg-primary text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {blogPosts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-sm overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
              <img 
                className="w-full h-48 object-cover" 
                src={post.image} 
                alt={post.title} 
              />
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">{post.category}</span>
                  <span className="text-gray-500 text-xs">{post.date}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h3>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                <Link to={`/blog/${post.id}`} className="text-black hover:text-gray-800 font-medium text-sm">
                  Read more →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="bg-black/5 rounded-lg p-6 md:p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Subscribe to Our Newsletter</h3>
            <p className="text-gray-600 mt-2">Get the latest fashion tips, trends, and exclusive offers delivered to your inbox.</p>
          </div>
          <form className="flex flex-col md:flex-row gap-3 max-w-md mx-auto">
            <input 
              type="email" 
              className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Enter your email" 
              required 
            />
            <button 
              type="submit" 
              className="bg-black hover:bg-black/90 text-white font-medium py-2 px-6 rounded-md transition duration-200"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Blog;
