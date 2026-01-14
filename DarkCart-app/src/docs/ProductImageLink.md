# ProductImageLink Component Documentation

## Overview

The `ProductImageLink` component provides a consistent way to display product images across the e-commerce application with built-in navigation to the product display page. This ensures a seamless shopping experience similar to Amazon, where users can click on product images from various pages to view detailed product information.

## Features

- **Clickable Product Images**: Images automatically navigate to the product detail page when clicked
- **Consistent Navigation**: Works across Bag, Address, Checkout, Order Details, etc.
- **Fallback Image Handling**: Automatically shows a default image if the product image fails to load
- **Hover Effects**: Provides visual feedback when users hover over images
- **Flexible Styling**: Customizable with various props for different display contexts
- **Bundle Support**: Special handling for bundle products

## Usage

```jsx
import ProductImageLink from '../components/ProductImageLink';

// Basic usage
<ProductImageLink 
  imageUrl={product.image} 
  productId={product._id} 
  alt="Product Name"
/>

// With custom dimensions
<ProductImageLink 
  imageUrl={product.image} 
  productId={product._id}
  width="100px"
  height="100px"
/>

// With custom styling
<ProductImageLink 
  imageUrl={product.image} 
  productId={product._id}
  className="rounded-lg shadow-md" 
  imageClassName="object-contain"
/>

// Disable navigation (for modals or special cases)
<ProductImageLink 
  imageUrl={product.image} 
  productId={product._id}
  disableNavigation={true}
/>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `imageUrl` | `string\|array` | URL of the product image or array of image URLs (first will be used) |
| `productId` | `string` | ID of the product for navigation |
| `alt` | `string` | Alternative text for the image (default: "Product Image") |
| `imageStyle` | `object` | Custom inline styles for the image |
| `containerStyle` | `object` | Custom inline styles for the container |
| `className` | `string` | Additional CSS classes for the container |
| `imageClassName` | `string` | Additional CSS classes for the image |
| `onClick` | `function` | Optional custom click handler |
| `disableNavigation` | `boolean` | If true, clicking the image won't navigate (useful in modals) |
| `width` | `string\|number` | Width of the image container |
| `height` | `string\|number` | Height of the image container |

## Implementation

The component has been integrated into the following pages:

1. **Bag Page**: Product images in the shopping bag
2. **Address Page**: Product thumbnails in the order summary 
3. **Payment Page**: Product thumbnails in the checkout summary
4. **Order Details Modal**: Product images in order history
5. **Product Details Modal**: Main product image in the details view

## Hover Effect

The component includes a subtle hover effect that:

1. Slightly scales up the image (transform: scale(1.05))
2. Adds a soft shadow
3. Shows a "View Product" indicator

This provides visual feedback and encourages users to click on the images.

## Future Improvements

Potential enhancements to consider:

1. Add click tracking analytics
2. Implement image lazy loading for performance
3. Add zoom effect on hover for product detail pages
4. Support for multiple images with carousel functionality
5. Add badge indicators for sale/discount items
