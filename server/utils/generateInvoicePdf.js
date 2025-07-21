// PDF generation utility for invoices and refund documents
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generates a PDF invoice for orders or refunds
 * @param {Object} data - Order or refund data
 * @param {String} type - Type of PDF: 'delivery' or 'refund'
 * @returns {Promise<String>} Path to the generated PDF file
 */
export const generateInvoicePdf = async (data, type = 'delivery') => {
    return new Promise((resolve, reject) => {
        try {
            // Create a unique filename with timestamp
            const timestamp = Date.now();
            const fileName = `${type === 'refund' ? 'refund' : 'invoice'}_${data.orderId || data.orderNumber}_${timestamp}.pdf`;
            const filePath = path.join(__dirname, '../temp', fileName);
            
            // Ensure temp directory exists
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // Create PDF document
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                info: {
                    Title: `${type === 'refund' ? 'Refund Document' : 'Delivery Invoice'} - ${data.orderId || data.orderNumber}`,
                    Author: 'Casual Clothing Fashion',
                }
            });

            // Pipe PDF output to file
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Header with logo & company info
            doc.fontSize(20).font('Helvetica-Bold').text('Casual Clothing Fashion', { align: 'center' });
            doc.fontSize(12).font('Helvetica').text('123 Fashion Street, Tirupur, Tamil Nadu 641601', { align: 'center' });
            doc.text('Phone: +91 98765 43210 | Email: orders@casualclothings.com', { align: 'center' });
            doc.text('GST: 33ABCDE1234F1Z5', { align: 'center' });
            
            doc.moveDown(2);

            // Document title
            doc.fontSize(18).font('Helvetica-Bold').fillColor('#333')
               .text(type === 'refund' ? 'REFUND DOCUMENT' : 'DELIVERY INVOICE', { align: 'center' });
            
            doc.moveDown(1);
            doc.fontSize(12).font('Helvetica-Bold').text(`${type === 'refund' ? 'Refund' : 'Order'} ID: ${data.orderId || data.orderNumber}`);
            doc.fontSize(10).font('Helvetica').text(`Date: ${new Date().toLocaleDateString('en-IN', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}`);
            
            doc.moveDown(1);

            // Customer Information
            doc.fontSize(14).font('Helvetica-Bold').text('Customer Information');
            doc.fontSize(10).font('Helvetica')
               .text(`Name: ${data.userId?.name || data.customer?.name || data.user?.name || data.userName || 'N/A'}`)
               .text(`Email: ${data.userId?.email || data.customer?.email || data.user?.email || data.email || 'N/A'}`);
            
            if (type === 'delivery' && data.deliveryAddress) {
                doc.moveDown(0.5);
                doc.fontSize(12).font('Helvetica-Bold').text('Shipping Address');
                doc.fontSize(10).font('Helvetica')
                   .text(`${data.deliveryAddress.address_line || 'N/A'}`)
                   .text(`${data.deliveryAddress.city || ''}, ${data.deliveryAddress.state || ''} ${data.deliveryAddress.pincode || ''}`)
                   .text(`${data.deliveryAddress.country || 'India'}`);
            }
            
            doc.moveDown(1);

            if (type === 'refund') {
                // Refund Information
                doc.fontSize(14).font('Helvetica-Bold').text('Refund Information');
                doc.fontSize(10).font('Helvetica')
                   .text(`Refund ID: ${data.refundId || 'N/A'}`)
                   .text(`Original Order Date: ${data.orderDate ? new Date(data.orderDate).toLocaleDateString('en-IN') : 'N/A'}`)
                   .text(`Refund Processed Date: ${data.refundDate ? new Date(data.refundDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}`)
                   .text(`Refund Status: ${data.refundStatus || 'Completed'}`)
                   .text(`Refund Reason: ${data.refundReason || 'N/A'}`);
                
                doc.moveDown(1);
                
                // Refund Amount Box
                doc.rect(50, doc.y, 495, 60).fillAndStroke('#f0f0f0', '#cccccc');
                doc.fontSize(12).font('Helvetica-Bold').fillColor('#333').text('Refund Amount', 250, doc.y + 10, { align: 'center' });
                doc.fontSize(18).font('Helvetica-Bold').fillColor('#28a745')
                   .text(`₹ ${data.refundAmount?.toFixed(2) || '0.00'}`, { align: 'center' });
            }
            
            doc.moveDown(1);

            // Items Table
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#333').text('Order Items');
            
            // Table header
            const tableTop = doc.y + 10;
            const itemX = 50;
            const descX = 120;
            const sizeX = 300;
            const qtyX = 350;
            const priceX = 400;
            const totalX = 480;
            
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Item', itemX, tableTop);
            doc.text('Description', descX, tableTop);
            doc.text('Size', sizeX, tableTop);
            doc.text('Qty', qtyX, tableTop);
            doc.text('Price', priceX, tableTop);
            doc.text('Total', totalX, tableTop);
            
            // Draw header line
            doc.moveTo(50, tableTop + 15)
               .lineTo(545, tableTop + 15)
               .stroke();
            
            // Table rows
            let tableRow = tableTop + 25;
            
            // Add product items
            const items = data.items || data.products || [];
            items.forEach((item, i) => {
                // Get values with fallbacks
                const productName = item.productDetails?.name || item.name || 'Product';
                const quantity = item.quantity || 1;
                const price = item.productDetails?.price || item.price || 0;
                const itemTotal = item.itemTotal || (price * quantity);
                const itemSize = item.size || item.productDetails?.size || 'N/A';
                const itemType = item.itemType || (item.bundleId ? 'bundle' : 'product');
                
                // Check if we need a new page
                if (tableRow > 700) {
                    doc.addPage();
                    tableRow = 50;
                }
                
                doc.fontSize(10).font('Helvetica');
                doc.text(`${i + 1}`, itemX, tableRow);
                doc.text(productName.substring(0, 20) + (productName.length > 20 ? '...' : ''), descX, tableRow);
                
                // Only show size for products, not bundles
                if (itemType === 'bundle') {
                    doc.text('Bundle', sizeX, tableRow);
                } else {
                    doc.text(itemSize, sizeX, tableRow);
                }
                
                doc.text(quantity.toString(), qtyX, tableRow);
                doc.text(`₹${price.toFixed(2)}`, priceX, tableRow);
                doc.text(`₹${itemTotal.toFixed(2)}`, totalX, tableRow);
                
                tableRow += 20;
            });
            
            // Draw total line
            doc.moveTo(50, tableRow + 10)
               .lineTo(545, tableRow + 10)
               .stroke();
            
            tableRow += 20;
            
            // Totals section
            doc.fontSize(10).font('Helvetica-Bold');
            
            if (type === 'delivery') {
                doc.text('Subtotal:', 350, tableRow);
                doc.text(`₹${data.subTotalAmt?.toFixed(2) || '0.00'}`, totalX, tableRow);
                tableRow += 20;
                
                doc.text('Delivery Charge:', 350, tableRow);
                const deliveryCharge = (data.totalAmt && data.subTotalAmt) 
                    ? data.totalAmt - data.subTotalAmt 
                    : 0;
                doc.text(`₹${deliveryCharge.toFixed(2)}`, totalX, tableRow);
                tableRow += 20;
            }
            
            // Grand total / Refund amount
            doc.fontSize(12).font('Helvetica-Bold');
            if (type === 'refund') {
                doc.text('Refund Amount:', 350, tableRow);
                doc.text(`₹${data.refundAmount?.toFixed(2) || '0.00'}`, totalX, tableRow);
            } else {
                doc.text('Grand Total:', 350, tableRow);
                doc.text(`₹${data.totalAmt?.toFixed(2) || '0.00'}`, totalX, tableRow);
            }
            
            // Add payment information
            tableRow += 40;
            doc.fontSize(12).font('Helvetica-Bold').text('Payment Information', 50, tableRow);
            tableRow += 20;
            doc.fontSize(10).font('Helvetica')
               .text(`Payment Method: ${data.paymentMethod || 'N/A'}`, 50, tableRow);
            tableRow += 15;
            doc.text(`Payment Status: ${data.paymentStatus || (type === 'refund' ? 'REFUNDED' : 'N/A')}`, 50, tableRow);
            
            if (type === 'delivery') {
                tableRow += 15;
                doc.text(`Delivery Status: ${data.orderStatus || 'DELIVERED'}`, 50, tableRow);
            }
            
            // Footer
            doc.fontSize(10).font('Helvetica')
               .text('Thank you for shopping with Casual Clothing Fashion!', 50, doc.page.height - 100, {
                   align: 'center'
               });
               
            doc.fontSize(8).font('Helvetica')
               .text('This is a computer-generated document and does not require signature.', 50, doc.page.height - 80, {
                   align: 'center'
               });
            
            doc.fontSize(8).fillColor('#888888')
               .text(`Generated on ${new Date().toLocaleDateString('en-IN', {
                   day: '2-digit', 
                   month: '2-digit', 
                   year: 'numeric',
                   hour: '2-digit',
                   minute: '2-digit'
               })}`, 50, doc.page.height - 60, {
                   align: 'center'
               });
            
            // Finalize the PDF
            doc.end();
            
            stream.on('finish', () => {
                resolve(filePath);
            });
            
            stream.on('error', (err) => {
                reject(err);
            });
            
        } catch (error) {
            reject(error);
        }
    });
};

export default generateInvoicePdf;
