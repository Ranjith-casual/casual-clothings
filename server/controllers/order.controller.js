import mongoose from "mongoose";
import orderModel from "../models/order.model.js";
import UserModel from "../models/users.model.js";
import CartProductModel from "../models/cartProduct.model.js";
import ProductModel from "../models/product.model.js";
import BundleModel from "../models/bundles.js"; // Add bundle model import
import sendEmail from "../config/sendEmail.js";
import fs from 'fs';

export const onlinePaymentOrderController = async (req, res) => {
  try {
    const userId = req.userId;
    const { list_items, totalAmount, addressId, subTotalAmt, quantity, paymentMethod } = req.body;

    // Get user details for email
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "User not found"
      });
    }

    // Validate stock availability before processing order
    try {
      for (const item of list_items) {
        // Process item validation

        // Add null check for item itself
        if (!item) {
          return res.status(400).json({
            success: false,
            error: true,
            message: "Invalid item: item is null or undefined"
          });
        }

        // Determine if this is a bundle or product item - more robust checking
        const isBundle = !!(item.bundleId && (
          (typeof item.bundleId === 'object' && item.bundleId && item.bundleId._id) || 
          (typeof item.bundleId === 'string' && item.bundleId.length > 0)
        ));
        
        const isProduct = !!(item.productId && (
          (typeof item.productId === 'object' && item.productId && item.productId._id) || 
          (typeof item.productId === 'string' && item.productId.length > 0)
        ));
      
      if (isBundle) {
        // Validate bundle exists
        let bundleId;
        try {
          bundleId = (typeof item.bundleId === 'object' && item.bundleId && item.bundleId._id) ? item.bundleId._id : item.bundleId;
        } catch (bundleIdError) {
          return res.status(400).json({
            success: false,
            error: true,
            message: "Error extracting bundle ID from item"
          });
        }

        const bundle = await BundleModel.findById(bundleId);
        if (!bundle) {
          return res.status(404).json({
            success: false,
            error: true,
            message: `Bundle ${item.bundleId?.title || bundleId || 'Unknown'} not found`
          });
        }
        
        // Check if bundle is active
        if (!bundle.isActive) {
          return res.status(400).json({
            success: false,
            error: true,
            message: `Bundle ${bundle.title} is currently not available`
          });
        }
        
        // Check if bundle has enough stock
        if (bundle.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            error: true,
            message: `Insufficient stock for bundle ${bundle.title}. Available: ${bundle.stock}, Requested: ${item.quantity}`
          });
        }
        
        // Check if bundle is time-limited and within valid time period
        if (bundle.isTimeLimited) {
          const now = new Date();
          if (now < bundle.startDate || now > bundle.endDate) {
            return res.status(400).json({
              success: false,
              error: true,
              message: `Bundle ${bundle.title} is no longer available (time-limited offer expired)`
            });
          }
        }
      } else if (isProduct) {
        // Validate product exists and has sufficient stock
        let productId;
        try {
          productId = (typeof item.productId === 'object' && item.productId && item.productId._id) ? item.productId._id : item.productId;
          console.log("Extracted productId:", productId);
        } catch (productIdError) {
          console.log("Error extracting productId:", productIdError.message);
          return res.status(400).json({
            success: false,
            error: true,
            message: "Error extracting product ID from item"
          });
        }

        const product = await ProductModel.findById(productId);
        if (!product) {
          return res.status(404).json({
            success: false,
            error: true,
            message: `Product ${item.productId?.name || productId || 'Unknown'} not found`
          });
        }
        
        if (product.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            error: true,
            message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
          });
        }
      } else {
        console.log('Invalid item - neither product nor bundle:', JSON.stringify(item, null, 2));
        return res.status(400).json({
          success: false,
          error: true,
          message: `Invalid item: neither product nor bundle - received: ${JSON.stringify({
            hasProductId: !!item.productId,
            hasBundleId: !!item.bundleId,
            productIdType: typeof item.productId,
            bundleIdType: typeof item.bundleId,
            productIdValue: item.productId,
            bundleIdValue: item.bundleId
          })}`
        });
      }
    }
    } catch (validationError) {
      console.error("Error validating stock availability:", validationError);
      return res.status(500).json({
        success: false,
        error: true,
        message: "Error validating stock availability",
        details: validationError.message
      });
    }

    // Create single order payload with all items
    const orderId = `ORD-${new mongoose.Types.ObjectId()}`;
    
    // Calculate estimated delivery date (3-5 business days from order date)
    const calculateEstimatedDeliveryDate = () => {
        const orderDate = new Date();
        const businessDaysToAdd = 5; // 5 business days
        let currentDate = new Date(orderDate);
        let addedDays = 0;
        
        while (addedDays < businessDaysToAdd) {
            currentDate.setDate(currentDate.getDate() + 1);
            // Skip weekends (Saturday = 6, Sunday = 0)
            if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
                addedDays++;
            }
        }
        
        return currentDate;
    };
    
    // Process items to ensure we have complete product/bundle details
    const processedItems = [];
    
    // Process each item synchronously to avoid async issues in map
    for (const item of list_items) {
      const isBundle = !!(item.bundleId && (
        (typeof item.bundleId === 'object' && item.bundleId._id) || 
        (typeof item.bundleId === 'string')
      ));
      
      if (isBundle) {
        const bundleId = (typeof item.bundleId === 'object' && item.bundleId._id) ? item.bundleId._id : item.bundleId;
        
        // Use provided bundle details or try to fetch them
        let bundleDetails = item.bundleDetails;
        
        // If no bundleDetails provided, try to get from database
        if (!bundleDetails || !bundleDetails.title) {
          try {
            const bundle = await BundleModel.findById(bundleId);
            console.log("Fetched bundle details:", bundle);
            if (bundle) {
              bundleDetails = {
                title: bundle.title,
                // Use images array if available, otherwise fallback to image string
                image: bundle.image || (bundle.images && bundle.images.length > 0 ? bundle.images[0] : ''),
                images: bundle.images || [],
                bundlePrice: bundle.bundlePrice
              };
            }
          } catch (error) {
            console.error("Error fetching bundle details:", error);
          }
        }
        
        processedItems.push({
          bundleId: bundleId,
          itemType: 'bundle',
          bundleDetails: bundleDetails || {
            title: 'Bundle',
            image: '',
            bundlePrice: 0
          },
          quantity: item.quantity,
          itemTotal: (bundleDetails?.bundlePrice || 0) * item.quantity
        });
      } else {
        const productId = (typeof item.productId === 'object' && item.productId._id) ? item.productId._id : item.productId;
        
        // Use provided product details or try to fetch them
        let productDetails = item.productDetails;
        
        // If no productDetails provided, try to get from database
        if (!productDetails || !productDetails.name) {
          try {
            const product = await ProductModel.findById(productId);
            if (product) {
              productDetails = {
                name: product.name,
                image: product.image,
                price: product.price,
                discount: product.discount
              };
            }
          } catch (error) {
            console.error("Error fetching product details:", error);
          }
        }
        
        processedItems.push({
          productId: productId,
          itemType: 'product',
          productDetails: productDetails || {
            name: 'Product',
            image: [],
            price: 0
          },
          quantity: item.quantity,
          itemTotal: (productDetails?.price || 0) * item.quantity
        });
      }
    }
    
    // Now create the payload with the processed items
    const payload = {
      userId: userId,
      orderId: orderId,
      items: processedItems,
      paymentId: "",
      totalQuantity: quantity, // Total quantity of all items
      orderDate: new Date(),
      estimatedDeliveryDate: calculateEstimatedDeliveryDate(),
      paymentStatus: "PAID", // Always PAID for online payments
      paymentMethod: paymentMethod || "Online Payment",
      deliveryAddress: addressId,
      subTotalAmt: subTotalAmt,
      totalAmt: totalAmount,
      orderStatus: "ORDER PLACED"
    };

    console.log("Single Order Payload:", payload);

    // Use transaction to ensure data consistency
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create single order
      const generatedOrder = await orderModel.create([payload], { session });

      // Update stock for each product and bundle
      for (const item of list_items) {
        const isProduct = !!(item.productId && (
          (typeof item.productId === 'object' && item.productId._id) || 
          (typeof item.productId === 'string')
        ));
        
        const isBundle = !!(item.bundleId && (
          (typeof item.bundleId === 'object' && item.bundleId._id) || 
          (typeof item.bundleId === 'string')
        ));
        
        if (isProduct) {
          const productId = (typeof item.productId === 'object' && item.productId._id) ? item.productId._id : item.productId;
          await ProductModel.findByIdAndUpdate(
            productId,
            { 
              $inc: { stock: -item.quantity } // Decrease stock by ordered quantity
            },
            { session, new: true }
          );
        } else if (isBundle) {
          // Update bundle stock
          const bundleId = (typeof item.bundleId === 'object' && item.bundleId._id) ? item.bundleId._id : item.bundleId;
          await BundleModel.findByIdAndUpdate(
            bundleId,
            { 
              $inc: { stock: -item.quantity } // Decrease bundle stock by ordered quantity
            },
            { session, new: true }
          );
        }
      }

      // Clear only the ordered items from user's cart
      const orderedItemIds = list_items.map(item => item._id);
      await CartProductModel.deleteMany(
        { 
          userId: userId, 
          _id: { $in: orderedItemIds }
        }, 
        { session }
      );
      
      // Update user's shopping_cart array to remove only ordered items
      const remainingCartItems = await CartProductModel.find({ userId: userId }).session(session);
      await UserModel.updateOne(
        { _id: userId },
        { shopping_cart: remainingCartItems.map(item => item._id) },
        { session }
      );

      // Commit transaction
      await session.commitTransaction();

      // Send confirmation email with proper recipient
      try {
        await sendEmail({
          sendTo: user.email,
          subject: "Order Confirmation - Casual Clothing Fashion",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Order Confirmation</h2>
              <p>Dear ${user.name},</p>
              <p>Thank you for your order! Your order has been placed successfully.</p>
              
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Order Details:</h3>
                <p><strong>Order ID:</strong> ${generatedOrder[0].orderId}</p>
                <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Estimated Delivery Date:</strong> ${generatedOrder[0].estimatedDeliveryDate ? new Date(generatedOrder[0].estimatedDeliveryDate).toLocaleDateString() : 'To be confirmed'}</p>
                <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
                <p><strong>Payment Method:</strong> ${paymentMethod || "Online Payment"}</p>
                <p><strong>Total Items:</strong> ${quantity}</p>
                
                <h4>Items Ordered:</h4>
                ${payload.items.map(item => `
                  <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                    <p><strong>${item.itemType === 'bundle' ? 'Bundle' : 'Product'}:</strong> ${item.itemType === 'bundle' ? item.bundleDetails.title : item.productDetails.name}</p>
                    <p><strong>Quantity:</strong> ${item.quantity}</p>
                    <p><strong>Price:</strong> ₹${item.itemType === 'bundle' ? item.bundleDetails.bundlePrice : item.productDetails.price}</p>
                    <p><strong>Item Total:</strong> ₹${item.itemTotal}</p>
                  </div>
                `).join('')}
              </div>
              
              <p>Your order will be delivered to your specified address by ${generatedOrder[0].estimatedDeliveryDate ? new Date(generatedOrder[0].estimatedDeliveryDate).toLocaleDateString() : '3-5 business days'}.</p>
              <p>You can track your order status from your account dashboard.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 12px;">
                <p>Thank you for shopping with Casual Clothing Fashion!</p>
                <p>This is an automated email. Please do not reply to this message.</p>
              </div>
            </div>
          `
        });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Don't fail the order if email fails
      }

      return res.json({
        message: "Order placed successfully",
        error: false,
        success: true,
        data: generatedOrder[0], // Return single order instead of array
      });

    } catch (transactionError) {
      // Abort transaction on error
      console.error("Transaction error:", transactionError);
      await session.abortTransaction();
      throw transactionError;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error("=== ORDER ERROR START ===");
    console.error("Error details:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("=== ORDER ERROR END ===");
    
    return res.status(500).json({
      success: false,
      error: true,
      message: "Error in cash payment controller",
      details: error.message,
    });
  }
};

// Add function to restore stock when order is cancelled
export const cancelOrderController = async (req, res) => {
    try {
        const { orderId } = req.body;
        const userId = req.userId;

        // Find the order
        const order = await orderModel.findOne({ orderId: orderId, userId: userId });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "Order not found"
            });
        }

        // Check if order can be cancelled
        if (order.orderStatus === "DELIVERED" || order.orderStatus === "CANCELLED") {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Order cannot be cancelled"
            });
        }

        // Use transaction for data consistency
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Update order status to cancelled
            const updatedOrder = await orderModel.findOneAndUpdate(
                { orderId: orderId, userId: userId },
                { 
                  orderStatus: "CANCELLED",
                  paymentStatus: "CANCELLED"
                },
                { new: true, session }
            );

            // Restore stock for all items in the cancelled order
            for (const item of order.items) {
                if (item.itemType === 'bundle') {
                    // Restore bundle stock
                    await BundleModel.findByIdAndUpdate(
                        item.bundleId,
                        { 
                            $inc: { stock: item.quantity } // Add back the cancelled quantity
                        },
                        { session, new: true }
                    );
                } else {
                    // Restore product stock
                    await ProductModel.findByIdAndUpdate(
                        item.productId,
                        { 
                            $inc: { stock: item.quantity } // Add back the cancelled quantity
                        },
                        { session, new: true }
                    );
                }
            }

            await session.commitTransaction();

            // Get user details for email notification
            const user = await UserModel.findById(userId);
            
            // Send cancellation email
            if (user && user.email) {
                try {
                    await sendEmail({
                        sendTo: user.email,
                        subject: "Order Cancellation Confirmation - Casual Clothing Fashion",
                        html: `
                          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                            <h2 style="color: #d32f2f; border-bottom: 1px solid #eee; padding-bottom: 10px;">Order Cancelled</h2>
                            <p>Dear ${user.name},</p>
                            <p>Your order has been cancelled successfully as requested.</p>
                            
                            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                              <h3 style="margin-top: 0; color: #856404;">Cancelled Order Details:</h3>
                              <p><strong>Order ID:</strong> ${orderId}</p>
                              <p><strong>Cancellation Date:</strong> ${new Date().toLocaleDateString()}</p>
                              <p><strong>Total Items:</strong> ${order.totalQuantity}</p>
                              
                              <h4>Cancelled Items:</h4>
                              ${order.items.map(item => `
                                <div style="border-bottom: 1px solid #eee; padding: 5px 0;">
                                  <p><strong>${item.itemType === 'bundle' ? 'Bundle' : 'Product'}:</strong> ${item.itemType === 'bundle' ? item.bundleDetails?.title : item.productDetails?.name}</p>
                                  <p><strong>Quantity:</strong> ${item.quantity} (Stock Restored)</p>
                                </div>
                              `).join('')}
                            </div>
                            
                            <p>All items have been restored to inventory. If you have any questions, please contact our customer support.</p>
                            
                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 12px;">
                              <p>Thank you for choosing Casual Clothing Fashion!</p>
                              <p>This is an automated email. Please do not reply to this message.</p>
                            </div>
                          </div>
                        `
                    });
                } catch (emailError) {
                    console.error("Cancellation email sending failed:", emailError);
                }
            }

            return res.json({
                success: true,
                error: false,
                message: "Order cancelled successfully and stock restored",
                data: updatedOrder
            });

        } catch (transactionError) {
            await session.abortTransaction();
            throw transactionError;
        } finally {
            session.endSession();
        }

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error in cancelling order",
            details: error.message
        });
    }
}

// Update order status controller to handle stock when order is delivered/cancelled
// export const updateOrderStatusController = async (req, res) => {
//     try {
//         const { orderId, orderStatus } = req.body;
        
//         // Validate input
//         if (!orderId || !orderStatus) {
//             return res.status(400).json({
//                 success: false,
//                 error: true,
//                 message: "Order ID and status are required"
//             });
//         }
        
//         // Valid status values
//         const validStatuses = ["ORDER PLACED", "PROCESSING", "OUT FOR DELIVERY", "DELIVERED", "CANCELLED"];
//         if (!validStatuses.includes(orderStatus)) {
//             return res.status(400).json({
//                 success: false,
//                 error: true,
//                 message: "Invalid order status value"
//             });
//         }

//         // Find the order
//         const order = await orderModel.findOne({ orderId: orderId });
        
//         if (!order) {
//             return res.status(404).json({
//                 success: false,
//                 error: true,
//                 message: "Order not found"
//             });
//         }

//         const previousStatus = order.orderStatus;

//         // Use transaction for data consistency
//         const session = await mongoose.startSession();
//         session.startTransaction();

//         try {
//             // Prepare update object
//             const updateData = { orderStatus: orderStatus };
            
//             // If the order is delivered and payment method is cash on delivery, set payment status to PAID
//             if (orderStatus === "DELIVERED" && order.paymentStatus === "CASH ON DELIVERY") {
//                 updateData.paymentStatus = "PAID";
//             }

//             // Handle stock restoration for cancelled orders (updated for multiple items)
//             if (orderStatus === "CANCELLED" && previousStatus !== "CANCELLED") {
//                 // Restore stock for all items when order is cancelled
//                 for (const item of order.items) {
//                     await ProductModel.findByIdAndUpdate(
//                         item.productId,
//                         { 
//                             $inc: { stock: item.quantity }
//                         },
//                         { session, new: true }
//                     );
//                 }
//             }

//             // Update order status
//             const updatedOrder = await orderModel.findOneAndUpdate(
//                 { orderId: orderId },
//                 updateData,
//                 { new: true, session }
//             ).populate("userId", "name email")
//              .populate("items.productId", "name image price stock") // Updated populate path
//              .populate("deliveryAddress", "address_line city state pincode country");

//             await session.commitTransaction();

//             // Get user details for email notification
//             const user = await UserModel.findById(order.userId);
            
//             // Send status update email
//             if (user && user.email) {
//                 try {
//                     const statusMap = {
//                         "ORDER PLACED": "placed",
//                         "PROCESSING": "being processed",
//                         "OUT FOR DELIVERY": "out for delivery",
//                         "DELIVERED": "delivered",
//                         "CANCELLED": "cancelled"
//                     };
                    
//                     const statusText = statusMap[orderStatus] || orderStatus.toLowerCase();
                    
//                     await sendEmail({
//                         sendTo: user.email,
//                         subject: `Order Status Update - ${orderStatus} - Casual Clothing Fashion`,
//                         html: `
//                           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
//                             <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Order Status Update</h2>
//                             <p>Dear ${user.name},</p>
//                             <p>Your order with ID: <strong>${orderId}</strong> has been updated.</p>
                            
//                             <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4caf50;">
//                               <h3 style="margin-top: 0; color: #333;">New Status: ${orderStatus}</h3>
//                               <p>Your order is now being ${statusText}.</p>
//                               ${orderStatus === "CANCELLED" ? `
//                                 <p style="color: #d32f2f;"><strong>Stock Restored:</strong></p>
//                                 ${order.items.map(item => `
//                                   <p style="color: #d32f2f; margin-left: 20px;">• ${item.productDetails.name}: ${item.quantity} units restored</p>
//                                 `).join('')}
//                               ` : ''}
//                             </div>
                            
//                             <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 12px;">
//                               <p>Thank you for shopping with Casual Clothing Fashion!</p>
//                               <p>This is an automated email. Please do not reply to this message.</p>
//                             </div>
//                           </div>
//                         `
//                     });
//                 } catch (emailError) {
//                     console.error("Status update email sending failed:", emailError);
//                 }
//             }

//             return res.json({
//                 success: true,
//                 error: false,
//                 message: "Order status updated successfully",
//                 data: updatedOrder
//             });

//         } catch (transactionError) {
//             await session.abortTransaction();
//             throw transactionError;
//         } finally {
//             session.endSession();
//         }

//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             error: true,
//             message: "Error updating order status",
//             details: error.message
//         });
//     }
// }
export const getOrderController = async (req, res) => {
    try {
        const userId = req.userId;
        const orders = await orderModel.find({ userId: userId })
          .sort({createdAt: -1})
          .populate("items.productId", "name image price stock discount") // Updated populate path
          .populate("items.bundleId", "title description image images bundlePrice originalPrice stock items") // Include items array
          .populate("deliveryAddress", "address_line city state pincode country")
          .populate("userId", "name email");
          
        return res.json({
            success: true,
            error: false,
            message: "Orders fetched successfully",
            data: orders
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error in fetching orders",
            details: error.message
        });
    }
}

// Get single order by ID
export const getOrderByIdController = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.userId;
        
        const order = await orderModel.findOne({ orderId: orderId, userId: userId })
          .populate("items.productId", "name image price stock discount")
          .populate("items.bundleId", "title description image images bundlePrice originalPrice stock items")
          .populate("deliveryAddress", "address_line city state pincode country")
          .populate("userId", "name email");
          
        if (!order) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "Order not found"
            });
        }
          
        return res.json({
            success: true,
            error: false,
            message: "Order fetched successfully",
            data: order
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error in fetching order",
            details: error.message
        });
    }
}

// Get order statistics for admin dashboard
export const getOrderStatsController = async (req, res) => {
    try {
        const totalOrders = await orderModel.countDocuments();
        const pendingOrders = await orderModel.countDocuments({ orderStatus: "ORDER PLACED" });
        const processingOrders = await orderModel.countDocuments({ orderStatus: "PROCESSING" });
        const deliveredOrders = await orderModel.countDocuments({ orderStatus: "DELIVERED" });
        const cancelledOrders = await orderModel.countDocuments({ orderStatus: "CANCELLED" });
        
        // Calculate total revenue from delivered orders
        const revenueResult = await orderModel.aggregate([
            { $match: { orderStatus: "DELIVERED" } },
            { $group: { _id: null, totalRevenue: { $sum: "$totalAmt" } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
        
        // Get recent orders (last 10)
        const recentOrders = await orderModel.find({})
          .sort({ createdAt: -1 })
          .limit(10)
          .populate("userId", "name email")
          .populate("deliveryAddress", "city state");
        
        return res.json({
            success: true,
            error: false,
            message: "Order statistics fetched successfully",
            data: {
                totalOrders,
                pendingOrders,
                processingOrders,
                deliveredOrders,
                cancelledOrders,
                totalRevenue,
                recentOrders
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error in fetching order statistics",
            details: error.message
        });
    }
}

export const getAllOrdersController = async (req, res) => {
    try {
        const orders = await orderModel.find({})
          .sort({createdAt: -1})
          .populate("userId", "name email")
          .populate("items.productId", "name image price stock discount") // Updated populate path
          .populate("items.bundleId", "title description image images bundlePrice originalPrice stock items") // Include items array
          .populate("deliveryAddress", "address_line city state pincode country");
          
        return res.json({
            success: true,
            error: false,
            message: "Orders fetched successfully",
            data: orders
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error in fetching orders",
            details: error.message
        });
    }
}

// Also update the updateOrderStatusController to work with the new structure
export const updateOrderStatusController = async (req, res) => {
    try {
        const { orderId, orderStatus } = req.body;
        
        // Validate input
        if (!orderId || !orderStatus) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Order ID and status are required"
            });
        }
        
        // Valid status values
        const validStatuses = ["ORDER PLACED", "PROCESSING", "OUT FOR DELIVERY", "DELIVERED", "CANCELLED"];
        if (!validStatuses.includes(orderStatus)) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Invalid order status value"
            });
        }

        // Find the order
        const order = await orderModel.findOne({ orderId: orderId });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "Order not found"
            });
        }

        const previousStatus = order.orderStatus;

        // Use transaction for data consistency
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Prepare update object
            const updateData = { orderStatus: orderStatus };
            
            // If the order is delivered, set actual delivery date and payment status
            if (orderStatus === "DELIVERED") {
                updateData.actualDeliveryDate = new Date();
                if (order.paymentStatus === "CASH ON DELIVERY") {
                    updateData.paymentStatus = "PAID";
                }
            }

            // Handle stock restoration for cancelled orders (updated for multiple items)
            if (orderStatus === "CANCELLED" && previousStatus !== "CANCELLED") {
                // Restore stock for all items when order is cancelled
                for (const item of order.items) {
                    if (item.itemType === 'bundle') {
                        // Restore bundle stock
                        await BundleModel.findByIdAndUpdate(
                            item.bundleId,
                            { 
                                $inc: { stock: item.quantity }
                            },
                            { session, new: true }
                        );
                    } else {
                        // Restore product stock
                        await ProductModel.findByIdAndUpdate(
                            item.productId,
                            { 
                                $inc: { stock: item.quantity }
                            },
                            { session, new: true }
                        );
                    }
                }
            }

            // Update order status
            const updatedOrder = await orderModel.findOneAndUpdate(
                { orderId: orderId },
                updateData,
                { new: true, session }
            ).populate("userId", "name email")
             .populate("items.productId", "name image price stock") // Updated populate path
             .populate("items.bundleId", "title images bundlePrice stock") // Add bundle population
             .populate("deliveryAddress", "address_line city state pincode country");

            await session.commitTransaction();

            // Get user details for email notification
            const user = await UserModel.findById(order.userId);
            
            // Send status update email
            if (user && user.email) {
                try {
                    const statusMap = {
                        "ORDER PLACED": "placed",
                        "PROCESSING": "being processed",
                        "OUT FOR DELIVERY": "out for delivery",
                        "DELIVERED": "delivered",
                        "CANCELLED": "cancelled"
                    };
                    
                    const statusText = statusMap[orderStatus] || orderStatus.toLowerCase();
                    
                    // If order is delivered, send delivery invoice email
                    if (orderStatus === "DELIVERED") {
                        try {
                            // Import the email function from payment controller
                            const { sendDeliveryInvoiceEmail } = await import('./payment.controller.js');
                            
                            // Send delivery invoice email with PDF attachment
                            await sendDeliveryInvoiceEmail(updatedOrder);
                        } catch (emailError) {
                            console.error('Error sending delivery invoice email:', emailError);
                            
                            // Fallback to regular email if invoice email fails
                            await sendEmail({
                                sendTo: user.email,
                                subject: `Order Status Update - ${orderStatus} - Casual Clothing Fashion`,
                                html: `
                                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                                    <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Order Status Update</h2>
                                    <p>Dear ${user.name},</p>
                                    <p>Your order with ID: <strong>${orderId}</strong> has been updated.</p>
                                    
                                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4caf50;">
                                      <h3 style="margin-top: 0; color: #333;">New Status: ${orderStatus}</h3>
                                      <p>Your order is now being ${statusText}.</p>
                                    </div>
                                    
                                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 12px;">
                                      <p>Thank you for shopping with Casual Clothing Fashion!</p>
                                      <p>This is an automated email. Please do not reply to this message.</p>
                                    </div>
                                  </div>
                                `
                            });
                        }
                    } else {
                        // Regular status update email for non-delivery statuses
                        await sendEmail({
                            sendTo: user.email,
                            subject: `Order Status Update - ${orderStatus} - Casual Clothing Fashion`,
                            html: `
                              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                                <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Order Status Update</h2>
                                <p>Dear ${user.name},</p>
                                <p>Your order with ID: <strong>${orderId}</strong> has been updated.</p>
                                
                                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4caf50;">
                                  <h3 style="margin-top: 0; color: #333;">New Status: ${orderStatus}</h3>
                                  <p>Your order is now being ${statusText}.</p>
                                  ${orderStatus === "CANCELLED" ? `
                                    <p style="color: #d32f2f;"><strong>Stock Restored:</strong></p>
                                    ${order.items.map(item => `
                                      <p style="color: #d32f2f; margin-left: 20px;">• ${item.itemType === 'bundle' ? item.bundleDetails?.title : item.productDetails?.name}: ${item.quantity} units restored</p>
                                    `).join('')}
                                  ` : ''}
                                </div>
                                
                                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 12px;">
                                  <p>Thank you for shopping with Casual Clothing Fashion!</p>
                                  <p>This is an automated email. Please do not reply to this message.</p>
                                </div>
                              </div>
                            `
                        });
                    }
                } catch (emailError) {
                    console.error("Status update email sending failed:", emailError);
                }
            }

            return res.json({
                success: true,
                error: false,
                message: "Order status updated successfully",
                data: updatedOrder
            });

        } catch (transactionError) {
            await session.abortTransaction();
            throw transactionError;
        } finally {
            session.endSession();
        }

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error updating order status",
            details: error.message
        });
    }
}

// Bulk update order status for multiple orders
export const bulkUpdateOrderStatusController = async (req, res) => {
    try {
        const { orderIds, orderStatus } = req.body;
        
        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Order IDs array is required"
            });
        }
        
        if (!orderStatus) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Order status is required"
            });
        }
        
        const validStatuses = ["ORDER PLACED", "PROCESSING", "OUT FOR DELIVERY", "DELIVERED", "CANCELLED"];
        if (!validStatuses.includes(orderStatus)) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Invalid order status value"
            });
        }
        
        const updatedOrders = [];
        const errors = [];
        
        // Process each order individually to handle stock updates properly
        for (const orderId of orderIds) {
            try {
                // Use the existing updateOrderStatusController logic for each order
                const order = await orderModel.findOne({ orderId: orderId });
                
                if (!order) {
                    errors.push({ orderId, error: "Order not found" });
                    continue;
                }
                
                const previousStatus = order.orderStatus;
                const session = await mongoose.startSession();
                session.startTransaction();
                
                try {
                    const updateData = { orderStatus: orderStatus };
                    
                    if (orderStatus === "DELIVERED" && order.paymentStatus === "CASH ON DELIVERY") {
                        updateData.paymentStatus = "PAID";
                    }
                    
                    // Handle stock restoration for cancelled orders
                    if (orderStatus === "CANCELLED" && previousStatus !== "CANCELLED") {
                        for (const item of order.items) {
                            if (item.itemType === 'bundle') {
                                await BundleModel.findByIdAndUpdate(
                                    item.bundleId,
                                    { $inc: { stock: item.quantity } },
                                    { session, new: true }
                                );
                            } else {
                                await ProductModel.findByIdAndUpdate(
                                    item.productId,
                                    { $inc: { stock: item.quantity } },
                                    { session, new: true }
                                );
                            }
                        }
                    }
                    
                    const updatedOrder = await orderModel.findOneAndUpdate(
                        { orderId: orderId },
                        updateData,
                        { new: true, session }
                    );
                    
                    await session.commitTransaction();
                    updatedOrders.push(updatedOrder);
                    
                } catch (transactionError) {
                    await session.abortTransaction();
                    errors.push({ orderId, error: transactionError.message });
                } finally {
                    session.endSession();
                }
                
            } catch (error) {
                errors.push({ orderId, error: error.message });
            }
        }
        
        return res.json({
            success: true,
            error: false,
            message: `Bulk update completed. ${updatedOrders.length} orders updated successfully.`,
            data: {
                updatedOrders,
                errors,
                totalProcessed: orderIds.length,
                successful: updatedOrders.length,
                failed: errors.length
            }
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error in bulk order status update",
            details: error.message
        });
    }
}

// Get orders by date range
export const getOrdersByDateRangeController = async (req, res) => {
    try {
        const { startDate, endDate, userId } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Start date and end date are required"
            });
        }
        
        const query = {
            orderDate: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };
        
        // If userId is provided, filter by user (for user-specific date range)
        if (userId) {
            query.userId = userId;
        }
        
        const orders = await orderModel.find(query)
          .sort({ createdAt: -1 })
          .populate("userId", "name email")
          .populate("items.productId", "name image price stock discount")
          .populate("items.bundleId", "title description image images bundlePrice originalPrice stock items")
          .populate("deliveryAddress", "address_line city state pincode country");
        
        return res.json({
            success: true,
            error: false,
            message: "Orders fetched successfully",
            data: {
                orders,
                count: orders.length,
                dateRange: { startDate, endDate }
            }
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error fetching orders by date range",
            details: error.message
        });
    }
}

// Search orders by multiple criteria
export const searchOrdersController = async (req, res) => {
    try {
        const { 
            orderId, 
            userEmail, 
            orderStatus, 
            paymentStatus, 
            paymentMethod,
            minAmount,
            maxAmount,
            page = 1,
            limit = 10
        } = req.query;
        
        const query = {};
        
        // Build search query
        if (orderId) {
            query.orderId = { $regex: orderId, $options: 'i' };
        }
        
        if (orderStatus) {
            query.orderStatus = orderStatus;
        }
        
        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }
        
        if (paymentMethod) {
            query.paymentMethod = { $regex: paymentMethod, $options: 'i' };
        }
        
        if (minAmount || maxAmount) {
            query.totalAmt = {};
            if (minAmount) query.totalAmt.$gte = parseFloat(minAmount);
            if (maxAmount) query.totalAmt.$lte = parseFloat(maxAmount);
        }
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        let orders = await orderModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate("userId", "name email")
          .populate("items.productId", "name image price stock discount")
          .populate("items.bundleId", "title description image images bundlePrice originalPrice stock items")
          .populate("deliveryAddress", "address_line city state pincode country");
        
        // Filter by user email if provided
        if (userEmail) {
            orders = orders.filter(order => 
                order.userId?.email?.toLowerCase().includes(userEmail.toLowerCase())
            );
        }
        
        const totalOrders = await orderModel.countDocuments(query);
        const totalPages = Math.ceil(totalOrders / parseInt(limit));
        
        return res.json({
            success: true,
            error: false,
            message: "Orders searched successfully",
            data: {
                orders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalOrders,
                    ordersPerPage: parseInt(limit),
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error searching orders",
            details: error.message
        });
    }
}

// Update delivery date for an order
export const updateDeliveryDateController = async (req, res) => {
    try {
        const { orderId, estimatedDeliveryDate, deliveryNotes } = req.body;
        
        if (!orderId) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Order ID is required"
            });
        }
        
        if (!estimatedDeliveryDate) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Estimated delivery date is required"
            });
        }
        
        // Find and update the order
        const updatedOrder = await orderModel.findOneAndUpdate(
            { orderId: orderId },
            { 
                estimatedDeliveryDate: new Date(estimatedDeliveryDate),
                deliveryNotes: deliveryNotes || ""
            },
            { new: true }
        ).populate("userId", "name email")
         .populate("deliveryAddress", "address_line city state pincode country");
        
        if (!updatedOrder) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "Order not found"
            });
        }
        
        // Send email notification to user about delivery date update
        if (updatedOrder.userId && updatedOrder.userId.email) {
            try {
                await sendEmail({
                    sendTo: updatedOrder.userId.email,
                    subject: `Delivery Date Updated - Order ${orderId}`,
                    html: `
                      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                        <h2 style="color: #2196F3; border-bottom: 1px solid #eee; padding-bottom: 10px;">Delivery Date Updated</h2>
                        <p>Dear ${updatedOrder.userId.name},</p>
                        <p>We wanted to update you about your order delivery schedule.</p>
                        
                        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196F3;">
                          <h3 style="margin-top: 0; color: #333;">Updated Delivery Information</h3>
                          <p><strong>Order ID:</strong> ${orderId}</p>
                          <p><strong>New Estimated Delivery Date:</strong> ${new Date(estimatedDeliveryDate).toLocaleDateString()}</p>
                          ${deliveryNotes ? `<p><strong>Delivery Notes:</strong> ${deliveryNotes}</p>` : ''}
                        </div>
                        
                        <p>We'll keep you updated if there are any further changes to your delivery schedule.</p>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 12px;">
                          <p>Thank you for shopping with Casual Clothing Fashion!</p>
                          <p>This is an automated email. Please do not reply to this message.</p>
                        </div>
                      </div>
                    `
                });
            } catch (emailError) {
                console.error("Delivery date update email sending failed:", emailError);
            }
        }
        
        return res.json({
            success: true,
            error: false,
            message: "Delivery date updated successfully",
            data: updatedOrder
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error updating delivery date",
            details: error.message
        });
    }
}
