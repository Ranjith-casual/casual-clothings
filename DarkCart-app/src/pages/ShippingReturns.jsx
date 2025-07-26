import React from 'react';
import { Link } from 'react-router-dom';

function ShippingReturns() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className='bg-white shadow-sm p-3 sm:p-4 mb-6 flex items-center justify-between border-b border-gray-200'>
        <h1 className='text-lg sm:text-xl font-bold text-gray-900 font-["Playfair_Display"]'>Shipping & Returns Policy</h1>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Page Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 font-['Playfair_Display']">Contents</h2>
          </div>
          <div className="p-5">
            <ul className="space-y-2 text-black font-['Poppins']">
              <li>
                <a href="#shipping" className="hover:text-gray-800">Shipping Information</a>
              </li>
              <li>
                <a href="#returns" className="hover:text-gray-800">Return Policy</a>
              </li>
              <li>
                <a href="#exchanges" className="hover:text-gray-800">Exchanges</a>
              </li>
              <li>
                <a href="#refunds" className="hover:text-gray-800">Refunds</a>
              </li>
              <li>
                <a href="#damaged" className="hover:text-gray-800">Damaged or Defective Items</a>
              </li>
              <li>
                <a href="#international" className="hover:text-gray-800">International Orders</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Shipping Information */}
        <section id="shipping" className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Shipping Information</h2>
          </div>
          <div className="p-5">
            <div className="prose max-w-none text-gray-700">
              <h3 className="text-md font-bold mb-2">Processing Time</h3>
              <p className="mb-4">
                All orders are processed within 1-2 business days (excluding weekends and holidays) after receiving your order confirmation email. You will receive another notification when your order has shipped.
              </p>

              <h3 className="text-md font-bold mb-2">Shipping Options</h3>
              <p className="mb-2">We offer the following shipping methods:</p>
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left text-sm sm:text-base">Method</th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left text-sm sm:text-base">Estimated Delivery</th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left text-sm sm:text-base">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 text-sm sm:text-base">Standard Shipping</td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 text-sm sm:text-base">3-5 business days</td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 text-sm sm:text-base">Free on orders over ₹4,000<br />₹499 for orders under ₹4,000</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 text-sm sm:text-base">Expedited Shipping</td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 text-sm sm:text-base">2-3 business days</td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 text-sm sm:text-base">₹799</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 text-sm sm:text-base">Express Shipping</td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 text-sm sm:text-base">1-2 business days</td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 text-sm sm:text-base">₹1,199</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-md font-bold mb-2">Tracking Information</h3>
              <p className="mb-4">
                You will receive a shipping confirmation email with your tracking number once your order has shipped. The tracking information may take 24-48 hours to update in the carrier's system. You can also track your order by logging into your account on our website.
              </p>

              <h3 className="text-md font-bold mb-2">Shipping Delays</h3>
              <p className="mb-4">
                Please note that during peak seasons, holidays, or severe weather conditions, shipping carriers may experience delays that are beyond our control. We appreciate your understanding and patience in these situations.
              </p>
            </div>
          </div>
        </section>

        {/* Return Policy */}
        <section id="returns" className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Return Policy</h2>
          </div>
          <div className="p-5">
            <div className="prose max-w-none text-gray-700">
              <h3 className="text-md font-bold mb-2">Return Eligibility</h3>
              <p className="mb-4">
                We accept returns within 30 days of delivery for most items. To be eligible for a return, your item must be:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Unworn, unwashed, and in its original condition</li>
                <li>With original tags still attached</li>
                <li>In the original packaging (when applicable)</li>
                <li>Accompanied by the original receipt or proof of purchase</li>
              </ul>
              
              <h3 className="text-md font-bold mb-2">Non-Returnable Items</h3>
              <p className="mb-2">The following items cannot be returned:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Items marked as "Final Sale" or "Clearance"</li>
                <li>Personalized or custom-made items</li>
                <li>Swimwear and underwear (for hygiene reasons)</li>
                <li>Gift cards</li>
                <li>Items damaged due to customer misuse</li>
              </ul>

              <h3 className="text-md font-bold mb-2">How to Initiate a Return</h3>
              <p className="mb-4">
                To start your return process:
              </p>
              <ol className="list-decimal pl-6 mb-4">
                <li>Log into your account on our website</li>
                <li>Go to "My Orders" and locate the order containing the item(s) you wish to return</li>
                <li>Click on "Return Items" and follow the prompts</li>
                <li>Print the prepaid return shipping label</li>
                <li>Package your item securely with all tags and original packaging</li>
                <li>Attach the return shipping label to your package</li>
                <li>Drop off the package at an authorized shipping location</li>
              </ol>
              <p className="mb-4">
                If you made a purchase as a guest, you can initiate a return by contacting our customer service team with your order number and email address.
              </p>

              <h3 className="text-md font-bold mb-2">Return Shipping</h3>
              <p className="mb-4">
                For domestic returns, we provide a prepaid return shipping label at no cost to you. For international returns, shipping costs are the responsibility of the customer unless the return is due to our error (damaged or defective item, incorrect item sent).
              </p>
            </div>
          </div>
        </section>

        {/* Exchanges */}
        <section id="exchanges" className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Exchanges</h2>
          </div>
          <div className="p-5">
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                We offer exchanges for items in different sizes or colors, subject to availability. To request an exchange:
              </p>
              <ol className="list-decimal pl-6 mb-4">
                <li>Follow the same return process outlined above</li>
                <li>When prompted, select "Exchange" instead of "Return"</li>
                <li>Specify the desired replacement item (size, color, etc.)</li>
                <li>Complete the exchange request</li>
              </ol>
              <p className="mb-4">
                If the item you want to exchange for is not available, we will process a refund for your original purchase. Please note that we can only exchange items for different sizes or colors of the same product, not for different products.
              </p>
            </div>
          </div>
        </section>

        {/* Refunds */}
        <section id="refunds" className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Refunds</h2>
          </div>
          <div className="p-5">
            <div className="prose max-w-none text-gray-700">
              <h3 className="text-md font-bold mb-2">Refund Process</h3>
              <p className="mb-4">
                Once your return is received and inspected, we will send you an email to notify you that we have received your returned item. We will also notify you of the approval or rejection of your refund.
              </p>
              <p className="mb-4">
                If approved, your refund will be processed, and a credit will automatically be applied to your original method of payment within 5-7 business days. Please note that depending on your card issuer, it may take an additional 2-10 business days for the refund to appear on your statement.
              </p>
              
              <h3 className="text-md font-bold mb-2">Original Shipping Costs</h3>
              <p className="mb-4">
                Original shipping costs are non-refundable, except in cases where items arrived damaged or we sent an incorrect item.
              </p>

              <h3 className="text-md font-bold mb-2">Late or Missing Refunds</h3>
              <p className="mb-4">
                If you haven't received a refund after 14 days from our confirmation email, please check your bank account again. Then contact your credit card company, as it may take some time before your refund is officially posted. Next, contact your bank to inquire about the status of the refund. If you've done all of this and still haven't received your refund, please contact our customer service team.
              </p>
            </div>
          </div>
        </section>

        {/* Damaged or Defective Items */}
        <section id="damaged" className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Damaged or Defective Items</h2>
          </div>
          <div className="p-5">
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                If you receive a damaged or defective item, please contact our customer service team within 48 hours of delivery. Please provide:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Your order number</li>
                <li>A description of the damage or defect</li>
                <li>Photos showing the issue</li>
              </ul>
              <p className="mb-4">
                We will work with you to resolve the issue by offering a replacement, store credit, or a full refund, including shipping costs. We may ask you to return the damaged item using a prepaid shipping label we provide.
              </p>
            </div>
          </div>
        </section>

        {/* International Orders */}
        <section id="international" className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">International Orders</h2>
          </div>
          <div className="p-5">
            <div className="prose max-w-none text-gray-700">
              <h3 className="text-md font-bold mb-2">International Shipping</h3>
              <p className="mb-4">
                We ship to most countries worldwide. International shipping times vary by destination and typically take 7-14 business days after shipping. Please note that international orders may be subject to import duties, taxes, and customs clearance fees, which are the responsibility of the recipient.
              </p>

              <h3 className="text-md font-bold mb-2">International Returns</h3>
              <p className="mb-4">
                For international returns, the customer is responsible for return shipping costs and any customs fees unless the return is due to our error. Please contact our customer service team before initiating an international return.
              </p>
            </div>
          </div>
        </section>

        {/* Need Help Box */}
        <div className="bg-black/5 rounded-lg p-4 sm:p-6 mb-8 flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0 text-center md:text-left">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">Need help with your order?</h3>
            <p className="text-sm sm:text-base text-gray-600">Our customer service team is here to help.</p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
            <Link to="/about" className="inline-flex items-center justify-center px-4 sm:px-5 py-2 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-black hover:bg-black/90 w-full sm:w-auto">
              Contact Us
            </Link>
            <Link to="/faq" className="inline-flex items-center justify-center px-4 sm:px-5 py-2 border border-gray-300 text-sm sm:text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 w-full sm:w-auto">
              View FAQs
            </Link>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-center text-xs sm:text-sm text-gray-500">
          <p>Last updated: July 26, 2025</p>
        </div>
      </div>
    </div>
  );
}

export default ShippingReturns;
