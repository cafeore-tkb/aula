import {
	isRouteErrorResponse,
	Links,
	Meta,
	Navigate,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLocation,
} from 'react-router';

import { AuthProvider, useAuth } from './lib/auth-context';

export const links = () => [
	{ rel: 'preconnect', href: 'https://fonts.googleapis.com' },
	{
		rel: 'preconnect',
		href: 'https://fonts.gstatic.com',
		crossOrigin: 'anonymous',
	},
	{
		rel: 'stylesheet',
		href:
			'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
	},
];

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

function AppGuard() {
	const { user, loading, sessionExpired } = useAuth();
	const location = useLocation();

	// ローディング中
	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-center">
					<div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
					<p className="text-gray-600">読み込み中...</p>
				</div>
			</div>
		);
	}

	// セッション期限切れ or 未ログインで /login 以外なら /login へリダイレクト
	if (!user && location.pathname !== '/login') {
		return (
			<Navigate
				to="/login"
				replace
				state={{
					from: location,
					reason: sessionExpired ? 'expired' : 'unauthenticated',
				}}
			/>
		);
	}

	return <Outlet />;
}

export default function App() {
	return (
		<AuthProvider>
			<AppGuard />
		</AuthProvider>
	);
}

export function ErrorBoundary({ error }: { error: Error }) {
	let message = 'Oops!';
	let details = 'An unexpected error occurred.';
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? '404' : 'Error';
		details =
			error.status === 404
				? 'The requested page could not be found.'
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="container mx-auto p-4 pt-16">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full overflow-x-auto p-4">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
