import React, { useState } from 'react';
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
  const [viewSemester, setViewSemester] = useState<string>(''); // 評定表示用の学期選択
  
  // シンプルな入力フォーム
  const [formData, setFormData] = useState({
    subjectName: '',
    semester: '',
    testName: '',
    score: '',
    maxScore: '100',
    targetGrade: 4,
    participation: '16'
  });

  // ユーザー固有のローカルストレージキーを取得（技能教科用）
  const getStorageKey = () => {
    const currentUser = getCurrentUser();
    return currentUser ? getUserStorageKey(currentUser.userId, 'subGradeSubjects') : 'subGradeSubjects';
  };

  // ローカルストレージからデータを読み込み
  React.useEffect(() => {
    const saved = localStorage.getItem(getStorageKey());
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((subject: any) => ({
          ...subject,
          currentTests: subject.currentTests.map((test: any) => ({
            ...test,
            date: new Date(test.date),
            semester: test.semester || ''
          })),
          upcomingTests: subject.upcomingTests || [],
          assignments: subject.assignments || []
        }));
        
        setSubjects(parsed);
        
        if (parsed.length > 0 && !currentSubjectId) {
          setCurrentSubjectId(parsed[0].id);
        }
      } catch (error) {
        console.error('データの読み込みに失敗しました:', error);
      }
    }
  }, []);

  // ローカルストレージにデータを保存
  React.useEffect(() => {
    if (subjects.length > 0) {
      localStorage.setItem(getStorageKey(), JSON.stringify(subjects));
    }
  }, [subjects]);

  // 計算ロジック
  const getResults = (subject: SubjectGrades, selectedSemester: string) => {
    try {
      // 指定学期のテストのみをフィルタリング
      const relevantTests = subject.currentTests.filter(test => {
        if (selectedSemester === '全学期') return true;
        return test.semester === selectedSemester;
      });

      if (relevantTests.length === 0) {
        return {
          currentAverage: 0,
          currentGrade: 0,
          targetAverage: getRequiredAverageForGrade(subject.targetGrade, 'regular'),
          pointsNeeded: getRequiredAverageForGrade(subject.targetGrade, 'regular'),
          isAchieved: false,
          nextTestScore: 0,
          keepGradeScore: 0,
          testCount: 0
        };
      }

      const avg = calculateWeightedAverage(relevantTests, [], subject.participationScore);
      const grade = calculateGradeFromAverage(avg, 'regular');
      const targetAvg = getRequiredAverageForGrade(subject.targetGrade, 'regular');
      const needed = Math.max(0, targetAvg - avg);
      
      console.log(`📊 ${selectedSemester || '全学期'}の計算結果:`);
      console.log(`- 平均点: ${avg.toFixed(1)}点`);
      console.log(`- 評定: ${grade}`);
      console.log(`- 目標平均: ${targetAvg}点`);
      console.log(`- 不足点: ${needed.toFixed(1)}点`);
      
      // 次のテストで必要な点数を計算（技能教科用）
      const nextTestScore = calculateRequiredScoreForNextTest(
        relevantTests,
        subject.participationScore,
        subject.targetGrade,
        100,
        subject.participationScore,
        'regular'
      );
      
      return {
        currentAverage: Math.round(avg * 10) / 10,
        currentGrade: grade,
        targetAverage: targetAvg,
        pointsNeeded: Math.round(needed * 10) / 10,
        isAchieved: grade >= subject.targetGrade,
        nextTestScore: Math.round(nextTestScore * 10) / 10,
        keepGradeScore: 0,
        testCount: relevantTests.length
      };
    } catch (error) {
      console.error('計算エラー:', error);
      return null;
    }
  };

  const currentSubject = subjects.find(s => s.id === currentSubjectId);
  
  // 結果を計算 - 評定表示用の学期選択を使用
  const results = React.useMemo(() => {
    if (!currentSubject) return null;
    
    // 評定表示用の学期が選択されていない場合は計算しない
    if (!viewSemester || viewSemester === '') {
      return null;
    }
    
    const selectedSemester = viewSemester;
    console.log(`\n🎯 技能評価計算実行:`);
    console.log(`- 科目: ${currentSubject.subjectName}`);
    console.log(`- 選択学期: ${selectedSemester}`);
    
    const calculatedResults = getResults(currentSubject, selectedSemester);
    console.log(`- 計算結果: 評定${calculatedResults?.currentGrade} (テスト数: ${calculatedResults?.testCount})`);
    
    return calculatedResults;
  }, [currentSubject, viewSemester]);

  // フォーム送信ハンドラ（主要教科と同じ名前）
  const addTest = () => {
    if (!formData.subjectName || !formData.semester || !formData.testName || !formData.score) {
      alert('すべての項目を入力してください');
      return;
    }

    const score = parseInt(formData.score);
    const maxScore = parseInt(formData.maxScore);
    const participation = parseInt(formData.participation);

    if (isNaN(score) || isNaN(maxScore) || isNaN(participation)) {
      alert('点数は数値で入力してください');
      return;
    }

    // 新しいテストデータを作成
    const newTest: TestScore = {
      id: Date.now().toString(),
      name: formData.testName,
      score: score,
      maxScore: maxScore,
      date: new Date(),
      semester: formData.semester,
      participationScore: participation,
      weight: 80 // デフォルトのテスト重み
    };

    // 科目を探すまたは新規作成
    let updatedSubjects = [...subjects];
    let targetSubject = updatedSubjects.find(s => s.subjectName === formData.subjectName);

    if (!targetSubject) {
      // 新しい科目を作成
      const newSubject: SubjectGrades = {
        id: Date.now().toString(),
        subjectName: formData.subjectName,
        targetGrade: formData.targetGrade,
        currentTests: [],
        upcomingTests: [],
        assignments: [],
        participationScore: participation,
        studentId: getCurrentUser()?.userId || '',
        currentGrade: 0
      };
      updatedSubjects.push(newSubject);
      setCurrentSubjectId(newSubject.id);
      targetSubject = newSubject;
    } else {
      // 目標評定と平常点を更新
      targetSubject.targetGrade = formData.targetGrade;
      targetSubject.participationScore = participation;
    }

    // テストを追加
    targetSubject.currentTests.push(newTest);
    setSubjects(updatedSubjects);
    
    // 表示学期を入力学期に設定（主要教科と同じ動作）
    setViewSemester(formData.semester);

    // フォームをリセット（科目名は保持）
    setFormData(prev => ({
      ...prev,
      testName: '',
      score: '',
      semester: formData.semester // 学期は保持
    }));

    alert('テスト結果が保存されました！');
  };

  return (
    <div>
      <style dangerouslySetInnerHTML={{
        __html: `
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          #root {
            width: 100vw;
            overflow-x: hidden;
          }
        `
      }} />
      <div style={{
        width: '100vw',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        margin: '0',
        padding: '0',
        position: 'relative'
      }}>
        <div style={{ 
          maxWidth: '600px', 
          width: '100%',
          padding: '20px',
          boxSizing: 'border-box'
        }}>
        
        {/* ヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: '30px', color: 'white' }}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '700' }}>
            🎯 評定計算機
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, margin: 0 }}>
            技能教科用・85点で評定5
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
          
          {/* 科目名入力 */}
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
            <input
              type="text"
              placeholder="例：美術、音楽、技術家庭..."
              value={formData.subjectName}
              onChange={(e) => setFormData(prev => ({ ...prev, subjectName: e.target.value }))}
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

          {/* 学期選択 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '1.1rem', 
              fontWeight: '600', 
              marginBottom: '10px', 
              color: '#333' 
            }}>
              📅 学期
            </label>
            <select
              value={formData.semester}
              onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))}
              style={{
                width: '100%',
                padding: '15px',
                border: '2px solid #e1e5e9',
                borderRadius: '12px',
                fontSize: '16px',
                boxSizing: 'border-box',
                outline: 'none',
                backgroundColor: '#333',
                color: 'white'
              }}
            >
              <option value="">学期を選択してください</option>
              <option value="一学期">一学期</option>
              <option value="二学期">二学期</option>
              <option value="三学期">三学期</option>
            </select>
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
              <select
                value={formData.testName}
                onChange={(e) => {
                  console.log('テスト名選択:', e.target.value); // デバッグ用
                  setFormData(prev => ({ ...prev, testName: e.target.value }));
                }}
                style={{
                  width: '100%',
                  padding: '15px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '12px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  backgroundColor: '#333',
                  color: 'white'
                }}
              >
                <option value="">テストを選択してください</option>
                {formData.semester === '一学期' && (
                  <>
                    <option value="１学期中間考査">１学期中間考査</option>
                    <option value="１学期期末考査">１学期期末考査</option>
                  </>
                )}
                {formData.semester === '二学期' && (
                  <>
                    <option value="２学期中間考査">２学期中間考査</option>
                    <option value="２学期期末考査">２学期期末考査</option>
                  </>
                )}
                {formData.semester === '三学期' && (
                  <>
                    <option value="学年末考査">学年末考査</option>
                  </>
                )}
                {!formData.semester && (
                  <>
                    <option value="１学期中間考査">１学期中間考査</option>
                    <option value="１学期期末考査">１学期期末考査</option>
                    <option value="２学期中間考査">２学期中間考査</option>
                    <option value="２学期期末考査">２学期期末考査</option>
                    <option value="学年末考査">学年末考査</option>
                  </>
                )}
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
                🔢 得点
              </label>
              <input
                type="number"
                placeholder="85"
                value={formData.score}
                onChange={(e) => setFormData(prev => ({ ...prev, score: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, maxScore: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, targetGrade: parseInt(e.target.value) }))}
                style={{
                  width: '100%',
                  padding: '15px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '12px',
                  fontSize: '16px',
                  outline: 'none'
                }}
              >
                <option value={5}>5 (85点以上)</option>
                <option value={4}>4 (70-84点)</option>
                <option value={3}>3 (55-69点)</option>
                <option value={2}>2 (40-54点)</option>
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
                ✏️ 平常点
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={formData.participation}
                onChange={(e) => setFormData(prev => ({ ...prev, participation: e.target.value }))}
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
        {currentSubject && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            {/* 科目選択と学期選択 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '1.1rem', 
                  fontWeight: '600', 
                  marginBottom: '10px', 
                  color: '#333' 
                }}>
                  � 科目を選択
                </label>
                <select
                  value={currentSubjectId}
                  onChange={(e) => setCurrentSubjectId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '15px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '12px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                >
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.subjectName}
                    </option>
                  ))}
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
                  📅 評定を見る学期
                </label>
                <select
                  value={viewSemester}
                  onChange={(e) => setViewSemester(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '15px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '12px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                >
                  <option value="">学期を選択してください</option>
                  <option value="一学期">一学期</option>
                  <option value="二学期">二学期</option>
                  <option value="三学期">三学期</option>
                  <option value="全学期">全学期</option>
                </select>
              </div>
            </div>

            {/* 計算結果表示 */}
            {results ? (
              <>
                <h3 style={{ color: '#333', marginBottom: '20px', fontSize: '1.5rem', textAlign: 'center' }}>
                  🎨 {currentSubject.subjectName}の評定結果
                </h3>
                
                {/* 評定カード */}
                <div style={{ 
                  display: 'flex', 
                  gap: '15px', 
                  marginBottom: '25px',
                  flexWrap: 'wrap'
                }}>
                  {/* 現在の評定 */}
                  <div style={{
                    flex: '1',
                    minWidth: '120px',
                    backgroundColor: results.currentGrade >= formData.targetGrade ? '#e8f5e8' : '#fff3e0',
                    border: `3px solid ${results.currentGrade >= formData.targetGrade ? '#4caf50' : '#ff9800'}`,
                    borderRadius: '15px',
                    padding: '20px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '5px' }}>
                      {results.currentGrade}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#666' }}>
                      {viewSemester}評定
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>
                      平均: {results.currentAverage}点
                    </div>
                  </div>

                  {/* 目標評定 */}
                  <div style={{
                    flex: '1',
                    minWidth: '120px',
                    backgroundColor: '#e3f2fd',
                    border: '3px solid #2196f3',
                    borderRadius: '15px',
                    padding: '20px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '5px' }}>
                      {formData.targetGrade}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#666' }}>
                      目標評定
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>
                      必要: {results.targetAverage}点
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#888' }}>
                      {formData.targetGrade === 5 && '5 (85点以上)'}
                      {formData.targetGrade === 4 && '4 (70-84点)'}
                      {formData.targetGrade === 3 && '3 (55-69点)'}
                      {formData.targetGrade === 2 && '2 (40-54点)'}
                      {formData.targetGrade === 1 && '1 (39点以下)'}
                    </div>
                  </div>

                  {/* 達成状況 */}
                  <div style={{
                    flex: '1',
                    minWidth: '120px',
                    backgroundColor: results.isAchieved ? '#e8f5e8' : '#fce4ec',
                    border: `3px solid ${results.isAchieved ? '#4caf50' : '#e91e63'}`,
                    borderRadius: '15px',
                    padding: '20px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '5px' }}>
                      {results.isAchieved ? '🎉' : '�'}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#666' }}>
                      {results.isAchieved ? '達成済み！' : '頑張ろう！'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>
                      {results.isAchieved ? 'おめでとう！' : '次回頑張ろう'}
                    </div>
                  </div>
                </div>

                {/* 詳細メッセージ */}
                <div style={{
                  backgroundColor: results.isAchieved ? '#e8f5e8' : '#fff3e0',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '20px'
                }}>
                  <div style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 'bold', 
                    marginBottom: '8px',
                    color: results.isAchieved ? '#2e7d32' : '#f57c00'
                  }}>
                    {results.isAchieved ? `🎯 ${viewSemester}目標達成！` : `📈 ${viewSemester}で頑張ろう！`}
                  </div>
                  <div style={{ fontSize: '1.1rem', color: results.isAchieved ? '#2e7d32' : '#bf360c' }}>
                    {results.isAchieved 
                      ? `素晴らしい！${viewSemester}で評定${formData.targetGrade}を達成しています！`
                      : `${viewSemester}の次のテストで約${results.nextTestScore}点以上取れば目標達成です！`
                    }
                  </div>
                  {!results.isAchieved && (
                    <div style={{ 
                      fontSize: '0.95rem', 
                      color: '#666', 
                      marginTop: '8px',
                      fontStyle: 'italic'
                    }}>
                      💡 平常点を{currentSubject.participationScore}点と仮定した場合
                    </div>
                  )}
                  {!results.isAchieved && currentSubject && currentSubject.currentTests.length > 0 && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      backgroundColor: '#e8f5e8',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      color: '#2e7d32'
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>📈 おすすめの戦略:</div>
                      <div>
                        前回: テスト{Math.round(currentSubject.currentTests[currentSubject.currentTests.length - 1]?.score || 0)}点 + 平常点{currentSubject.participationScore}点
                      </div>
                      <div>
                        次回: テスト{results.nextTestScore}点 + 平常点{currentSubject.participationScore}点で目標達成！
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                backgroundColor: '#f8f9fa',
                borderRadius: '15px',
                border: '2px solid #e9ecef'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📋</div>
                <h3 style={{ color: '#333', marginBottom: '10px' }}>
                  {viewSemester ? `${viewSemester}のテストを追加してください` : '学期を選択してください'}
                </h3>
                <p style={{ color: '#666', fontSize: '1rem' }}>
                  {viewSemester 
                    ? `上記フォームから${viewSemester}のテストを追加してください`
                    : '評定を確認したい学期を選択してから、テスト結果を確認できます'
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* 初回メッセージ */}
        {!currentSubject && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎨</div>
            <h2 style={{ color: '#333', marginBottom: '15px', fontSize: '1.8rem' }}>
              技能教科の評定を計算しよう！
            </h2>
            <p style={{ color: '#666', fontSize: '1.2rem', lineHeight: '1.6' }}>
              美術・音楽・技術家庭・保健体育の<br />
              テスト結果を入力してください。<br />
              評定基準は85点で評定5です。
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default SubGradeCalculator;
