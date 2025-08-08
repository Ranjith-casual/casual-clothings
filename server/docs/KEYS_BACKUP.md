# Razorpay Keys Backup

## Test Mode Keys (Backup)
```env
RAZORPAY_KEY_ID=rzp_test_iqQQWpjToYUjjV
RAZORPAY_KEY_SECRET=cLSXYEtzfXXcnWhhkpGmYaYx
```

## Live Mode Keys (Current)
```env
RAZORPAY_KEY_ID=rzp_live_4vBi43QmdIkR0s
RAZORPAY_KEY_SECRET=jAVH0QgD1ee0mLfG6KdlOfSg
```

## Webhook Secret (Same for both)
```env
RAZORPAY_WEBHOOK_SECRET=2970ce1ac106b73a470b7e3475b6985daff2f598c5539d6864cdc824492ed306
```

## Switch Back to Test Mode
If you need to switch back to test mode, run:
```bash
cd server
node update-razorpay-keys.js rzp_test_iqQQWpjToYUjjV cLSXYEtzfXXcnWhhkpGmYaYx 2970ce1ac106b73a470b7e3475b6985daff2f598c5539d6864cdc824492ed306
```

## Switch to Live Mode  
To switch to live mode, run:
```bash
cd server
node update-razorpay-keys.js rzp_live_4vBi43QmdIkR0s jAVH0QgD1ee0mLfG6KdlOfSg 2970ce1ac106b73a470b7e3475b6985daff2f598c5539d6864cdc824492ed306
```
