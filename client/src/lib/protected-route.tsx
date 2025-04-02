import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route, Redirect } from "wouter";

type ProtectedRouteProps = {
  path: string;
  component: () => React.JSX.Element;
  roles?: string[]; // Optional array of allowed roles
};

export function ProtectedRoute({
  path,
  component: Component,
  roles,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        // If not authenticated, redirect to login
        if (!user) {
          return <Redirect to="/auth" />;
        }

        // If roles are specified and user doesn't have the required role
        if (roles && roles.length > 0 && !roles.includes(user.role)) {
          // Redirect based on user's role
          if (user.role === 'admin') {
            return <Redirect to="/admin" />;
          } else if (user.role === 'seller') {
            return <Redirect to="/seller" />;
          } else {
            return <Redirect to="/user-dashboard" />;
          }
        }

        return <Component />;
      }}
    </Route>
  );
}