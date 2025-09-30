import { useState } from 'react';
import { signInWithGoogle } from '../lib/firebase';

export function LoginPage() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleGoogleSignIn = async () => {
		try {
			setLoading(true);
			setError(null);
			await signInWithGoogle();
		} catch (error) {
			console.error('Sign in error:', error);
			setError('ログインに失敗しました。もう一度お試しください。');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50">
			<div className="w-full max-w-md space-y-8 p-8">
				<div className="text-center">
					<h2 className="mt-6 font-bold text-3xl text-gray-900">
						ログインが必要です
					</h2>
					<p className="mt-2 text-gray-600 text-sm">
						Googleアカウントでログインしてください
					</p>
				</div>

				<div className="space-y-4">
					{error && (
						<div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
							{error}
						</div>
					)}

					<button
						type="button"
						onClick={handleGoogleSignIn}
						disabled={loading}
						className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-3 font-medium text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{loading ? (
							<div className="flex items-center">
								<div className="-ml-1 mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
								ログイン中...
							</div>
						) : (
							<div className="flex items-center">
								<svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
									<title>Google logo</title>
									<path
										fill="currentColor"
										d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
									/>
									<path
										fill="currentColor"
										d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
									/>
									<path
										fill="currentColor"
										d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
									/>
									<path
										fill="currentColor"
										d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
									/>
								</svg>
								Googleでログイン
							</div>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
