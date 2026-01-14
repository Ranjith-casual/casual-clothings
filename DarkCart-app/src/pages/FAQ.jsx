import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function FAQ() {
  const [activeCategory, setActiveCategory] = useState('orders');
  const [openQuestions, setOpenQuestions] = useState({});

  // Toggle FAQ item open/closed state
  const toggleQuestion = (id) => {
    setOpenQuestions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // FAQ categories and questions
  const faqData = {
    orders: [
      {
        id: 'order1',
        question: 'How do I track my order?',
        answer: 'After your order has been shipped, you will receive a confirmation email with your tracking number. You can use this number to track your package on our website under "My Orders" in your account dashboard or directly via the shipping carrier\'s website.'
      },
      {
        id: 'order2',
        question: 'How long will my order take to arrive?',
        answer: 'Domestic orders typically arrive within 3-5 business days. International orders may take 7-14 business days, depending on the destination country and customs processing. During peak seasons or promotions, delivery times may be slightly longer.'
      },
      {
        id: 'order3',
        question: 'Can I change or cancel my order after it\'s been placed?',
        answer: 'You can change or cancel your order within 1 hour of placing it by contacting our customer service team. Once an order has entered the processing stage, we cannot guarantee changes or cancellations, but we\'ll do our best to accommodate your request.'
      },
      {
        id: 'order4',
        question: 'Do you offer express shipping?',
        answer: 'Yes, we offer express shipping options at checkout. Express shipping typically delivers within 1-2 business days domestically and 3-5 business days internationally, at an additional cost.'
      },
      {
        id: 'order5',
        question: 'What happens if my order is lost or damaged in transit?',
        answer: 'If your order is lost or arrives damaged, please contact our customer service team within 48 hours of the delivery date. We\'ll work with the shipping carrier to locate your package or arrange for a replacement shipment at no additional cost.'
      }
    ],
    returns: [
      {
        id: 'return1',
        question: 'What is your return policy?',
        answer: 'We offer a 30-day return policy for unworn, unwashed items with original tags attached. Returns must be initiated within 30 days of delivery. Sale items marked as "Final Sale" are not eligible for returns or exchanges.'
      },
      {
        id: 'return2',
        question: 'How do I start a return?',
        answer: 'To initiate a return, log into your account, go to "My Orders," select the order containing the item(s) you wish to return, and follow the prompts to generate a return label. If you made a purchase as a guest, you can use the order number and email address to access your order and initiate a return.'
      },
      {
        id: 'return3',
        question: 'How long does it take to process a return?',
        answer: 'Once your return is received at our warehouse, it typically takes 3-5 business days to process. After processing, refunds are issued to your original payment method and may take an additional 5-10 business days to appear on your statement, depending on your bank or credit card company\'s policies.'
      },
      {
        id: 'return4',
        question: 'Do I have to pay for return shipping?',
        answer: 'Standard returns within the country are free using our prepaid return label. For international returns, shipping costs are the responsibility of the customer unless the return is due to a defect or incorrect item being sent.'
      },
      {
        id: 'return5',
        question: 'Can I exchange an item instead of returning it?',
        answer: 'Yes, you can exchange items for a different size or color, subject to availability. To request an exchange, follow the same process as a return but select "exchange" instead of "refund" and specify your preferred replacement item.'
      }
    ],
    products: [
      {
        id: 'product1',
        question: 'How do I determine the right size?',
        answer: 'We recommend referring to our detailed size guide on each product page or in our Size Guide section. If you\'re between sizes, we generally recommend sizing up for a more comfortable fit. For specific fit questions about a particular item, please contact our customer service team.'
      },
      {
        id: 'product2',
        question: 'What materials do you use in your clothing?',
        answer: 'We use a variety of high-quality materials, including organic cotton, recycled polyester, sustainably sourced wool, and innovative eco-friendly fabrics. Each product page lists the specific materials used for that item, along with care instructions tailored to those materials.'
      },
      {
        id: 'product3',
        question: 'Are your products ethically made?',
        answer: 'Yes, we are committed to ethical manufacturing practices. All our products are made in factories that meet our strict standards for fair labor practices, safe working conditions, and environmental responsibility. We regularly audit our manufacturing partners to ensure compliance with these standards.'
      },
      {
        id: 'product4',
        question: 'How should I care for my garments?',
        answer: 'Care instructions vary by item and material. You\'ll find specific care instructions on the product label and on each product page. Generally, we recommend washing in cold water, avoiding bleach and fabric softeners, and air drying when possible to extend the life of your garments and reduce environmental impact.'
      },
      {
        id: 'product5',
        question: 'Do you offer custom or personalized items?',
        answer: 'We currently do not offer custom-made or personalized items as part of our standard collection. However, we occasionally run limited-time customization promotions for certain products. Sign up for our newsletter to be notified about these special offers.'
      }
    ],
    payment: [
      {
        id: 'payment1',
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, MasterCard, American Express, Discover), PayPal, Apple Pay, Google Pay, and Shop Pay. For certain regions, we also offer options like Klarna, Afterpay, and bank transfers.'
      },
      {
        id: 'payment2',
        question: 'Do you offer installment payment options?',
        answer: 'Yes, we offer "Buy Now, Pay Later" options through partners like Klarna, Afterpay, and Shop Pay Installments. These services allow you to split your purchase into 4 interest-free payments, subject to approval and availability in your region.'
      },
      {
        id: 'payment3',
        question: 'Is my payment information secure?',
        answer: 'Absolutely. We use industry-standard encryption and secure payment processors to ensure your financial information is protected. Our website is PCI DSS compliant, and we never store your complete credit card information on our servers.'
      },
      {
        id: 'payment4',
        question: 'When will my credit card be charged?',
        answer: 'Your credit card will be authorized at the time of purchase but only charged when your order ships. For pre-order items, your card may be charged at the time of order or when the item ships, depending on the specific product terms stated at checkout.'
      },
      {
        id: 'payment5',
        question: 'Do you charge sales tax?',
        answer: 'We collect sales tax in states/regions where we have a physical presence or where required by law. The applicable sales tax will be calculated at checkout based on your shipping address and displayed before you complete your purchase.'
      }
    ],
    account: [
      {
        id: 'account1',
        question: 'How do I create an account?',
        answer: 'You can create an account by clicking on the "Account" icon in the top navigation menu and selecting "Register." Alternatively, you can create an account during the checkout process. You\'ll need to provide your email address and create a password.'
      },
      {
        id: 'account2',
        question: 'I forgot my password. How do I reset it?',
        answer: 'To reset your password, click on the "Account" icon, select "Login," and then click on "Forgot Password." Enter the email address associated with your account, and we\'ll send you a link to create a new password.'
      },
      {
        id: 'account3',
        question: 'How do I update my account information?',
        answer: 'After logging in, navigate to "My Account" and select "Account Settings" or "Profile" to update your personal information, including your name, email, password, and address details.'
      },
      {
        id: 'account4',
        question: 'Can I save multiple shipping addresses?',
        answer: 'Yes, you can save multiple shipping addresses in your account. Once logged in, go to "My Account," select "Addresses," and add as many shipping addresses as you need. You can designate one as your default shipping address.'
      },
      {
        id: 'account5',
        question: 'How can I view my order history?',
        answer: 'Your complete order history is available in your account dashboard. After logging in, go to "My Orders" to view details of all your past and current orders, including order status, tracking information, and invoices.'
      }
    ]
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 mb-6 flex items-center justify-between border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 font-['Playfair_Display']">Frequently Asked Questions</h1>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Category Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 font-['Poppins']">
            {Object.keys(faqData).map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-3 mx-1 text-sm font-medium rounded-full whitespace-nowrap ${
                  activeCategory === category
                    ? 'bg-black text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Content */}
        <div className="space-y-6 font-['Poppins']">
          {/* FAQ Items */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-200">
              {faqData[activeCategory].map((item) => (
                <div key={item.id} className="border-l-4 border-transparent hover:border-black">
                  <button
                    onClick={() => toggleQuestion(item.id)}
                    className="flex justify-between items-center w-full p-5 text-left"
                  >
                    <span className="text-lg font-medium text-gray-900">{item.question}</span>
                    <svg
                      className={`w-6 h-6 text-gray-500 transform ${openQuestions[item.id] ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openQuestions[item.id] && (
                    <div className="px-5 pb-5 pt-0">
                      <p className="text-gray-600">{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Still have questions */}
          <div className="bg-black/5 rounded-lg p-6 mt-8 text-center">
            <h3 className="text-xl font-medium text-gray-900 mb-2">Still Have Questions?</h3>
            <p className="text-gray-600 mb-4">Our customer service team is here to help you with any questions you may have.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/contact" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-900">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Us
              </Link>
              <button className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Live Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FAQ;
