export const apiKeyAuth = (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey || apiKey !== process.env.API_KEY) {
      return res.status(401).json({
        message: 'Invalid or missing API key',
        error: true,
        success: false
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      message: 'API key validation failed',
      error: true,
      success: false
    });
  }
};