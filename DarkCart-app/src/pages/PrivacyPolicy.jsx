import React from 'react';
import { Link } from 'react-router-dom';

function PrivacyPolicy() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className='bg-white shadow-sm p-4 mb-6 flex items-center justify-between border-b border-gray-200'>
        <h1 className='text-xl font-bold text-gray-900 font-serif'>Privacy Policy</h1>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Last Updated */}
        <div className="mb-6 text-gray-500 text-sm">
          <p>Last Updated: July 1, 2025</p>
        </div>

        {/* Introduction */}
        <section className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Introduction</h2>
          </div>
          <div className="p-5">
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                At Casual Clothing Fashion ("we," "our," or "us"), we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, use our mobile application, make purchases, or interact with us in any other way.
              </p>
              <p className="mb-4">
                Please read this Privacy Policy carefully. By accessing or using our services, you acknowledge that you have read, understood, and agree to be bound by all the terms of this Privacy Policy. If you do not agree, please do not access or use our services.
              </p>
              <p>
                We may change this Privacy Policy from time to time. Any changes will be effective immediately upon posting the updated Privacy Policy. We encourage you to review this Privacy Policy periodically.
              </p>
            </div>
          </div>
        </section>

        {/* Information We Collect */}
        <section className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Information We Collect</h2>
          </div>
          <div className="p-5">
            <div className="prose max-w-none text-gray-700">
              <h3 className="text-md font-bold mb-2">Personal Information</h3>
              <p className="mb-4">
                We may collect personal information that you provide directly to us, including but not limited to:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Contact information (such as name, email address, mailing address, and phone number)</li>
                <li>Account information (such as username and password)</li>
                <li>Payment information (such as credit card details and billing address)</li>
                <li>Order information (such as products purchased, order value, and shipping details)</li>
                <li>Profile information (such as preferences, sizes, and style preferences)</li>
                <li>Communications (such as customer service inquiries and survey responses)</li>
                <li>Social media information (if you choose to connect your social media accounts)</li>
              </ul>

              <h3 className="text-md font-bold mb-2">Automatically Collected Information</h3>
              <p className="mb-4">
                When you access our services, we may automatically collect certain information about your device and usage, including:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Device information (such as your IP address, browser type, operating system, and device identifiers)</li>
                <li>Usage data (such as pages visited, time spent on pages, links clicked, and search terms used)</li>
                <li>Location information (with your permission)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>
          </div>
        </section>

        {/* How We Use Your Information */}
        <section className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">How We Use Your Information</h2>
          </div>
          <div className="p-5">
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                We may use the information we collect for various purposes, including to:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Process and fulfill your orders, including shipping and delivery</li>
                <li>Manage your account and provide you with customer support</li>
                <li>Communicate with you about your orders, products, services, and promotions</li>
                <li>Personalize your experience and provide content and product recommendations</li>
                <li>Improve our website, products, services, marketing, and customer relationships</li>
                <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
                <li>Comply with our legal obligations and enforce our terms of service</li>
                <li>Analyze trends and gather demographic information</li>
                <li>Send promotional emails, catalogs, and other marketing communications</li>
              </ul>
            </div>
          </div>
        </section>

        {/* How We Share Your Information */}
        <section className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">How We Share Your Information</h2>
          </div>
          <div className="p-5">
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                We may share your information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Service Providers:</strong> We may share your information with third-party service providers who perform services on our behalf, such as payment processing, order fulfillment, shipping, customer service, marketing, and analytics.</li>
                <li><strong>Business Transfers:</strong> If we are involved in a merger, acquisition, financing, or sale of all or a portion of our business or assets, your information may be transferred as part of that transaction.</li>
                <li><strong>Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or government agency).</li>
                <li><strong>Protection of Rights:</strong> We may disclose your information to protect and defend our rights, property, or safety, or that of our customers or third parties.</li>
                <li><strong>With Your Consent:</strong> We may share your information with third parties when you have given us your consent to do so.</li>
              </ul>

              <p className="mb-4">
                We do not sell or rent your personal information to third parties for their marketing purposes without your explicit consent.
              </p>
            </div>
          </div>
        </section>

        {/* Cookies and Tracking Technologies */}
        <section className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Cookies and Tracking Technologies</h2>
          </div>
          <div className="p-5">
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                We use cookies, web beacons, and similar tracking technologies to collect information about your interactions with our website and services. These technologies help us:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Remember your preferences and settings</li>
                <li>Understand how you use our website</li>
                <li>Improve our services and user experience</li>
                <li>Deliver personalized content and advertisements</li>
                <li>Analyze the effectiveness of our marketing campaigns</li>
              </ul>

              <p className="mb-4">
                You can control cookies through your browser settings and other tools. However, if you block certain cookies, you may not be able to use some features of our website or services.
              </p>
            </div>
          </div>
        </section>

        {/* Your Rights and Choices */}
        <section className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Your Rights and Choices</h2>
          </div>
          <div className="p-5">
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                Depending on your location, you may have certain rights regarding your personal information, including:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Access:</strong> You can request a copy of the personal information we hold about you.</li>
                <li><strong>Correction:</strong> You can ask us to correct inaccurate or incomplete information.</li>
                <li><strong>Deletion:</strong> You can ask us to delete your personal information in certain circumstances.</li>
                <li><strong>Restriction:</strong> You can ask us to restrict the processing of your information in certain circumstances.</li>
                <li><strong>Portability:</strong> You can ask us to transfer your information to another service provider in a structured, commonly used, and machine-readable format.</li>
                <li><strong>Objection:</strong> You can object to our processing of your information in certain circumstances.</li>
                <li><strong>Withdrawal of Consent:</strong> You can withdraw your consent at any time for processing activities based on consent.</li>
              </ul>

              <p className="mb-4">
                To exercise these rights, please contact us using the information provided in the "Contact Us" section below. Please note that some of these rights may be subject to limitations and exceptions under applicable law.
              </p>

              <h3 className="text-md font-bold mb-2">Marketing Communications</h3>
              <p className="mb-4">
                You can opt out of receiving promotional communications from us by following the unsubscribe instructions included in each communication or by updating your preferences in your account settings. Please note that even if you opt out of receiving promotional communications, we may still send you non-promotional communications, such as those related to your account or orders.
              </p>
            </div>
          </div>
        </section>

        {/* Data Security */}
        <section className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Data Security</h2>
          </div>
          <div className="p-5">
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                We implement appropriate technical and organizational measures to protect your personal information from unauthorized access, use, disclosure, alteration, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
              <p>
                We encourage you to protect your account by using a strong password and keeping it confidential. If you believe your account has been compromised, please contact us immediately.
              </p>
            </div>
          </div>
        </section>

        {/* Children's Privacy */}
        <section className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Children's Privacy</h2>
          </div>
          <div className="p-5">
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                Our services are not intended for individuals under the age of 16. We do not knowingly collect personal information from children under 16. If we become aware that we have collected personal information from a child under 16, we will take steps to delete that information as quickly as possible. If you believe we have collected information from a child under 16, please contact us.
              </p>
            </div>
          </div>
        </section>

        {/* International Data Transfers */}
        <section className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">International Data Transfers</h2>
          </div>
          <div className="p-5">
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                We may transfer your information to countries other than your country of residence, including the United States, where our servers and service providers are located. These countries may have different data protection laws than your country of residence. We will take appropriate measures to protect your information in accordance with this Privacy Policy and applicable laws.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Us */}
        <section className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Contact Us</h2>
          </div>
          <div className="p-5">
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                If you have any questions or concerns about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <p className="mb-1"><strong>Email:</strong> privacy@casualclothingfashion.com</p>
              <p className="mb-1"><strong>Phone:</strong> (555) 123-4567</p>
              <p className="mb-4"><strong>Address:</strong> 123 Fashion Avenue, New York, NY 10001</p>
              <p>
                We will respond to your request as soon as possible and within the timeframes required by applicable law.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <div className="bg-black/5 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Related Policies</h3>
          <div className="flex flex-wrap gap-3">
            <Link to="/terms-conditions" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50">
              Terms & Conditions
            </Link>
            <Link to="/shipping-returns" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50">
              Shipping & Returns
            </Link>
            <Link to="/cookie-policy" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50">
              Cookie Policy
            </Link>
          </div>
        </div>

        {/* Print Policy */}
        <div className="text-center mb-8">
          <button 
            onClick={() => window.print()} 
            className="inline-flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print this Policy
          </button>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
