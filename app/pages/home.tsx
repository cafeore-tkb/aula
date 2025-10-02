import { UserProfile } from '../components/user-profile';
import { useAuth } from '../lib/auth-context';

export function Home() {
	const { user, userProfile } = useAuth();

	return (
		<div>
			{/* ユーザーがログインしている場合はプロフィールを表示 */}
			{user && (
				<div className="mb-8">
					<UserProfile user={user} userProfile={userProfile} />
				</div>
			)}

			<div className="w-full max-w-[300px] space-y-6 px-4">
				<nav className="space-y-4 rounded-3xl border border-gray-200 p-6 dark:border-gray-700">
					<p className="text-center text-gray-700 leading-6 dark:text-gray-200">
						What&apos;s next?
					</p>
					<ul>
						{/* ダッシュボードへのリンクを認証済みユーザーに表示 */}
						{user && (
							<li>
								<a
									className="group flex items-center gap-3 self-stretch p-3 text-blue-700 leading-normal hover:underline dark:text-blue-500"
									href="/dashboard"
								>
									<svg
										className="mr-2 h-5 w-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<title>ダッシュボード</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
										/>
									</svg>
									ダッシュボード
								</a>
							</li>
						)}
					</ul>
				</nav>
			</div>
		</div>
	);
}