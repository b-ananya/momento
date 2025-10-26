import { AuthForm } from "@/components/AuthForm";
import heroBackground from "@/assets/hero-background.jpg";

const Auth = () => {
  return (
    <div className="min-h-screen bg-[var(--gradient-warm)] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-40">
        <img
          src={heroBackground}
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="relative z-10 px-4">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-primary mb-2">momento</h1>
          <p className="text-muted-foreground">Your personal memory scrapbook</p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
};

export default Auth;
