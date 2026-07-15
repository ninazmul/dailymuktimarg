"use client";

import { motion } from "framer-motion";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <motion.div
        className="max-w-md text-center"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Animated Icon */}
        <motion.div
          className="mb-6"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <span className="inline-block text-6xl">🚧</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-4xl font-extrabold text-gray-900 mb-4"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          Site Under Maintenance
        </motion.h1>

        {/* Message */}
        <motion.p
          className="text-gray-600 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          We’re currently upgrading our system to serve you better. Please check
          back soon.
        </motion.p>

        {/* Progress Bar */}
        <motion.div
          className="w-full bg-gray-200 rounded-full h-2 mb-3 overflow-hidden"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1 }}
        >
          <motion.div
            className="bg-blue-600 h-2 rounded-full"
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        </motion.div>

        {/* Contact Info */}
        <motion.p
          className="text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Need help? Contact us at{" "}
          <a
            href="mailto:info@dailymuktimarg.vercel.app"
            className="text-blue-600 underline"
          >
            info@dailymuktimarg.vercel.app
          </a>
        </motion.p>
      </motion.div>
    </div>
  );
}
