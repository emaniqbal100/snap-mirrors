import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Snap's Mirror - Smart Mirrors</title>
        <meta name="description" content="Premium smart mirrors with LED lighting and touch control" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="container-custom py-6">
            <h1 className="text-3xl font-bold text-gray-800">✨ Snap's Mirror</h1>
            <p className="text-gray-600 mt-2">Premium Smart Mirrors with LED Technology</p>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container-custom py-12 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Snap's Mirror</h2>
            <p className="text-xl text-gray-600 mb-8">
              Discover our collection of smart vanity mirrors with advanced LED lighting technology
            </p>
            <button className="btn-primary px-8 py-3 text-lg">
              Shop Now
            </button>
          </div>
        </section>

        {/* Features */}
        <section className="container-custom py-12">
          <h2 className="text-2xl font-bold mb-8 text-center">Why Choose Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <h3 className="text-xl font-semibold mb-4">💡 Smart LED</h3>
              <p className="text-gray-600">
                Advanced LED lighting with 3 color temperatures and dimming control
              </p>
            </div>
            <div className="card">
              <h3 className="text-xl font-semibold mb-4">🎯 Touch Control</h3>
              <p className="text-gray-600">
                Responsive touch sensors for easy operation
              </p>
            </div>
            <div className="card">
              <h3 className="text-xl font-semibold mb-4">🌊 Anti-Fog</h3>
              <p className="text-gray-600">
                Integrated heating to prevent condensation
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gray-900 text-white py-12">
          <div className="container-custom text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Upgrade Your Space?</h2>
            <p className="text-xl mb-8">Browse our collection of premium smart mirrors</p>
            <button className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold">
              View Products
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-100 border-t">
          <div className="container-custom py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-semibold mb-4">About Us</h3>
                <p className="text-gray-600 text-sm">Snap's Mirror - Premium smart mirrors with LED technology</p>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Contact</h3>
                <p className="text-gray-600 text-sm">📧 raheel56h@gmail.com</p>
                <p className="text-gray-600 text-sm">📱 +92 324 4612168</p>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  <a href="https://instagram.com/snap_mirrors" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Instagram
                  </a>
                  <a href="https://tiktok.com/@aina_zaar1" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    TikTok
                  </a>
                </div>
              </div>
            </div>
            <div className="border-t mt-8 pt-8 text-center text-gray-600 text-sm">
              <p>&copy; 2024 Snap's Mirror. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}