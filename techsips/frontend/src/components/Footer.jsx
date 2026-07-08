import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Mail, Phone, MapPin, Twitter, Linkedin, Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-md shadow-brand-500/20">
                <GraduationCap className="h-6 w-6" />
              </span>
              <span className="text-xl font-bold tracking-tight text-white">
                Tech<span className="text-brand-400">Sips</span>
              </span>
            </Link>
            <p className="text-sm">
              Premium learning marketplace connecting students with industry-certified mentors in Africa and Kenya.
            </p>
            <p className="text-xs text-brand-400 italic">"Learn. Build. Earn."</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/courses" className="hover:text-white transition-colors">All Courses</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/register/tutor" className="hover:text-white transition-colors">Become a Tutor</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Contact TechSips</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-brand-400" />
                <span>Nairobi, Kenya</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-brand-400" />
                <span>+254 795846971</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-brand-400" />
                <span>carlosmarcus050@gmail.com</span>
              </li>
            </ul>
          </div>

          {/* Social Connect */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Connect</h3>
            <div className="flex space-x-4 mb-4">
              <a href="#" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300 hover:text-white">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300 hover:text-white">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300 hover:text-white">
                <Github className="h-4 w-4" />
              </a>
            </div>
            <p className="text-xs">
              &copy; {new Date().getFullYear()} TechSips. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
