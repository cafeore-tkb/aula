// グローバルガードを root.tsx に実装したためこのコンポーネントは不要になりました。
// 互換性のため残し、単に children を返します。今後削除予定。
interface ProtectedRouteProps {
	children: React.ReactNode;
}
export function ProtectedRoute({ children }: ProtectedRouteProps) {
	return <>{children}</>;
}
