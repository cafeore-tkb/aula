import { useSessionTimeRemaining } from '../lib/session-hooks';

export default function SessionStatus() {
	const { timeRemainingFormatted, timeRemainingMs } = useSessionTimeRemaining();

	if (!timeRemainingMs) {
		return null;
	}

	// 残り30分未満の場合は警告色で表示
	const isWarning = timeRemainingMs < 30 * 60 * 1000;

	return (
		<div
			className={`rounded-full px-3 py-1 text-sm ${
				isWarning
					? 'border border-yellow-300 bg-yellow-100 text-yellow-800'
					: 'border border-blue-300 bg-blue-100 text-blue-800'
			}`}
		>
			セッション残り時間: {timeRemainingFormatted}
			{isWarning && (
				<span className="ml-2 font-semibold text-xs">⚠️ まもなく期限切れ</span>
			)}
		</div>
	);
}
