import { useEffect, useState } from 'react';
import { getAuthSession, isSessionValid } from './cookie-utils';

/**
 * セッションの有効性を監視するカスタムフック
 */
export function useSessionCheck() {
	const [isValid, setIsValid] = useState(false);
	const [sessionData, setSessionData] =
		useState<ReturnType<typeof getAuthSession>>(null);

	useEffect(() => {
		const checkSession = () => {
			const valid = isSessionValid();
			const data = getAuthSession();

			setIsValid(valid);
			setSessionData(data);
		};

		// 初回チェック
		checkSession();

		// 定期的にセッションをチェック（1分間隔）
		const interval = setInterval(checkSession, 60 * 1000);

		return () => clearInterval(interval);
	}, []);

	return { isValid, sessionData };
}

/**
 * セッション残り時間を取得するカスタムフック
 */
export function useSessionTimeRemaining() {
	const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

	useEffect(() => {
		const updateTimeRemaining = () => {
			const sessionData = getAuthSession();

			if (!sessionData) {
				setTimeRemaining(null);
				return;
			}

			const threeHours = 3 * 60 * 60 * 1000; // 3時間（ミリ秒）
			const elapsed = Date.now() - sessionData.timestamp;
			const remaining = threeHours - elapsed;

			if (remaining <= 0) {
				setTimeRemaining(null);
			} else {
				setTimeRemaining(remaining);
			}
		};

		// 初回更新
		updateTimeRemaining();

		// 1分間隔で更新
		const interval = setInterval(updateTimeRemaining, 60 * 1000);

		return () => clearInterval(interval);
	}, []);

	// 残り時間を時間:分:秒の形式で返す
	const formatTimeRemaining = () => {
		if (!timeRemaining) return null;

		const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
		const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
		const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);

		return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	};

	return {
		timeRemaining,
		timeRemainingMs: timeRemaining,
		timeRemainingFormatted: formatTimeRemaining(),
	};
}
