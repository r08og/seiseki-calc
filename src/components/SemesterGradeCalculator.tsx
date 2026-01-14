import React, { useState, useEffect } from 'react';
import type { SubjectGrades, TestScore } from '../types/grading';
import { 
  calculateWeightedAverage, 
  calculateGradeFromAverage, 
  getRequiredAverageForGrade,
  calculateRequiredScoreForNextTest,
  calculateRequiredScoreToKeepGrade
} from '../utils/subGradeCalculator';
import { getCurrentUser, getUserStorageKey } from '../utils/userManager';

interface SemesterGradeCalculatorProps {
  semester: '一学期' | '二学期' | '三学期';
}

const SemesterGradeCalculator: React.FC<SemesterGradeCalculatorProps> = ({ semester }) => {
  const [subjects, setSubjects] = useState<SubjectGrades[]>([]);
  const [currentSubjectId, setCurrentSubjectId] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  // シンプルな入力フォーム（学期は固定）
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
            date: new Date(test.date),
            semester: test.semester || ''
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
  };

  // 学期ごとのテスト数制限をチェック
  const checkTestLimits = (subject: SubjectGrades | null | undefined) => {
    const maxTests = semester === '三学期' ? 1 : 2;
    
    if (!subject) {
      return true;
    }

    const testsInSemester = subject.currentTests.filter(test => test.semester === semester);
    return testsInSemester.length < maxTests;
  };

  // テスト追加
  const addTest = () => {
    if (!formData.testName.trim() || !formData.score || !formData.subjectName.trim()) {
      alert('すべての項目を入力してください');
      return;
    }

    let targetSubject = subjects.find(s => s.subjectName === formData.subjectName.trim());

    if (!checkTestLimits(targetSubject)) {
      const maxTests = semester === '三学期' ? 1 : 2;
      alert(`${semester}は最大${maxTests}個のテストまでしか追加できません。`);
      return;
    }

    let newSubjects = [...subjects];
    const participationScore = parseInt(formData.participation) || 0;

    if (!targetSubject) {
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

    const newTest: TestScore = {
      id: Date.now().toString(),
      name: formData.testName.trim(),
      score: parseInt(formData.score),
      maxScore: parseInt(formData.maxScore),
      weight: 80,
      date: new Date(),
      participationScore: participationScore,
      semester: semester // 学期は固定
    };

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

    saveData(newSubjects);
    
    setFormData(prev => ({
      ...prev,
      testName: '',
      score: '',
      maxScore: '100'
    }));
  };

  // 計算結果取得（この学期のテストのみを使用）
  const getResults = (subject: SubjectGrades) => {
    try {
      const relevantTests = subject.currentTests.filter(test => test.semester === semester);

      if (relevantTests.length === 0) {
        return {
          currentAverage: 0,
          currentGrade: 1,
          targetAverage: getRequiredAverageForGrade(subject.targetGrade, 'regular'),
          pointsNeeded: 0,
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
      
      const nextTestScore = calculateRequiredScoreForNextTest(
        relevantTests,
        subject.participationScore,
        subject.targetGrade,
        100,
        subject.participationScore,
        'regular'
      );
      
      const keepGradeScore = calculateRequiredScoreToKeepGrade(
        relevantTests,
        subject.participationScore,
        grade,
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
        keepGradeScore: Math.round(keepGradeScore * 10) / 10,
        testCount: relevantTests.length
      };
    } catch (error) {
      console.error('計算エラー:', error);
      return null;
    }
  };

  const currentSubject = subjects.find(s => s.id === currentSubjectId);
  const results = currentSubject ? getResults(currentSubject) : null;

  // デバッグ情報を更新
  React.useEffect(() => {
    if (currentSubject) {
      const semesterTests = currentSubject.currentTests.filter(t => t.semester === semester);
      
      const debugText = `
🔍 ${semester}専用分析:
📚 科目: ${currentSubject.subjectName}
📅 学期: ${semester}

📝 ${semester}のテスト数: ${semesterTests.length}個

📊 ${semester}のテスト詳細:
${semesterTests.map((t, i) => `  ${i+1}. ${t.name} (${t.score}点)`).join('\n') || '  まだテストがありません'}

🎯 ${semester}の計算結果:
  評定: ${results?.currentGrade || 'なし'}
  平均: ${results?.currentAverage || 0}点
  テスト数: ${results?.testCount || 0}個
      `;
      setDebugInfo(debugText);
    }
  }, [currentSubject, results, semester]);

  // 学期に応じたテスト名の選択肢
  const getTestOptions = () => {
    if (semester === '一学期') {
      return [
        { value: '１学期中間考査', label: '１学期中間考査' },
        { value: '１学期期末考査', label: '１学期期末考査' }
      ];
    } else if (semester === '二学期') {
      return [
        { value: '２学期中間考査', label: '２学期中間考査' },
        { value: '２学期期末考査', label: '２学期期末考査' }
      ];
    } else {
      return [
        { value: '学年末考査', label: '学年末考査' }
      ];
    }
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
            🎯 {semester} 評定計算
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, margin: 0 }}>
            {semester}専用の評定計算機
          </p>
        </div>

        {/* 🚨 デバッグ情報表示 */}
        <div style={{
          backgroundColor: '#ff0000',
          color: 'white',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '20px',
          fontFamily: 'monospace',
          fontSize: '14px',
          whiteSpace: 'pre-wrap',
          border: '5px solid #ffffff',
          boxShadow: '0 0 20px rgba(255,0,0,0.5)'
        }}>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            marginBottom: '15px',
            color: '#ffffff',
            textAlign: 'center'
          }}>
            📊 {semester}デバッグ情報 📊
          </div>
          {debugInfo || `
${semester}のデータを読み込み中...
現在のデータ: ${subjects.length}個の科目
          `}
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

          {/* 学期表示（固定） */}
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
            <div style={{
              width: '100%',
              padding: '15px',
              backgroundColor: '#333',
              color: 'white',
              borderRadius: '12px',
              fontSize: '16px',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              {semester} (固定)
            </div>
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
                {getTestOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
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
                🔢 得点
              </label>
              <input
                type="number"
                placeholder="85"
                value={formData.score}
                onChange={(e) => {
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
                onChange={(e) => {
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
            ➕ {semester}のテストを追加して計算
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
            <h2 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '1.8rem', textAlign: 'center' }}>
              📊 {currentSubject?.subjectName} の {semester} 状況
            </h2>
            
            {results ? (
              results.testCount === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '15px',
                  border: '2px solid #e9ecef',
                  marginBottom: '25px'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📋</div>
                  <h3 style={{ color: '#666', marginBottom: '10px', fontSize: '1.3rem' }}>
                    {semester}のテストがありません
                  </h3>
                  <p style={{ color: '#888', fontSize: '1rem' }}>
                    {semester}のテスト結果を追加してください
                  </p>
                </div>
              ) : (
                <>
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
                      <div style={{ fontSize: '1.1rem', color: '#666', marginBottom: '5px' }}>{semester}評定</div>
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
                        {results.isAchieved ? 'おめでとう' : (
                          <div>
                            <div>あと{results.pointsNeeded}点</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                              (平常点{formData.participation}点で計算)
                            </div>
                          </div>
                        )}
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
                      {results.isAchieved ? `🎯 ${semester}目標達成！` : `📈 ${semester}で頑張ろう！`}
                    </div>
                    <div style={{ fontSize: '1.1rem', color: results.isAchieved ? '#2e7d32' : '#bf360c' }}>
                      {results.isAchieved 
                        ? `素晴らしい！${semester}で評定${formData.targetGrade}を達成しています！`
                        : `${semester}の次のテストで約${results.nextTestScore}点以上取れば目標達成です！`
                      }
                    </div>
                  </div>
                </>
              )
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                backgroundColor: '#f8f9fa',
                borderRadius: '15px',
                border: '2px solid #e9ecef'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📋</div>
                <h3 style={{ color: '#666', marginBottom: '10px', fontSize: '1.3rem' }}>
                  {semester}のテストを追加してください
                </h3>
                <p style={{ color: '#888', fontSize: '1rem' }}>
                  上記フォームから{semester}のテスト結果を追加してください
                </p>
              </div>
            )}

            {/* テスト履歴 */}
            {currentSubject && (
              <div style={{ marginTop: '25px' }}>
                <h3 style={{ color: '#333', marginBottom: '15px' }}>📝 {semester}のテスト履歴</h3>
                {(() => {
                  const semesterTests = currentSubject.currentTests.filter(test => test.semester === semester);
                  if (semesterTests.length === 0) {
                    return (
                      <div style={{
                        backgroundColor: '#f8f9fa',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid #e9ecef',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📋</div>
                        <h4 style={{ color: '#666', marginBottom: '10px' }}>
                          {semester}のテストがありません
                        </h4>
                        <p style={{ color: '#888', fontSize: '0.9rem' }}>
                          上記フォームから{semester}のテストを追加してください
                        </p>
                      </div>
                    );
                  }
                  
                  return (
                    <div style={{
                      backgroundColor: '#f8f9fa',
                      borderRadius: '12px',
                      padding: '20px',
                      border: '1px solid #e9ecef'
                    }}>
                      <h4 style={{ 
                        color: '#495057', 
                        marginBottom: '15px',
                        fontSize: '16px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        📚 {semester}
                        <span style={{ 
                          fontSize: '12px', 
                          color: '#6c757d',
                          fontWeight: '400'
                        }}>
                          ({semesterTests.length}件)
                        </span>
                      </h4>
                      <div style={{ display: 'grid', gap: '10px' }}>
                        {semesterTests.map(test => (
                          <div key={test.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '15px',
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            border: '1px solid #dee2e6'
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
                  );
                })()}
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
              {semester}を始めましょう！
            </h2>
            <p style={{ color: '#666', fontSize: '1.2rem', lineHeight: '1.6' }}>
              {semester}の科目名とテスト結果を入力するだけで、<br />
              目標評定に必要な点数が分かります。
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default SemesterGradeCalculator;
