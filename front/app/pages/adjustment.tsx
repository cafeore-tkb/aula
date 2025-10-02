import React from 'react';
import { UserProfile } from '../components/user-profile';
import { useAuth } from '../lib/auth-context';
import { Card, CardContent } from '../components/ui/card';

export default function Adjustment() {
    const day = ['月', '火', '水', '木', '金', '土', '日'];
    const periods = ['1', '2', '3', '4', '5', '6', '7', '8'];
    const startTimes = ['8:40','10:10','12:15','13:45','15:15','18:00','18:15','19:45'];
    const endTimes = ['9:55','11:25','13:30','15:00','16:45','18:00','19:30','21:00'];

    const { user, userProfile } = useAuth();

    return (
        <div className="p-6">
            {/* ユーザーがログインしている場合はプロフィールを表示 */}
            {user && (
                <div className="mb-8">
                    <UserProfile user={user} userProfile={userProfile} />
                </div>
            )}

            {/* 時間割表 */}
            <div className="mt-8">
                <h2 className="mb-4 font-bold text-2xl">時間割表</h2>
                <div className="overflow-x-auto">
                    <div className="grid min-w-[800px] grid-cols-8 gap-0 border border-gray-200">
                        {/* ヘッダー行 */}
                        <Card className="border-0 border-b border-r border-gray-200 bg-gray-100 rounded-none">
                            <CardContent className="p-4 text-center font-medium">
                                時限
                            </CardContent>
                        </Card>
                        {day.map((dayName, index) => (
                            <Card key={dayName} className={`border-0 border-b border-gray-200 bg-gray-100 rounded-none ${index < day.length - 1 ? 'border-r' : ''}`}>
                                <CardContent className="p-4 text-center font-medium">
                                    {dayName}曜日
                                </CardContent>
                            </Card>
                        ))}
                        
                        {/* 時間割セル */}
                        {periods.map((period, periodIndex) => (
                            <React.Fragment key={period}>
                                {/* 時限・時間表示 */}
                                <Card className="border-0 border-r border-gray-200 bg-gray-50 rounded-none">
                                    <CardContent className="p-4 text-center font-medium">
                                        <div className="mb-1">{period}限</div>
                                        <div className="text-xs text-gray-600">
                                            {startTimes[periodIndex]}-{endTimes[periodIndex]}
                                        </div>
                                    </CardContent>
                                </Card>
                                
                                {/* 各曜日のセル */}
                                {day.map((dayName, dayIndex) => (
                                    <Card key={`${period}-${dayName}`} className={`border-0 cursor-pointer rounded-none hover:bg-gray-50 ${dayIndex < day.length - 1 ? 'border-r border-gray-200' : ''}`}>
                                        <CardContent className="flex h-16 items-center justify-center p-4">
                                            {/* ここに授業データが入る */}
                                        </CardContent>
                                    </Card>
                                ))}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}