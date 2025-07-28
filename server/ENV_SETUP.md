# Environment Variables Setup

For security reasons, domain URLs and other sensitive information have been moved to environment variables.

## Local Development Setup

1. Create a `.env` file in the server directory
2. Copy the contents from `.env.example` and update with your actual values
3. Never commit the `.env` file to version control

## Production Environment

For production deployment on Vercel, set these environment variables in the Vercel dashboard:

1. Go to your project settings in Vercel
2. Navigate to the "Environment Variables" section
3. Add the following variables:
   - `PRODUCTION_URL`: Your main domain (e.g., https://casualclothings.shop)
   - `WWW_PRODUCTION_URL`: Your www subdomain (e.g., https://www.casualclothings.shop)
   - `FRONT_URL`: Your frontend URL if different from above
   - Add any other variables from the `.env.example` file

## Important Security Note

By moving domain URLs to environment variables, you're improving security by:
- Preventing hardcoded values in your codebase
- Making it easier to manage different environments
- Keeping sensitive information out of your git repository
