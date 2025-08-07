# Razorpay Integration Setup Guide

## Where to Add Your Razorpay Keys

### Option 1: Environment Variables (.env file) - **Recommended**

Add your Razorpay credentials to the `/server/.env` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

### Option 2: Using the Update Script

Run the update script with your credentials:

```bash
cd server
node update-razorpay-keys.js <key_id> <key_secret> [webhook_secret]
```

Example:
```bash
node update-razorpay-keys.js rzp_test_1234567890 my_secret_key my_webhook_secret
```

## How to Get Your Razorpay Keys

### Step 1: Create a Razorpay Account
1. Go to [https://dashboard.razorpay.com/signup](https://dashboard.razorpay.com/signup)
2. Sign up for a free account
3. Complete the verification process

### Step 2: Get API Keys
1. Login to your Razorpay Dashboard
2. Go to **Settings** → **API Keys**
3. Click **Generate Test Keys** (for testing) or **Generate Live Keys** (for production)
4. Copy your **Key ID** and **Key Secret**

**Important:** 
- Use **Test Keys** for development/testing
- Use **Live Keys** only for production
- Test keys start with `rzp_test_`
- Live keys start with `rzp_live_`

### Step 3: Set Up Webhooks (Optional but Recommended)
1. In Razorpay Dashboard, go to **Settings** → **Webhooks**
2. Click **Create Webhook**
3. Set the URL to: `https://yourdomain.com/api/payment/razorpay/webhook`
4. Select these events:
   - `payment.captured`
   - `payment.failed`
   - `refund.created`
   - `refund.processed`
5. Generate a **Webhook Secret** and copy it

### Step 4: Update Your Configuration

**Method 1: Update .env file**
```env
RAZORPAY_KEY_ID=rzp_test_your_actual_key_id
RAZORPAY_KEY_SECRET=your_actual_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

**Method 2: Use the script**
```bash
node update-razorpay-keys.js rzp_test_your_actual_key_id your_actual_secret_key your_webhook_secret
```

### Step 5: Test the Integration
1. Restart your server: `npm start`
2. Go to the payment page in your frontend
3. You should now see "Pay with Razorpay" instead of "Payment Service Unavailable"

## Test Razorpay Integration

### Test Cards for Testing Mode
Use these test card numbers when testing:

**Successful Payment:**
- Card: `4111 1111 1111 1111`
- CVV: `123`
- Expiry: Any future date

**Failed Payment:**
- Card: `4000 0000 0000 0002`
- CVV: `123`
- Expiry: Any future date

### Test UPI IDs
- `success@razorpay` - Successful payment
- `failure@razorpay` - Failed payment

## Production Checklist

Before going live:

1. ✅ Replace test keys with live keys
2. ✅ Set up proper webhook URL
3. ✅ Test with real bank accounts (small amounts)
4. ✅ Enable required payment methods in Razorpay Dashboard
5. ✅ Set up proper error handling and logging
6. ✅ Configure proper HTTPS for webhook security

## Troubleshooting

### "Payment Service Unavailable" Error
- Check if your Razorpay keys are correctly set
- Verify the database has the payment settings
- Check server logs for API errors

### "Invalid API Key" Error
- Verify your Key ID and Secret are correct
- Ensure you're using the right environment (test/live)
- Check if the keys are properly loaded from environment variables

### Webhook Issues
- Verify webhook URL is accessible from internet
- Check webhook secret matches
- Ensure HTTPS is enabled for production webhooks

## Support

- Razorpay Documentation: [https://razorpay.com/docs/](https://razorpay.com/docs/)
- Razorpay Support: [https://razorpay.com/support/](https://razorpay.com/support/)
- Integration Guide: [https://razorpay.com/docs/payments/payment-gateway/](https://razorpay.com/docs/payments/payment-gateway/)
