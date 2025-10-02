import { useId, useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { updateUserProfile } from '../lib/firebase';

export function EditProfile() {
	const { user, userProfile, refreshProfile } = useAuth();
	const [isEditing, setIsEditing] = useState(false);
	const [loading, setLoading] = useState(false);
	const [name, setName] = useState(userProfile?.name || '');
	const [year, setYear] = useState(
		userProfile?.year || new Date().getFullYear(),
	);
	const nameId = useId();
	const yearId = useId();

	const handleSave = async () => {
		if (!user || !name.trim()) return;

		try {
			setLoading(true);
			await updateUserProfile(user.uid, {
				name: name.trim(),
				year: year,
			});
			await refreshProfile();
			setIsEditing(false);
		} catch (error) {
			console.error('Error updating profile:', error);
			alert('プロフィールの更新に失敗しました');
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		setName(userProfile?.name || '');
		setYear(userProfile?.year || new Date().getFullYear());
		setIsEditing(false);
	};

	if (!user || !userProfile) return null;

	return (
		<div className="rounded-lg bg-white p-6 shadow-md">
			<h3 className="mb-4 font-semibold text-gray-900 text-lg">
				プロフィール編集
			</h3>

			{isEditing ? (
				<div className="space-y-4">
					<div>
						<label
							htmlFor={nameId}
							className="mb-1 block font-medium text-gray-700 text-sm"
						>
							名前
						</label>
						<input
							type="text"
							id={nameId}
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="名前を入力"
						/>
					</div>

					<div>
						<label
							htmlFor={yearId}
							className="mb-1 block font-medium text-gray-700 text-sm"
						>
							年度
						</label>
						<input
							type="number"
							id={yearId}
							value={year}
							onChange={(e) => setYear(Number(e.target.value))}
							className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							min="2000"
							max="2050"
						/>
					</div>

					<div className="flex space-x-3">
						<button
							type="button"
							onClick={handleSave}
							disabled={loading || !name.trim()}
							className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{loading ? '保存中...' : '保存'}
						</button>
						<button
							type="button"
							onClick={handleCancel}
							disabled={loading}
							className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
						>
							キャンセル
						</button>
					</div>
				</div>
			) : (
				<div className="space-y-4">
					<div>
						<p className="font-medium text-gray-700 text-sm">名前</p>
						<p className="text-gray-900">{userProfile.name || '未設定'}</p>
					</div>
					<div>
						<p className="font-medium text-gray-700 text-sm">Gmail</p>
						<p className="text-gray-900">{userProfile.gmail}</p>
					</div>
					<div>
						<p className="font-medium text-gray-700 text-sm">年度</p>
						<p className="text-gray-900">{userProfile.year}</p>
					</div>

					<button
						type="button"
						onClick={() => setIsEditing(true)}
						className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						編集
					</button>
				</div>
			)}
		</div>
	);
}
