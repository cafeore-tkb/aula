/** biome-ignore-all lint/complexity/useFlatMap: <explanation> */
import React, { useState, useId } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { useAuth } from '../lib/auth-context';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Adjustment() {
    const day = ['月', '火', '水', '木', '金', '土', '日'];
    const periods = ['1', '2', '3', '4', '5', '6', '7', '8'];
    const startTimes = ['8:40','10:10','12:15','13:45','15:15','18:00','18:15','19:45'];
    const endTimes = ['9:55','11:25','13:30','15:00','16:45','18:00','19:30','21:00'];

    // 8x7の2次元配列を初期化（periods x day）
    const [schedule, setSchedule] = useState<boolean[][]>(() => 
        Array(periods.length).fill(null).map(() => Array(day.length).fill(false))
    );

    // 授業頻度を管理するstate
    const [frequency, setFrequency] = useState<string>("週1回");
    
    // コメント欄のstate
    const [comment, setComment] = useState<string>("");
    
    // 認証情報を取得
    const { user } = useAuth();

    // 保存中かどうかの状態
    const [isSaving, setIsSaving] = useState<boolean>(false);

    // Firestoreに保存する関数
    const handleSave = async () => {
        if (!user) {
            alert('ログインが必要です');
            return;
        }

        try {
            setIsSaving(true);
            
            // 時間割データを整理
            const scheduleData = schedule.map((row, periodIndex) => 
                row.map((isSelected, dayIndex) => ({
                    period: periods[periodIndex],
                    day: day[dayIndex],
                    isSelected,
                    startTime: startTimes[periodIndex],
                    endTime: endTimes[periodIndex]
                }))
            ).flat();

            // Firestoreに保存
            await addDoc(collection(db, 'schedules'), {
                userId: user.uid,
                userEmail: user.email,
                userName: user.displayName || user.email || 'ユーザー',
                scheduleData,
                frequency,
                comment,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            alert('保存しました！');
        } catch (error) {
            console.error('保存エラー:', error);
            alert('保存に失敗しました');
        } finally {
            setIsSaving(false);
        }
    };

    // セルの状態をトグルする関数
    const toggleCell = (periodIndex: number, dayIndex: number) => {
        setSchedule(prev => {
            const newSchedule = [...prev];
            newSchedule[periodIndex] = [...newSchedule[periodIndex]];
            newSchedule[periodIndex][dayIndex] = !newSchedule[periodIndex][dayIndex];
            return newSchedule;
        });
    };

    const subjectNameId = useId();
    const weekly1Id = useId();
    const weekly2Id = useId();
    const examId = useId();

    return (
        <div className="h-screen bg-slate-50 p-1 sm:p-2 lg:p-8">
            <div className="h-full flex flex-col gap-2 lg:flex-row lg:gap-16">
                {/* 左側：時間割表 (3/4の幅) */}
                <div className="flex-1 lg:w-3/4 h-full lg:h-auto">
                    <div className="h-full flex flex-col">
                        <div className="flex-1 grid grid-cols-8 gap-1 bg-white p-1 rounded-xl shadow-lg border border-slate-200">
                        {/* ヘッダー行 */}
                        <Card className="bg-blue-500 text-white rounded-lg shadow-sm">
                            <CardContent className="p-1 text-center font-semibold text-xs sm:p-2 lg:p-3 lg:text-sm">
                                時限
                            </CardContent>
                        </Card>
                        {day.map((dayName, index) => (
                            <Card key={dayName} className="bg-blue-500 text-white rounded-lg shadow-sm">
                                <CardContent className="p-1 text-center font-semibold text-xs sm:p-2 lg:p-3 lg:text-sm">
                                    <span className="hidden md:inline">{dayName}曜日</span>
                                    <span className="md:hidden">{dayName}</span>
                                </CardContent>
                            </Card>
                        ))}
                        
                        {/* 時間割セル */}
                        {periods.map((period, periodIndex) => (
                            <React.Fragment key={period}>
                                {/* 時限・時間表示 */}
                                <Card className="bg-slate-100 rounded-lg shadow-sm border border-slate-200">
                                    <CardContent className="p-1 text-center font-medium sm:p-2 lg:p-2 xl:p-3">
                                        <div className="text-xs lg:text-sm">
                                            <div className="font-semibold text-slate-700">{period}限</div>
                                            <div className="text-slate-500 whitespace-nowrap text-xs">
                                                <span className="hidden lg:inline">{startTimes[periodIndex]}-{endTimes[periodIndex]}</span>
                                                <span className="hidden sm:inline lg:hidden">{startTimes[periodIndex]}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                
                                {/* 各曜日のセル */}
                                {day.map((dayName, dayIndex) => {
                                    const isSelected = schedule[periodIndex][dayIndex];
                                    return (
                                        <Button 
                                            key={`${period}-${dayName}`}
                                            variant={isSelected ? "default" : "ghost"}
                                            className={`h-6 sm:h-8 lg:h-10 xl:h-12 w-full text-xs sm:text-sm lg:text-base xl:text-lg rounded-lg font-semibold transition-all duration-300 border shadow-sm hover:shadow-md ${
                                                isSelected 
                                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg' 
                                                    : 'hover:bg-gray-200 text-slate-600 hover:text-slate-800'
                                            }`}
                                            onClick={() => toggleCell(periodIndex, dayIndex)}
                                        >
                                            {isSelected ? '〇' : '×'}
                                        </Button>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                        </div>
                    </div>
                </div>

                {/* 右側：入力欄 (1/4の幅) */}
                <div className="mt-4 lg:mt-0 lg:w-1/4 h-full lg:h-auto">
                <div className="h-full flex flex-col space-y-2 lg:space-y-4">
                    {/* タイトル */}
                    <div className="text-center lg:text-left">
                        <h2 className="text-lg font-bold sm:text-xl lg:text-2xl text-blue-600 mb-1">秋Aシフト調査</h2>
                        <p className="text-slate-600 text-xs lg:text-sm">希望する時限を選択してください</p>
                    </div>
                    
                    {/* ユーザー名表示 */}
                    {user && (
                        <Card className="bg-indigo-50 border-indigo-200 shadow-sm">
                            <CardContent className="p-2 lg:p-3">
                                <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                                        <span className="text-white font-semibold text-xs">
                                            {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">ログイン中</p>
                                        <p className="font-medium text-slate-800 text-sm">
                                            {user.displayName || user.email || 'ユーザー'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    <Card className="bg-white shadow-sm border border-slate-200 rounded-xl">
                        <CardContent className="p-3 lg:p-4">
                            <label htmlFor={subjectNameId} className="block text-sm font-semibold text-slate-700 mb-2">
                                💬 コメント
                            </label>
                            <textarea 
                                id={subjectNameId}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={2}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                placeholder="ご要望やコメントがあればお書きください..."
                            />
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-white shadow-sm border border-slate-200 rounded-xl">
                        <CardContent className="p-3 lg:p-4">
                            <h3 className="text-sm font-semibold text-slate-700 mb-2">📊 希望頻度</h3>
                            <RadioGroup value={frequency} onValueChange={setFrequency} className="space-y-1">
                                <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                    <RadioGroupItem value="週1回" id={weekly1Id} className="text-indigo-600" />
                                    <label htmlFor={weekly1Id} className="text-sm font-medium cursor-pointer flex-1">
                                        週1回
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                    <RadioGroupItem value="週2回" id={weekly2Id} className="text-indigo-600" />
                                    <label htmlFor={weekly2Id} className="text-sm font-medium cursor-pointer flex-1">
                                        週2回
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                    <RadioGroupItem value="試験官" id={examId} className="text-indigo-600" />
                                    <label htmlFor={examId} className="text-sm font-medium cursor-pointer flex-1">
                                        試験官
                                    </label>
                                </div>
                            </RadioGroup>
                        </CardContent>
                    </Card>
                    <div className="flex gap-2">
                        <Button 
                            className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" 
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <span className="flex items-center justify-center">
                                    保存中...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center">
                                    💾 保存
                                </span>
                            )}
                        </Button>
                        <Button 
                            variant="outline" 
                            className="flex-1 py-2 border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
                            onClick={() => {
                                setSchedule(Array(periods.length).fill(null).map(() => Array(day.length).fill(false)));
                                setFrequency("週1回");
                                setComment("");
                            }}
                        >
                            🗑️ クリア
                        </Button>
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
}