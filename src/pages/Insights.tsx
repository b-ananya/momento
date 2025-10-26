import { useState, useRef, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Insights = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Get the current session properly
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("Unable to get session. Please log in again.");
      }

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-insights`;

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`, // correct usage
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to get response from AI function.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let textBuffer = '';
      let streamDone = false;

      // Add a placeholder assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              assistantMessage += parsed.delta.text;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].content = assistantMessage;
                return newMessages;
              });
            } else if (parsed.type === 'message_stop') {
              streamDone = true;
              break;
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

    } catch (error: any) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      // Remove the placeholder assistant message
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-warm)]">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-[var(--shadow-polaroid)] bg-card border-border h-[calc(100vh-12rem)]">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-primary flex items-center gap-2">
                <Sparkles className="h-6 w-6" />
                AI Memory Insights
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Chat about your memories, emotions, and personal growth
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-8rem)]">
              <ScrollArea className="flex-1 pr-4 mb-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="mb-4">Start a conversation about your memories!</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                        <Button
                          variant="outline"
                          className="text-left h-auto py-3 px-4"
                          onClick={() => setInput("What patterns do you notice in my memories?")}
                        >
                          What patterns do you notice?
                        </Button>
                        <Button
                          variant="outline"
                          className="text-left h-auto py-3 px-4"
                          onClick={() => setInput("How have my emotions changed over time?")}
                        >
                          Track my emotional journey
                        </Button>
                        <Button
                          variant="outline"
                          className="text-left h-auto py-3 px-4"
                          onClick={() => setInput("What are my most common themes?")}
                        >
                          Identify common themes
                        </Button>
                        <Button
                          variant="outline"
                          className="text-left h-auto py-3 px-4"
                          onClick={() => setInput("Help me reflect on my recent memories")}
                        >
                          Guide my reflection
                        </Button>
                      </div>
                    </div>
                  )}
                  {messages.map((message, i) => (
                    <div
                      key={i}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <form onSubmit={handleSubmit} className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your memories..."
                  className="resize-none bg-background border-border"
                  rows={2}
                  disabled={loading}
                />
                <Button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Insights;
