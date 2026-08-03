"use client";

import { FaAndroid } from "react-icons/fa6";

export default function AndroidDownloadButton() {
  return (
    <a
      href="/dailymuktimarg.apk"
      download="Daily Muktimarg.apk"
      className="group inline-flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-300"
      style={{
        background: "#0d1117",
        border: "1px solid rgba(61,220,132,0.3)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.border = "1px solid rgba(61,220,132,0.7)";
        e.currentTarget.style.boxShadow = "0 0 16px rgba(61,220,132,0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.border = "1px solid rgba(61,220,132,0.3)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <FaAndroid
        size={30}
        style={{ color: "#3DDC84", transition: "transform 0.2s" }}
        className="group-hover:scale-110 transition-transform duration-200"
      />
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-widest text-gray-400">
          Get it on
        </span>
        <span className="text-[15px] font-bold text-white leading-tight">
          Android APK
        </span>
      </div>
    </a>
  );
}
