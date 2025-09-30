import { useAuth } from '../lib/auth-context';
import { LoginPage } from './login-page';

interface ProtectedRouteProps {
	children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
	const { user, loading } = useAuth();

	// ローディング中の表示
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

	// 未認証の場合はログインページを表示
	if (!user) {
		return <LoginPage />;
	}

	// 認証済みの場合は子コンポーネントを表示
	return <>{children}</>;
}
