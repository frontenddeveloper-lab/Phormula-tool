import { create } from "zustand";
import { v4 as uuid } from "uuid";

export type Message = {
  id: string                 // ✅ CLIENT ID (uuid)
  sender: "user" | "bot"
  text: string

  // backend related
  serverId?: number          // ✅ SERVER ID
  promptText?: string

  // ui
  liked?: "like" | "dislike"
  error?: boolean
  timestamp?: number
}
type ChatStore = {
  messages: Message[];
  loading: boolean;
  loadFromStorage: () => void;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const getAuthToken = () =>
  typeof window !== "undefined"
    ? localStorage.getItem("jwtToken")
    : null;

export const useChatbotStore = create<ChatStore>((set, get) => ({
  messages: [],
  loading: false,

  

  loadFromStorage: () => {
  const saved = localStorage.getItem("chatbot_history");
  if (!saved) return;

  const parsed = JSON.parse(saved);

  set((state) => {
    // already loaded → do nothing
    if (state.messages.length > 0) return state;
    return { messages: parsed };
  });
},

  sendMessage: async (text) => {
    if (!text.trim()) return;

    const userMsg: Message = {
  id: uuid(),
  sender: "user",
  text,
  timestamp: Date.now(),
};

    set((s) => ({
      messages: [...s.messages, userMsg],
      loading: true,
    }));

    try {
      const res = await fetch(`${API_BASE_URL}/chatbot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          action: "chat",
          query: text,
        }),
      });

      const data = await res.json();

      const botMsg: Message = {
  id: uuid(),
  sender: "bot",
  text: data?.response || "No response",
  timestamp: Date.now(),
  
};

      set((s) => ({
        messages: [...s.messages, botMsg],
        loading: false,
      }));

      localStorage.setItem(
        "chatbot_history",
        JSON.stringify([...get().messages, botMsg])
      );
    } catch {
      set({ loading: false });
    }
  },

  clearChat: () => {
    localStorage.removeItem("chatbot_history");
    set({ messages: [] });
  },
}));
