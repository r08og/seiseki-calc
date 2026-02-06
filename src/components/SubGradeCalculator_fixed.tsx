import React, { useState, useEffect, useMemo } from 'react';
import { SubjectGrades, TestScore } from '../types';
import { getSubGradingCriteria } from '../utils/subGradeCalculator';
import { getCurrentUser } from '../utils/userManager';

interface SubGradeCalculatorProps {
  subjects: SubjectGrades[];
  saveData: (subjects: SubjectGrades[]) => void;
}

export default function SubGradeCalculator({ subjects, saveData }: SubGradeCalculatorProps) {
  const [formData, setFormData] = useState({
    subjectName: '',
    semester: '',
    testName: '',
    score: '',
    maxScore: '100',
    targetGrade: 5,
    participation: '20'
  });

  const [currentSubjectId, setCurrentSubjectId] = useState<string | null>(null);
  const [viewSemester, setViewSemester] = useState<string>('');

  // 年間計算関数
  const calculateYearlyGrade = () => {
    if (!currentSubject) return null;
    
    // 各学期のテスト数をチェック
    const firstSemesterTests = currentSubject.currentTests.filter(test => test.semester === '一学期');
    const secondSemesterTests = currentSubject.currentTests.filter(test => test.semester === '二学期');
    
    if (firstSemesterTests.length < 1 || secondSemesterTests.length < 1) {
      return null;
    }

    const currentUser = getCurrentUser();
    const userCourseType = currentUser?.courseType || 'regular';
    
    // 各学期の評定を計算
    const firstGrade = getResults(currentSubject, '一学期', userCourseType);
    const secondGrade = getResults(currentSubject, '二学期', userCourseType);
    
    if (!firstGrade || !secondGrade) return null;
    
    // 1学期 + 2学期の合計スコアで3学期必要点を計算
    const firstScore = firstGrade.totalScore;
    const secondScore = secondGrade.totalScore;
    const currentTotal = firstScore + secondScore;
    
    // 目標評定に必要な年間合計点を計算
    const gradingCriteria = getSubGradingCriteria(userCourseType);
    const targetThreshold = gradingCriteria[currentSubject.targetGrade] || 85;
    const yearlyTarget = targetThreshold * 3; // 3学期分
    
    const thirdSemesterNeeded = yearlyTarget - currentTotal;
    
    return {
      firstSemesterGrade: firstGrade.currentGrade,
      secondSemesterGrade: secondGrade.currentGrade,
      firstSemesterScore: firstScore,
      secondSemesterScore: secondScore,
      currentTotal,
      thirdSemesterNeeded,
      targetThreshold,
      yearlyTarget,
      canAchieveTarget: thirdSemesterNeeded <= 100
    };
  };

  // 年間計算が可能かチェック
  const canCalculateYearlyGrade = () => {
    if (!currentSubject) return false;
    
    const firstSemesterTests = currentSubject.currentTests.filter(test => test.semester === '一学期');
    const secondSemesterTests = currentSubject.currentTests.filter(test => test.semester === '二学期');
    
    return firstSemesterTests.length >= 1 && secondSemesterTests.length >= 1;
  };

  // 結果計算関数
  const getResults = (subject: SubjectGrades | null, semester: string, courseType: string = 'regular') => {
    if (!subject) return null;
    
    const testsInSemester = subject.currentTests.filter(test => test.semester === semester);
    
    if (testsInSemester.length === 0) return null;
    
    // テストの平均点を計算
    const testScores = testsInSemester.map(test => (test.score / test.maxScore) * 100);
    const averageTestScore = testScores.reduce((sum, score) => sum + score, 0) / testScores.length;
    
    // 平常点を追加（最新のテストから取得）
    const participationScore = testsInSemester[testsInSemester.length - 1]?.participationScore || 0;
    
    // 合計点計算（テスト80% + 平常点20%）
    const totalScore = (averageTestScore * 0.8) + participationScore;
    
    // 評定計算
    const gradingCriteria = getSubGradingCriteria(courseType);
    let currentGrade = 1;
    
    for (let grade = 5; grade >= 1; grade--) {
      if (totalScore >= gradingCriteria[grade]) {
        currentGrade = grade;
        break;
      }
    }
    
    return {
      currentGrade,
      totalScore: Math.round(totalScore),
      averageTestScore: Math.round(averageTestScore),
      participationScore,
      testCount: testsInSemester.length,
      testScores
    };
  };

  // 現在の評定を計算（表示用）
  const currentResults = useMemo(() => {
    const currentSubject = subjects.find(s => s.id === currentSubjectId);
    
    if (!currentSubject) return null;
    
    if (!viewSemester || viewSemester === '') {
      return null;
    }
    
    const currentUser = getCurrentUser();
    const userCourseType = currentUser?.courseType || 'regular';
    
    const calculatedResults = getResults(currentSubject, viewSemester, userCourseType);
    
    return calculatedResults;
  }, [currentSubjectId, subjects, viewSemester]);

  // 学期ごとのテスト数制限をチェック
  const checkTestLimits = (subject: SubjectGrades | null | undefined, semester: string) => {
    const maxTests = semester === '三学期' ? 1 : 2;
    
    if (!subject) {
      return true;
    }

    const testsInSemester = subject.currentTests.filter(test => test.semester === semester);
    return testsInSemester.length < maxTests;
  };

  // テスト追加
  const addTest = () => {
    if (!formData.testName.trim() || !formData.score || !formData.subjectName.trim() || !formData.semester) {
      alert('すべての項目（学期を含む）を入力してください');
      return;
    }

    let targetSubject = subjects.find(s => s.subjectName === formData.subjectName.trim());

    // テスト数制限チェック
    if (!checkTestLimits(targetSubject, formData.semester)) {
      const maxTests = formData.semester === '三学期' ? 1 : 2;
      alert(`${formData.semester}は最大${maxTests}個のテストまでしか追加できません。`);
      return;
    }
    
    let newSubjects = [...subjects];
    const participationScore = parseInt(formData.participation) || 0;

    // 科目が存在しない場合は新規作成
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

    // テストを追加
    const newTest: TestScore = {
      id: Date.now().toString(),
      name: formData.testName.trim(),
      score: parseInt(formData.score),
      maxScore: parseInt(formData.maxScore),
      weight: 80,
      date: new Date(),
      participationScore: participationScore,
      semester: formData.semester
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
    
    // フォームリセット（科目名は残す）
    setFormData(prev => ({
      ...prev,
      testName: '',
      score: '',
      maxScore: '100'
    }));
  };

  // 現在の科目を取得
  const currentSubject = subjects.find(s => s.id === currentSubjectId);

  // 年間計算結果
  const yearlyResults = calculateYearlyGrade();

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
        background: 'linear-gradient(135deg, #8e24aa 0%, #ab47bc 100%)',
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
            🎨 技能教科評定計算機
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, margin: 0 }}>
            {(() => {
              const currentUser = getCurrentUser();
              const userCourseType = currentUser?.courseType || 'regular';
              return `技能教科用・${userCourseType === 'advanced' ? '進学コース（80点で評定5）' : '普通コース（85点で評定5）'}`;
            })()}
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
                        backgroundColor: subject.subjectName === formData.subjectName ? '#8e24aa' : '#e9ecef',
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
              placeholder="例：美術、音楽、技術家庭、保健体育..."
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
              onChange={(e) => {
                setFormData(prev => ({ ...prev, semester: e.target.value }));
              }}
              style={{
                width: '100%',
                padding: '15px',
                border: '2px solid #e1e5e9',
                borderRadius: '12px',
                fontSize: '16px',
                boxSizing: 'border-box',
                outline: 'none',
                backgroundColor: 'white',
                color: '#333'
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
              <input
                type="text"
                placeholder="例：実技テスト、作品制作"
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
                {(() => {
                  const currentUser = getCurrentUser();
                  const userCourseType = currentUser?.courseType || 'regular';
                  
                  return userCourseType === 'advanced' ? (
                    <>
                      <option value={5}>5 (80点以上)</option>
                      <option value={4}>4 (65-79点)</option>
                      <option value={3}>3 (50-64点)</option>
                      <option value={2}>2 (40-49点)</option>
                      <option value={1}>1 (39点以下)</option>
                    </>
                  ) : (
                    <>
                      <option value={5}>5 (85点以上)</option>
                      <option value={4}>4 (70-84点)</option>
                      <option value={3}>3 (55-69点)</option>
                      <option value={2}>2 (40-54点)</option>
                      <option value={1}>1 (39点以下)</option>
                    </>
                  );
                })()}
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
              backgroundColor: '#8e24aa',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 4px 12px rgba(142, 36, 170, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#7b1fa2';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(142, 36, 170, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#8e24aa';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(142, 36, 170, 0.3)';
            }}
          >
            ➕ テストを追加して計算
          </button>
        </div>

        {/* 年間評定計算ボタン */}
        {currentSubject && canCalculateYearlyGrade() && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            textAlign: 'center'
          }}>
            <button
              onClick={() => setViewSemester('yearly')}
              style={{
                width: '100%',
                padding: '18px',
                backgroundColor: '#ff6f00',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 12px rgba(255, 111, 0, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#e65100';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 111, 0, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#ff6f00';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 111, 0, 0.3)';
              }}
            >
              🎯 {currentSubject.subjectName}の年間評定を計算
            </button>
          </div>
        )}

        {/* 年間評定結果表示 */}
        {currentSubject && viewSemester === 'yearly' && yearlyResults && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ 
              margin: '0 0 25px 0', 
              color: '#333', 
              fontSize: '1.8rem', 
              textAlign: 'center' 
            }}>
              🎯 {currentSubject.subjectName} 年間評定計算
            </h2>
            
            {/* 年間達成状況 */}
            <div style={{
              backgroundColor: yearlyResults.canAchieveTarget ? '#e8f5e8' : '#ffeaa7',
              borderRadius: '15px',
              padding: '25px',
              marginBottom: '25px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>
                {yearlyResults.canAchieveTarget ? '🎉' : '💪'}
              </div>
              <h3 style={{ 
                color: yearlyResults.canAchieveTarget ? '#2d5a2d' : '#b8860b', 
                marginBottom: '10px',
                fontSize: '1.4rem'
              }}>
                {yearlyResults.canAchieveTarget ? '目標達成可能！' : '頑張れば達成可能！'}
              </h3>
              <p style={{ 
                color: yearlyResults.canAchieveTarget ? '#2d5a2d' : '#b8860b',
                fontSize: '1.1rem'
              }}>
                評定{currentSubject.targetGrade}
                {yearlyResults.canAchieveTarget 
                  ? 'は達成可能です' 
                  : 'の達成には更なる努力が必要です'
                }
              </p>
            </div>

            {/* 詳細計算 */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ 
                color: '#333', 
                marginBottom: '15px', 
                fontSize: '1.3rem',
                borderBottom: '2px solid #eee',
                paddingBottom: '10px'
              }}>
                📊 詳細計算結果
              </h4>
              
              <div style={{ display: 'grid', gap: '15px' }}>
                <div style={{ 
                  backgroundColor: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '10px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px'
                }}>
                  <div>
                    <strong>1学期:</strong> 評定{yearlyResults.firstSemesterGrade}
                  </div>
                  <div>
                    <strong>得点:</strong> {yearlyResults.firstSemesterScore}点
                  </div>
                </div>
                
                <div style={{ 
                  backgroundColor: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '10px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px'
                }}>
                  <div>
                    <strong>2学期:</strong> 評定{yearlyResults.secondSemesterGrade}
                  </div>
                  <div>
                    <strong>得点:</strong> {yearlyResults.secondSemesterScore}点
                  </div>
                </div>
                
                <div style={{ 
                  backgroundColor: '#e3f2fd',
                  padding: '15px',
                  borderRadius: '10px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px'
                }}>
                  <div>
                    <strong>現在合計:</strong> {yearlyResults.currentTotal}点
                  </div>
                  <div>
                    <strong>目標合計:</strong> {yearlyResults.yearlyTarget}点
                  </div>
                </div>
                
                <div style={{ 
                  backgroundColor: yearlyResults.canAchieveTarget ? '#e8f5e8' : '#fff3e0',
                  padding: '20px',
                  borderRadius: '10px',
                  textAlign: 'center',
                  border: `2px solid ${yearlyResults.canAchieveTarget ? '#4caf50' : '#ff9800'}`
                }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '5px' }}>
                    3学期必要得点
                  </div>
                  <div style={{ 
                    fontSize: '2rem', 
                    fontWeight: 'bold',
                    color: yearlyResults.canAchieveTarget ? '#2e7d32' : '#f57c00'
                  }}>
                    {Math.max(0, yearlyResults.thirdSemesterNeeded)}点
                  </div>
                  <div style={{ marginTop: '5px', fontSize: '0.9rem', opacity: 0.8 }}>
                    (100点満点中)
                  </div>
                </div>
              </div>
            </div>

            {/* アドバイス */}
            <div style={{
              backgroundColor: '#f0f4f8',
              padding: '20px',
              borderRadius: '10px',
              borderLeft: '4px solid #2196f3'
            }}>
              <h4 style={{ color: '#1976d2', marginBottom: '10px', fontSize: '1.1rem' }}>
                💡 アドバイス
              </h4>
              <p style={{ color: '#333', lineHeight: '1.6', margin: 0 }}>
                {yearlyResults.canAchieveTarget
                  ? `3学期で${Math.max(0, yearlyResults.thirdSemesterNeeded)}点以上取れれば、目標の評定${currentSubject.targetGrade}を達成できます！現在のペースを維持しましょう。`
                  : `目標達成には3学期で${Math.max(0, yearlyResults.thirdSemesterNeeded)}点が必要です。100点を超えているため、より高い目標を検討するか、実技や平常点でさらに頑張りましょう。`
                }
              </p>
            </div>

            {/* 戻るボタン */}
            <button
              onClick={() => setViewSemester('')}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '20px',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#5a6268';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#6c757d';
              }}
            >
              ← 戻る
            </button>
          </div>
        )}

        {/* 通常の結果表示 */}
        {currentSubject && viewSemester !== 'yearly' && (
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
            
            {/* 学期選択 */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                marginBottom: '10px', 
                color: '#333' 
              }}>
                📅 評定を表示する学期
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
              </select>
            </div>

            {currentResults ? (
              <div>
                {/* 現在の評定表示 */}
                <div style={{
                  backgroundColor: '#f0f4f8',
                  borderRadius: '15px',
                  padding: '25px',
                  marginBottom: '25px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '15px' }}>
                    {currentResults.currentGrade >= currentSubject.targetGrade ? '🎉' : '📚'}
                  </div>
                  <h3 style={{ color: '#333', marginBottom: '10px', fontSize: '1.6rem' }}>
                    現在の評定: {currentResults.currentGrade}
                  </h3>
                  <p style={{ color: '#666', fontSize: '1.1rem' }}>
                    {viewSemester}の結果 (テスト{currentResults.testCount}回分)
                  </p>
                </div>

                {/* 詳細 */}
                <div style={{ display: 'grid', gap: '15px' }}>
                  <div style={{ 
                    backgroundColor: '#f8f9fa',
                    padding: '15px',
                    borderRadius: '10px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px'
                  }}>
                    <div>
                      <strong>テスト平均:</strong> {currentResults.averageTestScore}点
                    </div>
                    <div>
                      <strong>平常点:</strong> {currentResults.participationScore}点
                    </div>
                  </div>
                  
                  <div style={{ 
                    backgroundColor: '#e3f2fd',
                    padding: '15px',
                    borderRadius: '10px',
                    textAlign: 'center'
                  }}>
                    <strong>合計得点: {currentResults.totalScore}点</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📋</div>
                <p style={{ color: '#666', fontSize: '1.1rem' }}>
                  学期を選択して評定を確認してください
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
              テスト結果を入力してください。
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
