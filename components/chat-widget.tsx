"use client";
import { Send, X, Phone, Loader2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useEffect, useRef, useState, FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface ChatWidgetProps {
    isOpen: boolean;
    onClose: () => void;
    whatsappNumber: string;
}

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: number;
}

const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export function ChatWidget({ isOpen, onClose, whatsappNumber }: ChatWidgetProps) {
    const t = useTranslations("chat_widget");
    const locale = useLocale();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Checkout Dropout Recovery
    const pathname = usePathname();
    const [hasNudged, setHasNudged] = useState(false);
    const hasBookingConfirmed = useRef(false);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // Load messages from LocalStorage on mount
    useEffect(() => {
        const savedMessages = localStorage.getItem('chat_history');
        if (savedMessages) {
            try {
                const parsed = JSON.parse(savedMessages);
                // Backwards compatibility: add timestamp if missing
                const hydrated = parsed.map((m: any) => ({
                    ...m,
                    timestamp: m.timestamp || Date.now()
                }));
                setMessages(hydrated);
            } catch (e) {
                console.error("Failed to parse chat history", e);
            }
        }
    }, []);

    // Save messages to LocalStorage whenever they change
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('chat_history', JSON.stringify(messages));
        }
    }, [messages]);

    // Listen for Booking Success Event
    useEffect(() => {
        const handleBookingSuccess = (event: CustomEvent) => {
            const { customerName, bookingDate, packageId } = event.detail;
            hasBookingConfirmed.current = true; // Mark as confirmed to prevent nudge

            // Add a friendly success message from Emily
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    role: "assistant",
                    content: `🎉 **Amazing news, ${customerName}!**\n\nYour **${packageId}** package is confirmed for **${bookingDate}**! I'm so excited for you.\n\nCheck your email for the confirmation details. If you need anything else, I'm right here!`,
                    timestamp: Date.now()
                }
            ]);

            // Ensure chat is open so they see the message
            // Note: If chat is controlled by parent, we might need a way to open it. 
            // Assuming the user is already on the page, they probably have it open or can see the badge.
        };

        window.addEventListener("booking_confirmed" as any, handleBookingSuccess);
        return () => {
            window.removeEventListener("booking_confirmed" as any, handleBookingSuccess);
        };
    }, []);

    const widgetRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
                // Check if the click is on the toggle button (to prevent immediate reopen)
                // The toggle button in whatsapp-button.tsx usually has a specific class or we can trust the parent to handle toggle logic
                // But simplified: just close if outside widget
                onClose();
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);


    // Checkout Dropout Recovery Logic
    useEffect(() => {
        let timer: NodeJS.Timeout;

        // Check if we are on the checkout page (checking URL contains 'checkout' or 'oplata')
        const isCheckoutPage = pathname?.includes('checkout') || pathname?.includes('oplata');

        if (isCheckoutPage && !hasNudged && !hasBookingConfirmed.current) {
            timer = setTimeout(() => {
                if (!hasBookingConfirmed.current) {
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: Date.now().toString(),
                            role: "assistant",
                            content: t('checkout_nudge'),
                            timestamp: Date.now()
                        }
                    ]);
                    setHasNudged(true);
                    // Optionally open chat here if we could control parent state
                }
            }, 60000); // 1 minute
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [pathname, hasNudged, t]);


    const router = useRouter();
    const formattedNumber = whatsappNumber.replace(/[^\d]/g, "");
    const whatsappUrl = `https://wa.me/${formattedNumber}`;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
            timestamp: Date.now(),
        };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput("");
        setIsLoading(true);

        // Human-like Typing Delay (Simulate thinking/typing time)
        // Delay between 1000ms and 2000ms
        const delay = 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: newMessages.map(m => ({ role: m.role, content: m.content })),
                    locale
                }),
            });

            if (!response.ok) throw new Error("Network response was not ok");
            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantMessage = "";

            // Create placeholder for assistant message
            const assistantMsgId = (Date.now() + 1).toString();
            setMessages((prev) => [
                ...prev,
                { id: assistantMsgId, role: "assistant", content: "", timestamp: Date.now() }
            ]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                assistantMessage += chunk;

                // Check for Smart Booking JSON
                // Regex to find ```json { ... } ``` block
                const jsonMatch = assistantMessage.match(/```json\s*(\{[\s\S]*?\})\s*```/);

                let displayMessage = assistantMessage;

                // Hide JSON/Code blocks from the UI immediately (even while streaming)
                if (displayMessage.includes("```json")) {
                    displayMessage = displayMessage.split("```json")[0].trim();
                }

                if (jsonMatch) {
                    try {
                        const jsonStr = jsonMatch[1];
                        const data = JSON.parse(jsonStr);

                        if (data.action === "book" && data.data) {
                            // 1. Force the helpful redirect message
                            displayMessage = t('redirecting');

                            // 2. Save to sessionStorage
                            const bookingData = {
                                customerName: data.data.customerName || "",
                                customerEmail: data.data.customerEmail || "",
                                customerPhone: data.data.customerPhone || "",
                                bookingDate: data.data.bookingDate || "",
                                bookingTime: data.data.bookingTime || "",
                                notes: data.data.notes || "",
                                packageId: data.data.packageId || "essential",
                                totalAmount: 0
                            };
                            sessionStorage.setItem("bookingData", JSON.stringify(bookingData));

                            // 3. Send Transcript Email (Background)
                            fetch('/api/email/send-transcript', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    messages: [...newMessages, { role: 'assistant', content: assistantMessage }],
                                    userEmail: data.data.customerEmail,
                                    userPhone: data.data.customerPhone,
                                    customerName: data.data.customerName,
                                    subject: `New Booking Attempt: ${data.data.packageId.toUpperCase()} - ${data.data.customerName}`
                                })
                            }).catch(err => console.error("Failed to email transcript", err));

                            // 4. Redirect to checkout
                            router.push(`/checkout?package=${data.data.packageId}`);
                            break;
                        }

                        if (data.action === "custom_inquiry" && data.data) {
                            displayMessage = "Thanks! I've sent your request to our team. We'll email you a custom quote shortly! 📧✨";

                            // Send Email
                            fetch('/api/email/send-transcript', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    messages: [...newMessages, { role: 'assistant', content: assistantMessage }],
                                    userEmail: data.data.customerEmail,
                                    userPhone: data.data.customerPhone,
                                    customerName: data.data.customerName,
                                    subject: `CUSTOM INQUIRY: ${data.data.inquiryType} - ${data.data.customerName}`
                                })
                            }).catch(err => console.error("Failed to email transcript", err));
                        }
                    } catch (e) {
                        console.error("Smart Booking Parse Error:", e);
                    }
                }

                setMessages((prev) =>
                    prev.map(m => m.id === assistantMsgId ? { ...m, content: displayMessage } : m)
                );
            }
        } catch (error) {
            console.error("Chat error:", error);
            // Fallback error message
            setMessages((prev) => [
                ...prev,
                ...prev,
                { id: Date.now().toString(), role: "assistant", content: t('connection_error'), timestamp: Date.now() }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        isOpen && (
            <div
                ref={widgetRef}
                className="fixed bottom-24 right-4 z-50 w-[90vw] max-w-[400px] h-[500px] sm:right-8 bg-background border border-border shadow-2xl flex flex-col overflow-hidden rounded-xl animate-scale-in"
            >
                {/* Header */}
                <div className="bg-primary p-4 flex items-center justify-between text-primary-foreground shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full border-2 border-primary-foreground/20 overflow-hidden shadow-inner">
                                <img src="/emily.webp" alt="Emily" className="w-full h-full object-cover" />
                            </div>
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success border-2 border-primary rounded-full"></span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-white">Emily</h3>
                            <p className="text-[10px] text-primary-foreground/80 font-medium">
                                {t("role")} • <span className="text-success font-medium">{t("online")}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-primary-foreground/10 rounded-full transition-colors"
                    >
                        <X size={18} className="text-primary-foreground/90" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center px-6 animate-in fade-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 overflow-hidden shadow-sm border border-border">
                                <img src="/emily.webp" alt="Emily" className="w-full h-full object-cover" />
                            </div>
                            <h4 className="font-semibold text-lg mb-2">{t('welcome_title')}</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed max-w-[250px] mb-6">
                                {t('welcome_message')}
                            </p>
                            <div className="grid grid-cols-1 gap-2 w-full max-w-[240px]">
                                {[
                                    "📸 View Packages",
                                    "💰 Pricing",
                                    "📍 Locations",
                                    "👰 Rooftop Shoot"
                                ].map((text, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setInput(text);
                                            // Automatic send could be handled here if we extracted handleSubmit logic
                                        }}
                                        className="text-xs bg-background border border-border hover:border-primary/50 hover:bg-muted text-muted-foreground hover:text-primary py-2 px-3 rounded-lg transition-all shadow-sm text-center"
                                    >
                                        {text}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((m) => (
                        <div
                            key={m.id}
                            className={cn(
                                "flex gap-3 max-w-[85%] animate-fade-in-up",
                                m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                            )}
                        >
                            {m.role !== "user" && (
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-background border border-border shadow-sm overflow-hidden mt-1"
                                >
                                    <img src="/emily.webp" alt="Emily" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className={cn("flex flex-col gap-1", m.role === "user" ? "items-end" : "items-start")}>
                                <div
                                    className={cn(
                                        "p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                                        m.role === "user"
                                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                                            : "bg-background border border-border text-foreground rounded-tl-sm"
                                    )}
                                >
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            a: ({ node, ...props }: any) => <a {...props} target="_blank" rel="noopener noreferrer" className={cn("underline hover:opacity-80", m.role === "user" ? "text-primary-foreground" : "text-primary")} />,
                                            table: ({ node, ...props }: any) => <table {...props} className="border-collapse border border-border/50 my-2 text-xs w-full" />,
                                            th: ({ node, ...props }: any) => <th {...props} className="border border-border/50 p-1.5 bg-muted/50 font-medium" />,
                                            td: ({ node, ...props }: any) => <td {...props} className="border border-border/50 p-1.5" />,
                                            ul: ({ node, ...props }: any) => <ul {...props} className="list-disc ml-4 my-1 space-y-0.5" />,
                                            ol: ({ node, ...props }: any) => <ol {...props} className="list-decimal ml-4 my-1 space-y-0.5" />,
                                            p: ({ node, ...props }: any) => <p {...props} className="mb-1 last:mb-0" />,
                                        }}
                                    >
                                        {m.content}
                                    </ReactMarkdown>
                                </div>
                                <span className={cn(
                                    "text-[10px] text-muted-foreground/60 px-1",
                                    m.role === "user" ? "text-right" : "text-left"
                                )}>
                                    {formatTime(m.timestamp)}
                                </span>
                            </div>
                        </div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.role === "user" && (
                        <div className="flex gap-3 mr-auto max-w-[85%]">
                            <div className="w-8 h-8 rounded-full bg-background border border-border shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
                                <img src="/emily.webp" alt="Emily" className="w-full h-full object-cover" />
                            </div>
                            <div className="bg-background border border-border p-3.5 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce mx-0.5 [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Action Area */}
                <div className="p-4 bg-background border-t border-border">
                    {/* WhatsApp Fallback */}
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full mb-3 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors py-1.5 hover:bg-muted/50 rounded-md group"
                    >
                        <Phone size={12} className="group-hover:text-primary" />
                        <span>{t('whatsapp_fallback')}</span>
                    </a>

                    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={t('input_placeholder')}
                            className="flex-1 bg-muted/50 hover:bg-background border-0 ring-1 ring-border focus:ring-2 focus:ring-primary/20 px-4 py-3 rounded-2xl text-base focus:outline-none transition-all placeholder:text-muted-foreground/50"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="bg-primary text-primary-foreground w-11 h-11 rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                        </button>
                    </form>
                </div>
            </div>
        )
    );
}
