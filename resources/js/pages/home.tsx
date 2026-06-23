import { Link } from "react-router-dom";

export default function Home() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="text-center space-y-6">
                <h1 className="text-4xl font-bold text-foreground mb-4">
                    Laravel + React
                </h1>
                <p className="text-muted-foreground">
                    Your application is ready.
                </p>
                <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3 text-sm font-medium transition-colors hover:bg-primary/90"
                >
                    Go to Dashboard
                </Link>
            </div>
        </div>
    );
}
