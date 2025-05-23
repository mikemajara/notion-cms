import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container mx-auto py-8 max-w-4xl text-center">
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-muted-foreground">404</h1>
          <h2 className="text-2xl font-semibold mt-2">Resource Not Found</h2>
          <p className="text-muted-foreground mt-2">
            The resource you&apos;re looking for doesn&apos;t exist or may have
            been removed.
          </p>
        </div>

        <Button asChild>
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Resources
          </Link>
        </Button>
      </div>
    </div>
  );
}
