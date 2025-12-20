"use client";
import { useState } from "react";
import ChatbotCore from "./ChatbotCore";
import { RiExpandDiagonalSLine } from "react-icons/ri";
import { useRouter, useParams } from "next/navigation";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);

  const router = useRouter();
  const params = useParams();
  
  const ranged = params?.ranged;
  const countryName = params?.countryName;
  const month = params?.month;
  const year = params?.year;

  return (
    <>
      {/* Floating Icon */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[9999]
                   hover:scale-105 transition-transform"
      >
        <img
          src="/Chatbot.png"
          alt="Chatbot"
          className="w-16 h-16 object-contain"
        />
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-[10000] pointer-events-none">
          
          {/* Chat Window */}
          <div
            className="
              pointer-events-auto
              fixed bottom-20 right-4
              w-[360px] sm:w-[380px]
              h-[520px]
              bg-white
              rounded-2xl
              shadow-[0_20px_50px_rgba(0,0,0,0.25)]
              flex flex-col
              animate-chat-open
            "
          >
            {/* Header */}
           <div
  style={{
    background:
      "linear-gradient(180deg, #5EA68E 12.02%, #37455F 100%)",
  }}
  className="
    flex items-center justify-between
    px-4 py-3
    text-white rounded-t-2xl
  "
>
              <div>
                <p className="font-semibold text-sm">Hi </p>
                <p className="text-[11px] opacity-90">
                  Analytics Assistant
                </p>
              </div>
              <div className='flex gap-4 items-center cursor-pointer'>
                <RiExpandDiagonalSLine
  size={20}
  onClick={() => {
    if (!ranged || !countryName || !month || !year) {
      console.warn("Chatbot route params missing");
      return;
    }

    const newPath = `/chatbot/${ranged}/${countryName}/${month}/${year}`;
    router.push(newPath);
  }}
/>
 <button
                onClick={() => setOpen(false)}
                className="text-xl leading-none hover:opacity-80"
              >
                ✕
              </button>
              </div>
             
            </div>

            {/* Chat */}
            <ChatbotCore />
          </div>
        </div>
      )}
    </>
  );
}
