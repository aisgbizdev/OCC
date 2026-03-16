import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
      <h1 className="text-6xl font-black text-primary mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">System Sector Not Found</p>
      <Link href="/dashboard">
        <Button>Return to Command Center</Button>
      </Link>
    </div>
  );
}
