"use client";

import { Toaster } from "react-hot-toast";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-4">
      <Toaster />
      <main className="w-full max-w-md flex justify-center items-center">
        {children}
      </main>
    </div>
  );
}
