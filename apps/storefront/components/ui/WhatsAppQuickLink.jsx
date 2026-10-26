"use client";

import { brand } from "@/config/brand";

export function WhatsAppQuickLink() {
  const whatsappNumber = (brand.contact?.whatsapp || "").replace(/[^0-9]/g, "");
  if (!whatsappNumber) return null;

  const prefilledMessage = encodeURIComponent(
    `Hello ${brand.name}, I would like to inquire about your handcrafted collection and sizing.`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${prefilledMessage}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-20 lg:bottom-6 left-4 sm:left-6 z-40 w-12 h-12 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center group"
    >
      <svg
        className="w-6 h-6 fill-current"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.772.82 2.791.82 3.181 0 5.768-2.587 5.768-5.766.001-3.187-2.579-5.806-5.768-5.806zm7.747 5.766c-.001 4.269-3.474 7.741-7.747 7.741-1.319 0-2.581-.341-3.712-.988l-4.319 1.133 1.155-4.212c-.733-1.189-1.121-2.56-1.12-3.974.001-4.269 3.473-7.741 7.746-7.741 4.275 0 7.747 3.472 7.747 7.741z" />
      </svg>
      {/* Tooltip on desktop hover */}
      <span className="hidden lg:group-hover:inline-block absolute left-14 bg-dark text-white text-[11px] font-sans font-medium py-1.5 px-3 rounded-lg shadow-md whitespace-nowrap transition-opacity">
        Chat with our stylist
      </span>
    </a>
  );
}
