import { useState, useRef, useEffect } from "react";
import { useAuth } from "@clerk/react";
import { MessageSquare, X, Send, Bot, User, Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGetChatHistory, useChatbotAsk, useClearChatHistory, ChatMessageRole } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isSignedIn } = useAuth();
  const { toast } = useToast();

  const { data: history, isLoading: isLoadingHistory, refetch } = useGetChatHistory({
    query: { enabled: !!(isOpen && isSignedIn), queryKey: ["chatHistory"] }
  });

  const askMutation = useChatbotAsk();
  const clearMutation = useClearChatHistory();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, askMutation.isPending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || askMutation.isPending) return;

    const lastMessage = history && history.length > 0 ? history[history.length - 1] : undefined;
    const conversationId = lastMessage && 'conversationId' in lastMessage ? (lastMessage as any).conversationId : undefined;

    askMutation.mutate({
      data: {
        question: input.trim(),
        conversationId,
      }
    }, {
      onSuccess: () => {
        setInput("");
        refetch();
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive"
        });
      }
    });
  };

  const handleClear = () => {
    clearMutation.mutate(undefined, {
      onSuccess: () => {
        refetch();
        toast({
          title: "Chat cleared",
          description: "Your conversation history has been cleared.",
        });
      }
    });
  };

  if (!isSignedIn) return null;

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 p-0 flex items-center justify-center"
        >
          <MessageSquare className="h-6 w-6 text-white" />
        </Button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px] max-h-[calc(100vh-100px)] bg-white border rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50">
          <div className="h-14 bg-primary px-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 text-white">
              <Bot className="h-5 w-5 text-accent" />
              <span className="font-semibold">Policy Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handleClear} className="h-8 w-8 text-white hover:bg-white/20" title="Clear chat">
                <RefreshCcw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 text-white hover:bg-white/20">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50" ref={scrollRef}>
            {isLoadingHistory ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : history?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 gap-2">
                <Bot className="h-12 w-12 text-gray-300" />
                <p className="text-sm">Hello! I can answer questions about government policies and procedures. How can I help you today?</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history?.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === ChatMessageRole.user ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                      msg.role === ChatMessageRole.user 
                        ? 'bg-primary text-white rounded-tr-sm' 
                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 mb-1">Sources:</p>
                          <ul className="space-y-1">
                            {msg.sources.map((src, i) => (
                              <li key={i} className="text-[10px] text-gray-500 bg-gray-50 p-1.5 rounded">
                                <span className="font-medium text-gray-700">{src.sourceName}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {askMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-gray-500">Thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-3 bg-white border-t border-gray-100">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about policies..."
                className="flex-1 border-gray-300 focus-visible:ring-primary"
                disabled={askMutation.isPending}
              />
              <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90 flex-shrink-0" disabled={askMutation.isPending || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
