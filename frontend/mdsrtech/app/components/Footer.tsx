'use client';

import Link from 'next/link';
import { useState } from 'react';

// Modal Component for Terms and Privacy
interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function PolicyModal({ isOpen, onClose, title, children }: PolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70" />
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>
        <div className="p-6 overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors cursor-pointer text-sm"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}

// Terms and Conditions Content - Updated for demo
function TermsContent() {
  return (
    <div className="space-y-6 text-gray-700">
      <p className="text-sm text-gray-500">Last updated: December 2, 2025</p>
      
      {/* Demo Disclaimer Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 font-semibold">⚠️ Important Notice</p>
        <p className="text-yellow-700 text-sm mt-1">
          This website is a demonstration project created for educational purposes as part of a university course. No actual purchases can be made, and no real products are for sale.
        </p>
      </div>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Demonstration Purpose</h3>
        <p>MDSRTech is a demonstration website created solely for educational and portfolio purposes. This website:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
          <li>Does NOT sell any real products</li>
          <li>Does NOT process any real payments (uses Stripe test mode only)</li>
          <li>Is NOT affiliated with any brands, companies, or products displayed</li>
          <li>Should NOT be used to attempt real purchases</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">2. No Commercial Activity</h3>
        <p>This website does not engage in any commercial activity. All product images, names, and descriptions are used for demonstration purposes only. We do not own, sell, or distribute any of the products shown on this website.</p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Third-Party Trademarks</h3>
        <p>All product names, logos, and brands displayed on this website are property of their respective owners. The use of these names, logos, and brands does not imply endorsement or affiliation. They are used solely for demonstration purposes.</p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Test Payment System</h3>
        <p>The payment system on this website operates in Stripe&apos;s test mode. Only test card numbers will work. No real credit cards will be charged. Test card numbers are provided during checkout for demonstration purposes.</p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">5. User Accounts</h3>
        <p>While you can create an account on this website, please be aware:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
          <li>This is a demonstration project and may be taken offline at any time</li>
          <li>Data may be cleared periodically</li>
          <li>Do not use sensitive passwords you use elsewhere</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">6. Limitation of Liability</h3>
        <p>This website is provided &quot;as is&quot; for demonstration purposes. The creators make no warranties about the accuracy, reliability, or availability of the website. We are not liable for any issues arising from the use of this demonstration website.</p>
      </section>
    </div>
  );
}

// Privacy Policy Content - Updated for demo
function PrivacyContent() {
  return (
    <div className="space-y-6 text-gray-700">
      <p className="text-sm text-gray-500">Last updated: December 2, 2025</p>
      
      {/* Demo Disclaimer Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 font-semibold">⚠️ Important Notice</p>
        <p className="text-yellow-700 text-sm mt-1">
          This is a demonstration website for educational purposes. While we handle data responsibly, 
          this is a student project and not a production-grade e-commerce platform.
        </p>
      </div>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Project Context</h3>
        <p>MDSRTech is a demonstration project. This privacy policy explains how data is handled in this educational context.</p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Information Collected</h3>
        <p>For demonstration purposes, the website may collect:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
          <li>Email address and name (for account creation)</li>
          <li>Demo order information</li>
          <li>Test cart and wishlist data</li>
        </ul>
        <p className="mt-2 text-sm text-gray-500">Note: No real payment information is collected. Stripe test mode does not process real cards.</p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">3. How Information is Used</h3>
        <p>Information collected is used solely for:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
          <li>Demonstrating e-commerce functionality</li>
          <li>Testing authentication flows</li>
          <li>Sending demo order confirmation emails</li>
          <li>Academic project evaluation</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Data Storage</h3>
        <p>Data is stored using Supabase (PostgreSQL database) and is used solely for demonstration purposes. This data may be:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
          <li>Cleared periodically without notice</li>
          <li>Deleted when the project is concluded</li>
          <li>Not backed up or permanently retained</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">5. No Data Selling</h3>
        <p>We do not sell, trade, or otherwise transfer your information to third parties. This is an educational project with no commercial interest.</p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">6. Recommendations</h3>
        <p>As this is a demo project:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
          <li>Do not use passwords you use on other important sites</li>
          <li>Use test card numbers only (provided at checkout)</li>
          <li>Do not enter real sensitive personal information</li>
        </ul>
      </section>
    </div>
  );
}

export default function Footer() {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const categories = [
    { name: 'Laptops', slug: 'laptops' },
    { name: 'Phones', slug: 'phones' },
    { name: 'Tablets', slug: 'tablets' },
    { name: 'Audio', slug: 'audio' },
    { name: 'Accessories', slug: 'accessories' },
    { name: 'Wearables', slug: 'wearables' },
  ];

  return (
    <>
      <footer className="bg-gray-900 text-gray-300">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <Link href="/" className="inline-block mb-4">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  MDSRTech
                </h2>
              </Link>
              <p className="text-sm text-gray-400 mb-4">
                Your destination for premium tech products. Discover the latest in laptops, phones, tablets, and accessories.
              </p>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-white font-semibold mb-4">Categories</h3>
              <ul className="space-y-2">
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link 
                      href={`/category/${category.slug}`}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-sm hover:text-white transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/cart" className="text-sm hover:text-white transition-colors">
                    Shopping Cart
                  </Link>
                </li>
                <li>
                  <Link href="/wishlist" className="text-sm hover:text-white transition-colors">
                    Wishlist
                  </Link>
                </li>
                <li>
                  <Link href="/orders" className="text-sm hover:text-white transition-colors">
                    My Orders
                  </Link>
                </li>
                <li>
                  <Link href="/auth" className="text-sm hover:text-white transition-colors">
                    Sign In / Sign Up
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => setShowTermsModal(true)}
                    className="text-sm hover:text-white transition-colors cursor-pointer"
                  >
                    Terms & Conditions
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setShowPrivacyModal(true)}
                    className="text-sm hover:text-white transition-colors cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800">
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-sm text-gray-500 text-center">
              © {new Date().getFullYear()} MDSRTech. All rights reserved. Created and designed by Suhrab Roeen & Meron Daniel for CSCI 4230U - Advanced Web Development. Not affiliated with any brands or companies displayed.
            </p>
          </div>
        </div>
      </footer>

      {/* Terms Modal */}
      <PolicyModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Terms and Conditions"
      >
        <TermsContent />
      </PolicyModal>

      {/* Privacy Modal */}
      <PolicyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Privacy Policy"
      >
        <PrivacyContent />
      </PolicyModal>
    </>
  );
}
