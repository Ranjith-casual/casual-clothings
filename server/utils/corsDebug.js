// CORS Configuration Debug Utility
// This file helps debug CORS issues by logging the configured origins

export const logCorsConfiguration = (corsOptions) => {
  console.log("\n==== CORS CONFIGURATION ====");
  console.log("Allowed Origins:");
  
  // Get the allowedOrigins from the corsOptions function
  const mockCallback = (error, allowed) => {
    // Do nothing, this is just to extract values
  };
  
  // List environment variables related to origins
  const originEnvVars = {
    FRONT_URL: process.env.FRONT_URL || 'Not set',
    PRODUCTION_URL: process.env.PRODUCTION_URL || 'Not set',
    WWW_PRODUCTION_URL: process.env.WWW_PRODUCTION_URL || 'Not set'
  };
  
  console.log("Environment Variables:");
  Object.entries(originEnvVars).forEach(([key, value]) => {
    console.log(`  - ${key}: ${value}`);
  });
  
  console.log("===========================\n");
};

export default logCorsConfiguration;
