import type { User } from 'firebase/auth';
import { useState } from 'react';
import { logOut, type UserProfile as UserProfileType } from '../lib/firebase';
import SessionStatus from './session-status';

interface UserProfileProps {
	user: User;
	userProfile?: UserProfileType | null;
}

export function UserProfile({ user, userProfile }: UserProfileProps) {
	const [loading, setLoading] = useState(false);

	const handleLogout = async () => {
		try {
			setLoading(true);
			await logOut();
		} catch (error) {
			console.error('Logout error:', error);
		} finally {
			setLoading(false);
		}
	};

	const formatDate = (timestamp: { toDate?: () => Date } | null | undefined) => {
		if (!timestamp?.toDate) return '不明';
		return timestamp.toDate().toLocaleString('ja-JP');
	};

	return (
		<div className="rounded-lg bg-white p-6 shadow-md">
			{/* セッション状態表示 */}
			<div className="mb-4">
				<SessionStatus />
			</div>

			<div className="mb-6 flex items-center space-x-4">
				{user.photoURL && (
					<img
						src={user.photoURL}
						alt={user.displayName || 'ユーザー'}
						className="h-16 w-16 rounded-full"
					/>
				)}
				<div className="flex-1">
					<h3 className="font-semibold text-gray-900 text-xl">
						{user.displayName || 'ユーザー'}
					</h3>
					<p className="text-gray-600 text-sm">{user.email}</p>
				</div>
			</div>

			{/* Firestore profile data */}
			{userProfile && (
				<div className="mb-6 space-y-3">
					<h4 className="border-b pb-1 font-medium text-gray-700 text-sm">
						アカウント情報
					</h4>
					<div className="space-y-2 text-gray-600 text-sm">
						<div className="flex justify-between">
							<span>Gmail:</span>
							<span>{userProfile.gmail}</span>
						</div>
						<div className="flex justify-between">
							<span>名前:</span>
							<span>{userProfile.name}</span>
						</div>
						<div className="flex justify-between">
							<span>年度:</span>
							<span>{userProfile.year}</span>
						</div>
						<div className="flex justify-between">
							<span>管理者:</span>
							<span
								className={
									userProfile.isAdmin ? 'font-medium text-green-600' : 'text-gray-500'
								}
							>
								{userProfile.isAdmin ? '✓' : '✗'}
							</span>
						</div>
						<div className="flex justify-between">
							<span>試験官:</span>
							<span
								className={
									userProfile.isExaminer ? 'font-medium text-green-600' : 'text-gray-500'
								}
							>
								{userProfile.isExaminer ? '✓' : '✗'}
							</span>
						</div>
						<div className="flex justify-between">
							<span>卒業済み:</span>
							<span
								className={
									userProfile.isGraduated
										? 'font-medium text-green-600'
										: 'text-gray-500'
								}
							>
								{userProfile.isGraduated ? '✓' : '✗'}
							</span>
						</div>
						<div className="flex justify-between">
							<span>作成日:</span>
							<span>{formatDate(userProfile.createdAt)}</span>
						</div>
						<div className="flex justify-between">
							<span>最終ログイン:</span>
							<span>{formatDate(userProfile.lastLoginAt)}</span>
						</div>
						<div className="flex justify-between">
							<span>更新日:</span>
							<span>{formatDate(userProfile.updatedAt)}</span>
						</div>
					</div>
				</div>
			)}

			<button
				type="button"
				onClick={handleLogout}
				disabled={loading}
				className="w-full rounded-md bg-red-600 px-4 py-2 font-medium text-sm text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{loading ? 'ログアウト中...' : 'ログアウト'}
			</button>
		</div>
	);
}
