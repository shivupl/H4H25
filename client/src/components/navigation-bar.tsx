import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface NavigationBarProps {
  title?: string;
}

export function NavigationBar({ title = "Beacon." }: NavigationBarProps) {
  const { user, logoutMutation } = useAuth();

  return (
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <Link href="/">
                <a className="hover:opacity-80 transition-opacity">
                  <img
                    src="/beacon-logo.png"
                    alt="Beacon"
                    className="h-14 w-14 mr-4 object-contain bg-transparent p-1"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </a>
              </Link>
              <h1 className="text-2xl font-bold text-primary">{title}</h1>
            </div>
            <nav className="hidden md:flex space-x-4">
              <Link href="/owned-resources">
                <a className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
                  Your Resources
                </a>
              </Link>
              <Link href="/watchlist">
                <a className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
                  Watchlist
                </a>
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {user?.username}</span>
            <Button variant="outline" onClick={() => logoutMutation.mutate()}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}