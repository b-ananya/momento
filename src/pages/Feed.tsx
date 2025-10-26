import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { MemoryCard } from "@/components/MemoryCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import heroBackground from "@/assets/hero-background.jpg";

interface Memory {
  id: string;
  photo_url?: string;
  thought: string;
  tags?: string[];
  created_at: string;
}

const Feed = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMemories(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading memories",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-warm)]">
      <Navigation />
      
      {/* Hero Section */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={heroBackground}
          alt="Momento"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-card mb-2 drop-shadow-lg">
              Your Memory Scrapbook
            </h1>
            <p className="text-lg text-card/90 drop-shadow-md">
              Every moment, beautifully preserved
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center min-h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : memories.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground mb-4">
              No memories yet. Start capturing your moments!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memories.map((memory) => (
              <MemoryCard key={memory.id} {...memory} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;
