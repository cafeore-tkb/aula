import { EditProfile } from '../components/edit-profile';
import { ProtectedRoute } from '../components/protected-route';
import { UserProfile } from '../components/user-profile';
import { useAuth } from '../lib/auth-context';

export function meta() {
	return [
		{ title: 'ダッシュボード - React Router App' },
		{ name: 'description', content: 'ユーザーダッシュボード' },
	];
}

export default function Dashboard() {
	const { user, userProfile } = useAuth();

	return (
		<ProtectedRoute>
			<div className="min-h-screen bg-gray-100 py-8">
				<div className="mx-auto max-w-4xl px-4">
					<h1 className="mb-8 font-bold text-3xl text-gray-900">ダッシュボード</h1>

					<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
						{/* ユーザープロフィールカード */}
						<div className="space-y-6 md:col-span-1">
							{user && <UserProfile user={user} userProfile={userProfile} />}
							<EditProfile />
						</div>

						{/* メインコンテンツ */}
						<div className="space-y-6 md:col-span-2">
							<div className="rounded-lg bg-white p-6 shadow-md">
								<h2 className="mb-4 font-semibold text-gray-900 text-xl">
									ようこそ、{userProfile?.name || user?.displayName || 'ユーザー'}
									さん！
								</h2>
								<p className="text-gray-600">
									Firebase AuthenticationとFirestore
									Databaseを使用した認証・データ管理システムが正常に動作しています。
								</p>
							</div>

							<div className="rounded-lg bg-white p-6 shadow-md">
								<h3 className="mb-3 font-semibold text-gray-900 text-lg">機能</h3>
								<ul className="space-y-2 text-gray-600">
									<li>✅ Googleアカウントでのログイン</li>
									<li>✅ 認証状態の管理</li>
									<li>✅ 保護されたルート</li>
									<li>✅ Firestoreへのユーザーデータ保存</li>
									<li>✅ ユーザープロフィール表示・編集</li>
									<li>✅ 最終ログイン時刻の記録</li>
									<li>✅ ログアウト機能</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
		</ProtectedRoute>
	);
}
