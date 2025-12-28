import React, { useState, useEffect } from 'react';
import type { SubjectGrades, TestScore } from '../types/grading';
import { 
  calculateWeightedAverage, 
  calculateGradeFromAverage, 
  getRequiredAverageForGrade,
  calculateRequiredScoreForNextTest
} from '../utils/subGradeCalculator';
import { getCurrentUser, getUserStorageKey } from '../utils/userManager';

const SubGradeCalculator: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectGrades[]>([]);
  const [currentSubjectId, setCurrentSubjectId] = useState<string>('');
  
  // シンプルな入力フォーム
  const [formData, setFormData] = useState({
    subjectName: '',
    testName: '',
    score: '',
    maxScore: '100',
    targetGrade: 4,
    participation: '16'
  });

  // ユーザー固有のローカルストレージキーを取得
  const getStorageKey = () => {
    const currentUser = getCurrentUser();
    return currentUser ? getUserStorageKey(currentUser.userId, 'subGradeSubjects') : 'subGradeSubjects';
  };

  // ローカルストレージからデータを読み込み
  useEffect(() => {
    const saved = localStorage.getItem(getStorageKey());
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((subject: any) => ({
          ...subject,
          currentTests: subject.currentTests.map((test: any) => ({
            ...test,
            date: new Date(test.date)
          })),
          upcomingTests: subject.upcomingTests || [],
          assignments: subject.assignments || []
        }));
        setSubjects(parsed);
        if (parsed.length > 0) {
          setCurrentSubjectId(parsed[0].id);
          setFormData(prev => ({ 
            ...prev, 
            subjectName: parsed[0].subjectName,
            targetGrade: parsed[0].targetGrade,
            participation: parsed[0].participationScore.toString()
          }));
        }
      } catch (error) {
        console.error('データ読み込みエラー:', error);
      }
    }
  }, []);

  // データ保存
  const saveData = (newSubjects: SubjectGrades[]) => {
    setSubjects(newSubjects);
    localStorage.setItem(getStorageKey(), JSON.stringify(newSubjects));
    console.log('データ保存:', newSubjects); // デバッグ用
  };

  // テスト追加
  const addTest = () => {
    console.log('addTest called with:', formData); // デバッグ用
    
    if (!formData.testName.trim() || !formData.score || !formData.subjectName.trim()) {
      alert('すべての項目を入力してください');
      return;
    }

    let targetSubject = subjects.find(s => s.subjectName === formData.subjectName.trim());
    let newSubjects = [...subjects];

    // 平常点を数値に変換
    const participationScore = parseInt(formData.participation) || 0;

    // 科目が存在しない場合は新規作成
    if (!targetSubject) {
      console.log('新しい科目を作成:', formData.subjectName); // デバッグ用
      targetSubject = {
        id: Date.now().toString(),
        subjectName: formData.subjectName.trim(),
        studentId: 'current-student',
        currentTests: [],
        upcomingTests: [],
        assignments: [],
        participationScore: participationScore,
        currentGrade: 3,
        targetGrade: formData.targetGrade,
      };
      newSubjects.push(targetSubject);
      setCurrentSubjectId(targetSubject.id);
    } else {
      // 既存の科目の場合、平常点と目標評定を現在の入力値で更新
      console.log('既存科目に追加、平常点を更新:', participationScore); // デバッグ用
      newSubjects = newSubjects.map(subject => 
        subject.id === targetSubject!.id
          ? { 
              ...subject, 
              participationScore: participationScore,
              targetGrade: formData.targetGrade
            }
          : subject
      );
    }

    // テストを追加
    const newTest: TestScore = {
      id: Date.now().toString(),
      name: formData.testName.trim(),
      score: parseInt(formData.score),
      maxScore: parseInt(formData.maxScore),
      weight: 80,
      date: new Date(),
      participationScore: participationScore // テストごとの平常点を保存
    };

    console.log('新しいテスト:', newTest); // デバッグ用

    newSubjects = newSubjects.map(subject => 
      subject.id === targetSubject!.id
        ? { 
            ...subject, 
            currentTests: [...subject.currentTests, newTest],
            participationScore: participationScore,
            targetGrade: formData.targetGrade
          }
        : subject
    );

    console.log('更新された科目データ:', newSubjects); // デバッグ用
    console.log('現在の平常点:', formData.participation); // デバッグ用追加
    saveData(newSubjects);
    
    // フォームリセット（科目名は残す）
    setFormData(prev => ({
      ...prev,
      testName: '',
      score: '',
      maxScore: '100'
    }));
  };

  // 計算結果取得
  const getResults = (subject: SubjectGrades) => {
    try {
      const avg = calculateWeightedAverage(subject.currentTests, [], subject.participationScore);
      const grade = calculateGradeFromAverage(avg);
      const targetAvg = getRequiredAverageForGrade(subject.targetGrade);
      const needed = Math.max(0, targetAvg - avg);
      
      // 次のテストで必要な点数を正しく計算
      const nextTestScore = calculateRequiredScoreForNextTest(
        subject.currentTests,
        subject.participationScore,
        subject.targetGrade,
        100 // 100点満点と仮定
      );
      
      return {
        currentAverage: Math.round(avg * 10) / 10,
        currentGrade: grade,
        targetAverage: targetAvg,
        pointsNeeded: Math.round(needed * 10) / 10,
        isAchieved: grade >= subject.targetGrade,
        nextTestScore: Math.round(nextTestScore * 10) / 10
      };
    } catch (error) {
      console.error('計算エラー:', error);
      return null;
    }
  };

  const currentSubject = subjects.find(s => s.id === currentSubjectId);
  const results = currentSubject ? getResults(currentSubject) : null;

  console.log('現在の科目:', currentSubject); // デバッグ用
  console.log('計算結果:', results); // デバッグ用

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto',
        paddingTop: '20px'
      }}>
        
        {/* ヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: '30px', color: 'white' }}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '700' }}>
            🎯 評定計算機
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, margin: 0 }}>
            シンプル・簡単・すぐ分かる
          </p>
        </div>

        {/* メイン入力カード */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }}>
          
          {/* 科目選択・入力 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '1.1rem', 
              fontWeight: '600', 
              marginBottom: '10px', 
              color: '#333' 
            }}>
              📚 科目名
            </label>
            
            {subjects.length > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {subjects.map(subject => (
                    <button
                      key={subject.id}
                      onClick={() => {
                        console.log('科目選択:', subject.subjectName); // デバッグ用
                        console.log('選択した科目の平常点:', subject.participationScore); // デバッグ用追加
                        setFormData(prev => ({ 
                          ...prev, 
                          subjectName: subject.subjectName,
                          targetGrade: subject.targetGrade,
                          participation: subject.participationScore.toString()
                        }));
                        setCurrentSubjectId(subject.id);
                      }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: subject.subjectName === formData.subjectName ? '#4CAF50' : '#e9ecef',
                        color: subject.subjectName === formData.subjectName ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'all 0.2s'
                      }}
                    >
                      {subject.subjectName}
                    </button>
                  ))}
                </div>
                <div style={{ textAlign: 'center', margin: '15px 0', color: '#666' }}>
                  または新しい科目名を入力
                </div>
              </div>
            )}
            
            <input
              type="text"
              placeholder="例：数学、英語、理科..."
              value={formData.subjectName}
              onChange={(e) => {
                console.log('科目名入力:', e.target.value); // デバッグ用
                setFormData(prev => ({ ...prev, subjectName: e.target.value }));
              }}
              style={{
                width: '100%',
                padding: '15px',
                border: '2px solid #e1e5e9',
                borderRadius: '12px',
                fontSize: '16px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          {/* テスト入力 */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                marginBottom: '10px', 
                color: '#333' 
              }}>
                📝 テスト名
              </label>
              <input
                type="text"
                placeholder="中間テスト、小テストなど"
                value={formData.testName}
                onChange={(e) => {
                  console.log('テスト名入力:', e.target.value); // デバッグ用
                  setFormData(prev => ({ ...prev, testName: e.target.value }));
                }}
                style={{
                  width: '100%',
                  padding: '15px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '12px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                marginBottom: '10px', 
                color: '#333' 
              }}>
                🔢 得点
              </label>
              <input
                type="number"
                placeholder="85"
                value={formData.score}
                onChange={(e) => {
                  console.log('得点入力:', e.target.value); // デバッグ用
                  setFormData(prev => ({ ...prev, score: e.target.value }));
                }}
                style={{
                  width: '100%',
                  padding: '15px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '12px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                marginBottom: '10px', 
                color: '#333' 
              }}>
                💯 満点
              </label>
              <input
                type="number"
                value={formData.maxScore}
                onChange={(e) => {
                  console.log('満点入力:', e.target.value); // デバッグ用
                  setFormData(prev => ({ ...prev, maxScore: e.target.value }));
                }}
                style={{
                  width: '100%',
                  padding: '15px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '12px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* 設定 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                marginBottom: '10px', 
                color: '#333' 
              }}>
                🎯 目標評定
              </label>
              <select
                value={formData.targetGrade}
                onChange={(e) => {
                  console.log('目標評定変更:', e.target.value); // デバッグ用
                  setFormData(prev => ({ ...prev, targetGrade: parseInt(e.target.value) }));
                }}
                style={{
                  width: '100%',
                  padding: '15px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '12px',
                  fontSize: '16px',
                  outline: 'none'
                }}
              >
                <option value={5}>5 (80点以上)</option>
                <option value={4}>4 (65-79点)</option>
                <option value={3}>3 (50-64点)</option>
                <option value={2}>2 (40-49点)</option>
                <option value={1}>1 (39点以下)</option>
              </select>
            </div>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                marginBottom: '10px', 
                color: '#333' 
              }}>
                ✏️ 平常点 (20点満点)
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={formData.participation}
                onChange={(e) => {
                  console.log('平常点変更:', e.target.value); // デバッグ用
                  setFormData(prev => ({ ...prev, participation: e.target.value }));
                }}
                style={{
                  width: '100%',
                  padding: '15px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '12px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* 追加ボタン */}
          <button
            onClick={addTest}
            style={{
              width: '100%',
              padding: '18px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#45a049';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(76, 175, 80, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#4CAF50';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
            }}
          >
            ➕ テストを追加して計算
          </button>
        </div>

        {/* 結果表示 */}
        {results && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '1.8rem', textAlign: 'center' }}>
              📊 {currentSubject?.subjectName} の状況
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginBottom: '25px' }}>
              {/* 現在の評定 */}
              <div style={{
                textAlign: 'center',
                padding: '25px',
                backgroundColor: results.currentGrade >= formData.targetGrade ? '#e8f5e8' : '#fff3e0',
                borderRadius: '15px',
                border: `3px solid ${results.currentGrade >= formData.targetGrade ? '#4CAF50' : '#FF9800'}`
              }}>
                <div style={{ 
                  fontSize: '3rem', 
                  fontWeight: 'bold', 
                  color: results.currentGrade >= formData.targetGrade ? '#4CAF50' : '#FF9800',
                  marginBottom: '10px'
                }}>
                  {results.currentGrade}
                </div>
                <div style={{ fontSize: '1.1rem', color: '#666', marginBottom: '5px' }}>現在の評定</div>
                <div style={{ fontSize: '0.9rem', color: '#888' }}>平均: {results.currentAverage}点</div>
              </div>
              
              {/* 目標評定 */}
              <div style={{
                textAlign: 'center',
                padding: '25px',
                backgroundColor: '#f0f8ff',
                borderRadius: '15px',
                border: '3px solid #2196F3'
              }}>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#2196F3', marginBottom: '10px' }}>
                  {formData.targetGrade}
                </div>
                <div style={{ fontSize: '1.1rem', color: '#666', marginBottom: '5px' }}>目標評定</div>
                <div style={{ fontSize: '0.9rem', color: '#888' }}>必要: {results.targetAverage}点</div>
              </div>
              
              {/* 達成状況 */}
              <div style={{
                textAlign: 'center',
                padding: '25px',
                backgroundColor: results.isAchieved ? '#e8f5e8' : '#ffebee',
                borderRadius: '15px',
                border: `3px solid ${results.isAchieved ? '#4CAF50' : '#f44336'}`
              }}>
                <div style={{ 
                  fontSize: '3rem', 
                  fontWeight: 'bold', 
                  color: results.isAchieved ? '#4CAF50' : '#f44336',
                  marginBottom: '10px'
                }}>
                  {results.isAchieved ? '🎉' : '💪'}
                </div>
                <div style={{ fontSize: '1.1rem', color: '#666', marginBottom: '5px' }}>
                  {results.isAchieved ? '達成済み！' : '頑張ろう！'}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#888' }}>
                  {results.isAchieved ? 'おめでとう' : `あと${results.pointsNeeded}点`}
                </div>
              </div>
            </div>

            {/* 具体的なアドバイス */}
            <div style={{
              padding: '20px',
              backgroundColor: results.isAchieved ? '#e8f5e8' : '#fff3e0',
              borderRadius: '15px',
              border: `2px solid ${results.isAchieved ? '#4CAF50' : '#FF9800'}`,
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: '1.3rem', 
                fontWeight: '600', 
                color: results.isAchieved ? '#2e7d32' : '#e65100',
                marginBottom: '10px'
              }}>
                {results.isAchieved ? '🎯 目標達成！' : '📈 次のテストで頑張ろう！'}
              </div>
              <div style={{ fontSize: '1.1rem', color: results.isAchieved ? '#2e7d32' : '#bf360c' }}>
                {results.isAchieved 
                  ? `素晴らしい！評定${formData.targetGrade}を達成しています！` 
                  : results.nextTestScore > 100
                    ? '何点取っても達成できません。'
                    : `次のテストで約${results.nextTestScore}点以上取れば目標達成です！`
                }
              </div>
            </div>

            {/* テスト履歴 */}
            {currentSubject && currentSubject.currentTests.length > 0 && (
              <div style={{ marginTop: '25px' }}>
                <h3 style={{ color: '#333', marginBottom: '15px' }}>📝 テスト履歴</h3>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {currentSubject.currentTests.map(test => (
                    <div key={test.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '15px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '10px',
                      border: '1px solid #e9ecef'
                    }}>
                      <span style={{ fontWeight: '500', color: '#333' }}>{test.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ color: '#666' }}>
                          {test.score}/{test.maxScore}点 ({Math.round((test.score / test.maxScore) * 100)}%)
                          {test.participationScore !== undefined && (
                            <span style={{ marginLeft: '10px', fontSize: '0.9em' }}>
                              平常点: {test.participationScore}
                            </span>
                          )}
                        </span>
                        <button
                          onClick={() => {
                            if (confirm('このテストを削除しますか？')) {
                              const updated = subjects.map(subject => 
                                subject.id === currentSubject.id
                                  ? { ...subject, currentTests: subject.currentTests.filter(t => t.id !== test.id) }
                                  : subject
                              );
                              saveData(updated);
                            }
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '16px',
                            cursor: 'pointer',
                            color: '#dc3545'
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 初回メッセージ */}
        {subjects.length === 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🚀</div>
            <h2 style={{ color: '#333', marginBottom: '15px', fontSize: '1.8rem' }}>
              さあ、始めましょう！
            </h2>
            <p style={{ color: '#666', fontSize: '1.2rem', lineHeight: '1.6' }}>
              科目名とテスト結果を入力するだけで、<br />
              目標評定に必要な点数が分かります。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubGradeCalculator;