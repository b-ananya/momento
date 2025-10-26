import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface MemoryCardProps {
  photo_url?: string;
  thought: string;
  tags?: string[];
  created_at: string;
}

export const MemoryCard = ({ photo_url, thought, tags, created_at }: MemoryCardProps) => {
  const date = new Date(created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <Card className="overflow-hidden shadow-[var(--shadow-polaroid)] bg-card border-border transform hover:scale-[1.02] transition-transform duration-200">
      {photo_url && (
        <div className="aspect-square overflow-hidden bg-muted">
          <img
            src={photo_url}
            alt="Memory"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardContent className="p-4 space-y-3">
        <p className="text-sm text-foreground leading-relaxed">{thought}</p>
        <div className="flex flex-wrap gap-2">
          {tags?.map((tag) => (
            <Badge 
              key={tag} 
              variant="secondary" 
              className="bg-secondary text-secondary-foreground text-xs"
            >
              {tag}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{date}</p>
      </CardContent>
    </Card>
  );
};
