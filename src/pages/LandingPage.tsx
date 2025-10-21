import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Brain, Zap, Database, CheckCircle, TrendingUp, ArrowRight, Star, Users, BookMarked, Play, ChevronDown, Menu, X } from 'lucide-react';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Professional Navigation */}
      <nav className="fixed top-0 w-full bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">Lorewise</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <div className="flex items-center space-x-6">
                <Link to="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Features</Link>
                <Link to="#pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Pricing</Link>
                <Link to="#about" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">About</Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  to="/auth"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/auth"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-4 space-y-4">
              <Link to="#features" className="block text-gray-600 hover:text-gray-900 font-medium">Features</Link>
              <Link to="#pricing" className="block text-gray-600 hover:text-gray-900 font-medium">Pricing</Link>
              <Link to="#about" className="block text-gray-600 hover:text-gray-900 font-medium">About</Link>
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <Link to="/auth" className="block text-blue-600 hover:text-blue-700 font-medium">Sign in</Link>
                <Link to="/auth" className="block bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-center">Get Started</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div>
              {/* Trust Badge */}
              <div className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
                <Star className="h-4 w-4 mr-1" />
                Trusted by 10,000+ authors
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Write Your Next
                <span className="block text-blue-600">Bestseller</span>
              </h1>
              
              {/* Subheadline */}
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                The AI-powered writing platform that keeps your story consistent across multiple novels. 
                Never lose track of your characters, plot threads, or world-building details again.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link
                  to="/auth"
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  Start Writing Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <button className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <div className="text-2xl font-bold text-gray-900">10,000+</div>
                  <div className="text-sm text-gray-600">Authors</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">50,000+</div>
                  <div className="text-sm text-gray-600">Novels</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">4.9/5</div>
                  <div className="text-sm text-gray-600">Rating</div>
                </div>
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="relative">
              {/* Main Editor Preview */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                {/* Browser Chrome */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <div className="ml-4 bg-white rounded px-3 py-1 text-sm text-gray-600 border">
                      lorewise.com/editor
                    </div>
                  </div>
                </div>
                
                {/* Editor Content */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Chapter 1: The Beginning</h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-500">Auto-saving...</span>
                    </div>
                  </div>
                  
                  {/* Content Preview */}
                  <div className="space-y-3">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-blue-200 rounded w-5/6"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                ✨ AI-Powered
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white border border-gray-200 px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                📚 KDP Ready
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to write consistently
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Purpose-built for Amazon KDP authors who want to maintain consistency across multiple novels.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Intelligent Lore Management</h3>
              <p className="text-gray-600">
                Automatically track characters, locations, events, and world-building details. Your story
                bible updates as you write, ensuring consistency across your entire series.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">AI-Powered Writing Assistant</h3>
              <p className="text-gray-600">
                Get intelligent suggestions that stay true to your lore. The AI understands your world and
                helps you write faster while maintaining consistency.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Lightning Fast Editor</h3>
              <p className="text-gray-600">
                Distraction-free writing experience with real-time saving, markdown support, and a clean
                interface designed for long-form content.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Series Management</h3>
              <p className="text-gray-600">
                Organize multiple novels in your series. Keep track of story arcs, character development,
                and plot threads across books.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-cyan-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Consistency Checker</h3>
              <p className="text-gray-600">
                Automatically detect inconsistencies in your story. Get alerts when character traits,
                timelines, or world rules contradict earlier content.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Amazon KDP Ready</h3>
              <p className="text-gray-600">
                Export your manuscript in formats ready for Amazon KDP. Focus on writing, we'll handle
                the formatting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to write your next bestseller?
          </h2>
          
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of Amazon KDP authors who trust Lorewise for their novel writing. 
            Start your first novel for free today.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/auth"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center"
            >
              Start Writing Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <button className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors">
              View Pricing
            </button>
          </div>
          
          <p className="text-sm text-blue-200 mt-6">
            No credit card required • Free forever plan • 14-day premium trial
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="h-6 w-6 text-blue-500" />
                <span className="text-xl font-semibold text-white">Lorewise</span>
              </div>
              <p className="text-gray-400 max-w-md">
                The AI-powered writing platform built specifically for Amazon KDP authors.
              </p>
            </div>
            
            {/* Product */}
            <div>
              <h3 className="text-white font-medium mb-3">Product</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            {/* Support */}
            <div>
              <h3 className="text-white font-medium mb-3">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500 mb-4 md:mb-0">
              © 2025 Lorewise. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
