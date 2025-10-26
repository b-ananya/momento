import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Upload as UploadIcon, Sparkles } from "lucide-react";

const Upload = () => {
  const [thought, setThought] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thought.trim()) {
      toast({ title: "Please add a thought", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let photoUrl = null;

      // Upload photo if provided
      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('memory-photos')
          .upload(fileName, photo);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('memory-photos')
          .getPublicUrl(fileName);

        photoUrl = publicUrl;
      }

      // Generate tags using AI
      const { data: tagsData, error: tagsError } = await supabase.functions.invoke('generate-tags', {
        body: { thought, hasPhoto: !!photo }
      });

      if (tagsError) {
        console.error("Error generating tags:", tagsError);
      }

      const tags = tagsData?.tags || ['memory'];

      // Insert memory
      const { error: insertError } = await supabase
        .from('memories')
        .insert({
          user_id: user.id,
          thought,
          photo_url: photoUrl,
          tags
        });

      if (insertError) throw insertError;

      toast({ 
        title: "Memory saved! ✨", 
        description: "Your moment has been preserved." 
      });
      
      navigate('/');
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Error saving memory",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-warm)]">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-[var(--shadow-polaroid)] bg-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-primary flex items-center gap-2">
                <UploadIcon className="h-6 w-6" />
                Capture a Memory
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Add a photo and thought to your scrapbook
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="photo" className="text-foreground">Photo (optional)</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="bg-background border-border"
                  />
                  {photo && (
                    <div className="mt-4 aspect-square max-w-sm mx-auto overflow-hidden rounded-lg border-4 border-card shadow-[var(--shadow-soft)]">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thought" className="text-foreground">Your Thought</Label>
                  <Textarea
                    id="thought"
                    value={thought}
                    onChange={(e) => setThought(e.target.value)}
                    placeholder="What's on your mind? Describe this moment..."
                    className="min-h-32 bg-background border-border resize-none"
                    required
                  />
                </div>

                <div className="bg-accent/20 p-4 rounded-lg border border-accent/30">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent-foreground" />
                    AI will automatically generate tags for your memory
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={uploading}
                >
                  {uploading ? "Saving..." : "Save Memory"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Upload;
