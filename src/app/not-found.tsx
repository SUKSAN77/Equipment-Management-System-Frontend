import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
            <h1 className="mb-4 text-6xl font-bold text-gray-800">404</h1>
            <h2 className="mb-6 text-2xl font-semibold text-gray-600">
                Page Not Found
            </h2>
            <p className="mb-8 text-gray-500">
                The page you are looking for does not exist or has been moved.
            </p>
            <Link
                href="/"
                className="rounded-md bg-primary px-6 py-2 text-white transition-colors hover:bg-blue-700"
            >
                Go Home
            </Link>
        </div>
    );
}
