import React from 'react';
import { Link } from 'react-router-dom';

function TermsConditions() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className='bg-white shadow-sm p-4 mb-6 flex items-center justify-between border-b border-gray-200'>
        <h1 className='text-xl font-bold text-gray-900 font-serif'>Terms and Conditions</h1>
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
                Welcome to Casual Clothing Fashion. These Terms and Conditions ("Terms") govern your use of our website, mobile application, and services (collectively, the "Services"), as well as your purchase and use of any products offered by Casual Clothing Fashion ("we," "our," or "us").
              </p>
              <p className="mb-4">
                By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to all the terms and conditions, then you may not access or use our Services.
              </p>
              <p>
                Please read these Terms carefully before proceeding. These Terms constitute a legally binding agreement between you and Casual Clothing Fashion.
              </p>
            </div>
          </div>
        </section>

        {/* General Terms */}
        <section className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">General Terms</h2>
          </div>
          <div className="p-5">
            <div className="prose max-w-none text-gray-700">
              <h3 className="text-md font-bold mb-2">Age Requirement</h3>
              <p className="mb-4">
                You must be at least 16 years of age to use our Services. By using our Services, you represent and warrant that you are at least 16 years of age.
              </p>

              <h3 className="text-md font-bold mb-2">Account Registration</h3>
              <p className="mb-4">
                To access certain features of our Services, you may be required to register for an account. When you register, you agree to provide accurate, current, and complete information about yourself. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
              </p>

              <h3 className="text-md font-bold mb-2">User Conduct</h3>
              <p className="mb-4">
                By using our Services, you agree not to:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Use our Services in any way that violates any applicable law or regulation</li>
                <li>Engage in any conduct that restricts or inhibits anyone's use or enjoyment of our Services</li>
                <li>Use our Services for any unlawful purpose or to promote illegal activities</li>
                <li>Attempt to interfere with, compromise the system integrity or security, or decipher any transmissions to or from the servers running our Services</li>
                <li>Upload or transmit viruses, malware, or other types of malicious software</li>
                <li>Collect or track the personal information of others</li>
                <li>Impersonate or misrepresent your affiliation with any person or entity</li>
                <li>Use automated methods to access or use our Services without our permission</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Products and Purchases */}
        <section className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Products and Purchases</h2>
          </div>
          <div className="p-5">
            <div className="prose max-w-none text-gray-700">
              <h3 className="text-md font-bold mb-2">Product Information</h3>
              <p className="mb-4">
                We strive to provide accurate and up-to-date information about our products. However, we do not warrant that product descriptions, pricing, or other content on our Services are accurate, complete, reliable, current, or error-free. In the event of a pricing error, we reserve the right to correct the error and charge the correct price or cancel the order and refund any amount charged.
              </p>

              <h3 className="text-md font-bold mb-2">Order Acceptance</h3>
              <p className="mb-4">
                Your receipt of an order confirmation does not constitute our acceptance of your order. We reserve the right to limit quantities, reject, or cancel any order for any reason, including after you have received an order confirmation.
              </p>

              <h3 className="text-md font-bold mb-2">Payment Terms</h3>
              <p className="mb-4">
                By providing a payment method, you represent and warrant that you are authorized to use the designated payment method and that you authorize us to charge your payment method for the total amount of your order (including any applicable taxes and shipping fees). If your payment method cannot be verified, is invalid, or is otherwise not acceptable, your order may be suspended or cancelled.
              </p>

              <h3 className="text-md font-bold mb-2">Shipping and Delivery</h3>
              <p className="mb-4">
                Shipping and delivery dates are estimates and not guaranteed. We are not responsible for delays beyond our control, including but not limited to carrier delays, weather conditions, or other unforeseen circumstances. For more information, please review our <Link to="/shipping-returns" className="text-black hover:text-gray-800">Shipping & Returns Policy</Link>.
              </p>

              <h3 className="text-md font-bold mb-2">Returns and Refunds</h3>
              <p className="mb-4">
                For information regarding returns and refunds, please review our <Link to="/shipping-returns" className="text-black hover:text-gray-800">Shipping & Returns Policy</Link>.
              </p>
            </div>
          </div>
        </section>

        {/* Intellectual Property */}
        <section className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Intellectual Property</h2>
          </div>
          <div className="p-5">
            <div className="prose max-w-none text-gray-700">
              <h3 className="text-md font-bold mb-2">Ownership</h3>
              <p className="mb-4">
                Our Services and all content, features, and functionality thereof, including but not limited to text, graphics, logos, icons, images, audio clips, digital downloads, data compilations, software, and the compilation thereof, are owned by Casual Clothing Fashion, our licensors, or other providers of such material and are protected by copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
              </p>

              <h3 className="text-md font-bold mb-2">Limited License</h3>
              <p className="mb-4">
                Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, and revocable license to access and use our Services for personal, non-commercial purposes. You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our Services, except as follows:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Your computer may temporarily store copies of such materials in RAM incidental to your accessing and viewing those materials.</li>
                <li>You may store files that are automatically cached by your web browser for display enhancement purposes.</li>
                <li>You may print or download one copy of a reasonable number of pages of the website for your own personal, non-commercial use and not for further reproduction, publication, or distribution.</li>
                <li>If we provide social media features with certain content, you may take such actions as are enabled by such features.</li>
              </ul>

              <h3 className="text-md font-bold mb-2">Trademarks</h3>
              <p className="mb-4">
                The Casual Clothing Fashion name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of Casual Clothing Fashion or our affiliates or licensors. You must not use such marks without our prior written permission. All other names, logos, product and service names, designs, and slogans on our Services are the trademarks of their respective owners.
              </p>
            </div>
          </div>
        </section>

        {/* Disclaimer of Warranties */}
        <section className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Disclaimer of Warranties</h2>
          </div>
          <div className="p-5">
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                YOUR USE OF OUR SERVICES, THEIR CONTENT, AND ANY PRODUCTS OBTAINED THROUGH THE SERVICES IS AT YOUR OWN RISK. THE SERVICES, THEIR CONTENT, AND ANY PRODUCTS OBTAINED THROUGH THE SERVICES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. NEITHER CASUAL CLOTHING FASHION NOR ANY PERSON ASSOCIATED WITH CASUAL CLOTHING FASHION MAKES ANY WARRANTY OR REPRESENTATION WITH RESPECT TO THE COMPLETENESS, SECURITY, RELIABILITY, QUALITY, ACCURACY, OR AVAILABILITY OF THE SERVICES.
              </p>
              <p className="mb-4">
                WITHOUT LIMITING THE FOREGOING, NEITHER CASUAL CLOTHING FASHION NOR ANYONE ASSOCIATED WITH CASUAL CLOTHING FASHION REPRESENTS OR WARRANTS THAT THE SERVICES, THEIR CONTENT, OR ANY PRODUCTS OBTAINED THROUGH THE SERVICES WILL BE ACCURATE, RELIABLE, ERROR-FREE, OR UNINTERRUPTED, THAT DEFECTS WILL BE CORRECTED, THAT OUR SITE OR THE SERVER THAT MAKES IT AVAILABLE ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS, OR THAT THE SERVICES OR ANY PRODUCTS OBTAINED THROUGH THE SERVICES WILL OTHERWISE MEET YOUR NEEDS OR EXPECTATIONS.
              </p>
              <p>
                CASUAL CLOTHING FASHION HEREBY DISCLAIMS ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF MERCHANTABILITY, NON-INFRINGEMENT, AND FITNESS FOR PARTICULAR PURPOSE.
              </p>
            </div>
          </div>
        </section>

        {/* Limitation of Liability */}
        <section className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Limitation of Liability</h2>
          </div>
          <div className="p-5">
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                IN NO EVENT WILL CASUAL CLOTHING FASHION, ITS AFFILIATES, OR THEIR LICENSORS, SERVICE PROVIDERS, EMPLOYEES, AGENTS, OFFICERS, OR DIRECTORS BE LIABLE FOR DAMAGES OF ANY KIND, UNDER ANY LEGAL THEORY, ARISING OUT OF OR IN CONNECTION WITH YOUR USE, OR INABILITY TO USE, THE SERVICES, ANY WEBSITES LINKED TO THEM, ANY CONTENT ON THE SERVICES OR SUCH OTHER WEBSITES, INCLUDING ANY DIRECT, INDIRECT, SPECIAL, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO, PERSONAL INJURY, PAIN AND SUFFERING, EMOTIONAL DISTRESS, LOSS OF REVENUE, LOSS OF PROFITS, LOSS OF BUSINESS OR ANTICIPATED SAVINGS, LOSS OF USE, LOSS OF GOODWILL, LOSS OF DATA, AND WHETHER CAUSED BY TORT (INCLUDING NEGLIGENCE), BREACH OF CONTRACT, OR OTHERWISE, EVEN IF FORESEEABLE.
              </p>
              <p>
                THE FOREGOING DOES NOT AFFECT ANY LIABILITY WHICH CANNOT BE EXCLUDED OR LIMITED UNDER APPLICABLE LAW.
              </p>
            </div>
          </div>
        </section>

        {/* Indemnification */}
        <section className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Indemnification</h2>
          </div>
          <div className="p-5">
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                You agree to defend, indemnify, and hold harmless Casual Clothing Fashion, its affiliates, licensors, and service providers, and its and their respective officers, directors, employees, contractors, agents, licensors, suppliers, successors, and assigns from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms or your use of the Services, including, but not limited to, your User Content, any use of the Services' content, services, and products other than as expressly authorized in these Terms.
              </p>
            </div>
          </div>
        </section>

        {/* Changes to Terms */}
        <section className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Changes to Terms</h2>
          </div>
          <div className="p-5">
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                We may revise and update these Terms from time to time at our sole discretion. All changes are effective immediately when we post them, and apply to all access to and use of the Services thereafter.
              </p>
              <p className="mb-4">
                Your continued use of the Services following the posting of revised Terms means that you accept and agree to the changes. You are expected to check this page frequently so you are aware of any changes, as they are binding on you.
              </p>
            </div>
          </div>
        </section>

        {/* Governing Law and Jurisdiction */}
        <section className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Governing Law and Jurisdiction</h2>
          </div>
          <div className="p-5">
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                These Terms and any dispute or claim arising out of or in connection with them shall be governed by and construed in accordance with the laws of the State of New York, without giving effect to any choice or conflict of law provision or rule.
              </p>
              <p className="mb-4">
                Any legal suit, action, or proceeding arising out of, or related to, these Terms or the Services shall be instituted exclusively in the federal courts of the United States or the courts of the State of New York, in each case located in New York City. You waive any and all objections to the exercise of jurisdiction over you by such courts and to venue in such courts.
              </p>
            </div>
          </div>
        </section>

        {/* Severability */}
        <section className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Severability</h2>
          </div>
          <div className="p-5">
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                If any provision of these Terms is held by a court or other tribunal of competent jurisdiction to be invalid, illegal, or unenforceable for any reason, such provision shall be eliminated or limited to the minimum extent such that the remaining provisions of the Terms will continue in full force and effect.
              </p>
            </div>
          </div>
        </section>

        {/* Waiver */}
        <section className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Waiver</h2>
          </div>
          <div className="p-5">
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                No waiver by Casual Clothing Fashion of any term or condition set out in these Terms shall be deemed a further or continuing waiver of such term or condition or a waiver of any other term or condition, and any failure of Casual Clothing Fashion to assert a right or provision under these Terms shall not constitute a waiver of such right or provision.
              </p>
            </div>
          </div>
        </section>

        {/* Entire Agreement */}
        <section className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Entire Agreement</h2>
          </div>
          <div className="p-5">
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                The Terms, our Privacy Policy, and any other agreements incorporated by reference constitute the sole and entire agreement between you and Casual Clothing Fashion regarding the Services and supersede all prior and contemporaneous understandings, agreements, representations, and warranties, both written and oral, regarding the Services.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Contact Information</h2>
          </div>
          <div className="p-5">
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                If you have any questions or concerns about these Terms, please contact us at:
              </p>
              <p className="mb-1"><strong>Email:</strong> legal@casualclothingfashion.com</p>
              <p className="mb-1"><strong>Phone:</strong> (555) 123-4567</p>
              <p><strong>Address:</strong> 123 Fashion Avenue, New York, NY 10001</p>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <div className="bg-black/5 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Related Policies</h3>
          <div className="flex flex-wrap gap-3">
            <Link to="/privacy-policy" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50">
              Privacy Policy
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
            Print these Terms
          </button>
        </div>
      </div>
    </div>
  );
}

export default TermsConditions;
