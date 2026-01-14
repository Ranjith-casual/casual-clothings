import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Application error caught by boundary:", error, errorInfo);
    this.setState({ errorInfo });
    
    // Check if this is a CORS error or an image upload error
    if (error?.message?.includes('XMLHttpRequest') || 
        error?.message?.includes('CORS') || 
        error?.message?.includes("S is undefined") ||
        (error?.originalError && error?.originalError?.message?.includes('Network Error'))) {
      console.warn('CORS or image upload error detected');
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 max-w-md w-full border border-gray-100">
            <h2 className="text-red-600 text-lg sm:text-xl font-bold mb-4 tracking-wide">Something went wrong</h2>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2 tracking-wide text-sm sm:text-base">
                We're sorry, but there was an issue processing your request. This might be due to:
              </p>
              <ul className="list-disc pl-5 text-gray-600 text-xs sm:text-sm space-y-1.5 tracking-wide">
                <li>There might be a temporary connection issue</li>
                <li>The server might be experiencing problems</li>
                <li>The session might have expired</li>
                <li>The operation you're trying to perform might need permissions</li>
              </ul>
            </div>
            
            <div className="mb-6">
              <p className="text-xs sm:text-sm text-gray-500 tracking-wide">
                Error details: {this.state.error?.message || "Unknown error"}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => window.location.href = '/'} 
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-all font-semibold tracking-wider text-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-50 shadow-sm"
              >
                Return to Homepage
              </button>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-all font-medium tracking-wide text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-opacity-50"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
