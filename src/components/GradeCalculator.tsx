import React, { useState, useEffect } from 'react';
import type { SubjectGrades, TestScore } from '../types/grading';
import { 
  calculateWeightedAverage, 
  calculateGradeFromAverage, 
  getRequiredAverageForGrade,
  calculateRequiredScoreForNextTest,
  calculateRequiredScoreToKeepGrade,
  ADVANCED_COURSE_GRADING,
  REGULAR_COURSE_GRADING
} from '../utils/gradeCalculator';
import { getCurrentUser, getUserStorageKey } from '../utils/userManager';

const GradeCalculator: React.FC = () => {
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

  // ユーザー固有のローカルストレージキーを取得（主要教科用）
  const getStorageKey = () => {
    const currentUser = getCurrentUser();
    return currentUser ? getUserStorageKey(currentUser.userId, 'mainGradeSubjects') : 'mainGradeSubjects';
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
            semester: test.semester || '' // 既存データでsemesterが未定義の場合は空文字にする
          })),
          upcomingTests: subject.upcomingTests || [],
          assignments: subject.assignments || []
        }));
        
        // デバッグ：既存テストの学期情報をチェック
        let needsUpdate = false;
        const updatedSubjects = parsed.map((subject: SubjectGrades) => {
          const updatedTests = subject.currentTests.map((test: TestScore) => {
            if (!test.semester || test.semester === '') {
              needsUpdate = true;
              // 既存のテストに学期情報がない場合、テスト名から推定
              let estimatedSemester = '';
              if (test.name.includes('１学期') || test.name.includes('1学期')) {
                estimatedSemester = '一学期';
              } else if (test.name.includes('２学期') || test.name.includes('2学期')) {
                estimatedSemester = '二学期';
              } else if (test.name.includes('学年末') || test.name.includes('３学期') || test.name.includes('3学期')) {
                estimatedSemester = '三学期';
              } else {
                // 推定できない場合はデフォルトで一学期にする
                estimatedSemester = '一学期';
              }
              
              console.log(`テスト "${test.name}" に学期情報がないため、"${estimatedSemester}" を設定しました`);
              
              return { ...test, semester: estimatedSemester };
            }
            return test;
          });
          
          return { ...subject, currentTests: updatedTests };
        });
        
        if (needsUpdate) {
          console.log('学期情報を自動修正しました。データを保存します。');
          localStorage.setItem(getStorageKey(), JSON.stringify(updatedSubjects));
          setSubjects(updatedSubjects);
        } else {
          setSubjects(parsed);
        }
        
        console.log('=== データ読み込み完了 ===');
        console.log('読み込んだデータ:', updatedSubjects.map((s: SubjectGrades) => ({ 
          name: s.subjectName, 
          tests: s.currentTests.map((t: TestScore) => ({ name: t.name, semester: t.semester })) 
        })));
        console.log('========================');
        
        if (updatedSubjects.length > 0) {
          setCurrentSubjectId(updatedSubjects[0].id);
          setFormData(prev => ({ 
            ...prev, 
            subjectName: updatedSubjects[0].subjectName,
            targetGrade: updatedSubjects[0].targetGrade,
            participation: updatedSubjects[0].participationScore.toString()
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

  // 学期ごとのテスト数制限をチェック
  const checkTestLimits = (subject: SubjectGrades | null | undefined, semester: string) => {
    // 制限数を設定
    const maxTests = semester === '三学期' ? 1 : 2;
    
    if (!subject) {
      // 新しい科目の場合、1個目は追加可能
      return true;
    }

    const testsInSemester = subject.currentTests.filter(test => test.semester === semester);
    return testsInSemester.length < maxTests;
  };

  // テスト追加
  const addTest = () => {
    console.log('addTest called with:', formData); // デバッグ用
    
    if (!formData.testName.trim() || !formData.score || !formData.subjectName.trim() || !formData.semester) {
      alert('すべての項目（学期を含む）を入力してください');
      return;
    }

    let targetSubject = subjects.find(s => s.subjectName === formData.subjectName.trim());

    // デバッグ用ログ
    console.log('制限チェック:', {
      semester: formData.semester,
      targetSubject: targetSubject?.subjectName,
      currentTests: targetSubject?.currentTests.length || 0,
      testsInSemester: targetSubject?.currentTests.filter(test => test.semester === formData.semester).length || 0
    });

    // テスト数制限チェック
    if (!checkTestLimits(targetSubject, formData.semester)) {
      const maxTests = formData.semester === '三学期' ? 1 : 2;
      alert(`${formData.semester}は最大${maxTests}個のテストまでしか追加できません。`);
      return;
    }
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
      participationScore: participationScore, // テストごとの平常点を保存
      semester: formData.semester // 学期情報を追加
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
    
    // テスト追加成功のアラート表示
    alert('テスト結果が保存されました！');
    
    // 追加したテストの学期を自動選択
    setViewSemester(formData.semester);
    
    // フォームリセット（科目名は残す）
    setFormData(prev => ({
      ...prev,
      testName: '',
      score: '',
      maxScore: '100'
    }));
  };

  // 計算結果取得（選択された学期のテストのみを使用）
  const getResults = (subject: SubjectGrades, selectedSemester?: string, courseType: 'advanced' | 'regular' = 'advanced') => {
    try {
      let relevantTests: TestScore[] = [];
      
      if (selectedSemester && selectedSemester !== '') {
        // 特定の学期が選択されている場合、その学期のテストのみを使用
        relevantTests = subject.currentTests.filter(test => 
          test.semester === selectedSemester
        );
        
        console.log(`🎯 ${selectedSemester}のテストをフィルタリング:`);
        console.log('全テスト:', subject.currentTests.map(t => `${t.name}(${t.semester})`));
        console.log('フィルタ後:', relevantTests.map(t => `${t.name}(${t.semester})`));
        console.log(`${selectedSemester}のテスト数: ${relevantTests.length}`);
      } else {
        // 学期が選択されていない場合は全テストを使用
        relevantTests = subject.currentTests.filter(test => test.semester && test.semester !== '');
        console.log('全学期のテストを使用:', relevantTests.length, '個');
      }

      if (relevantTests.length === 0) {
        console.log(`⚠️ ${selectedSemester || '全学期'}にテストが見つかりません`);
        return {
          currentAverage: 0,
          currentGrade: 1,
          targetAverage: getRequiredAverageForGrade(subject.targetGrade, courseType === 'advanced' ? ADVANCED_COURSE_GRADING : REGULAR_COURSE_GRADING),
          pointsNeeded: 0,
          isAchieved: false,
          nextTestScore: 0,
          keepGradeScore: 0,
          testCount: 0
        };
      }

      // 重み付き平均を計算（テスト80% + 平常点20%）
      const avg = calculateWeightedAverage(relevantTests, [], subject.participationScore);
      const grade = calculateGradeFromAverage(avg, courseType === 'advanced' ? ADVANCED_COURSE_GRADING : REGULAR_COURSE_GRADING);
      const targetAvg = getRequiredAverageForGrade(subject.targetGrade, courseType === 'advanced' ? ADVANCED_COURSE_GRADING : REGULAR_COURSE_GRADING);
      const needed = Math.max(0, targetAvg - avg);
      
      console.log(`📊 ${selectedSemester || '全学期'}の計算結果 (${courseType === 'advanced' ? '進学' : '普通'}コース):`);
      console.log(`- 平均点: ${avg.toFixed(1)}点`);
      console.log(`- 評定: ${grade}`);
      console.log(`- 目標平均: ${targetAvg}点`);
      console.log(`- 不足点: ${needed.toFixed(1)}点`);
      
      // 次のテストで必要な点数を計算
      const nextTestScore = calculateRequiredScoreForNextTest(
        relevantTests,
        subject.participationScore,
        subject.targetGrade,
        100,
        subject.participationScore,
        courseType === 'advanced' ? ADVANCED_COURSE_GRADING : REGULAR_COURSE_GRADING
      );
      
      const keepGradeScore = calculateRequiredScoreToKeepGrade(
        relevantTests,
        subject.participationScore,
        grade,
        subject.participationScore,
        courseType === 'advanced' ? ADVANCED_COURSE_GRADING : REGULAR_COURSE_GRADING
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
  
  // 結果を計算 - 評定表示用の学期選択を使用
  const results = React.useMemo(() => {
    if (!currentSubject) return null;
    
    // 評定表示用の学期が選択されていない場合は計算しない
    if (!viewSemester || viewSemester === '') {
      return null;
    }
    
    // ユーザーのコース情報を取得
    const currentUser = getCurrentUser();
    const userCourseType = currentUser?.courseType || 'advanced';
    
    const selectedSemester = viewSemester;
    console.log(`\n🎯 評定表示用計算実行:`);
    console.log(`- 科目: ${currentSubject.subjectName}`);
    console.log(`- 選択学期: ${selectedSemester}`);
    console.log(`- コース: ${userCourseType === 'advanced' ? '進学' : '普通'}`);
    
    const calculatedResults = getResults(currentSubject, selectedSemester, userCourseType);
    console.log(`- 計算結果: 評定${calculatedResults?.currentGrade} (テスト数: ${calculatedResults?.testCount})`);
    
    return calculatedResults;
  }, [currentSubject, viewSemester]);

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
            {(() => {
              const currentUser = getCurrentUser();
              const userCourseType = currentUser?.courseType || 'advanced';
              return `主要教科用・${userCourseType === 'advanced' ? '進学・特進コース（80点で評定5）' : '普通コース（85点で評定5）'}`;
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
                console.log('=== 学期選択変更 ===');
                console.log('変更前:', formData.semester);
                console.log('変更後:', e.target.value);
                console.log('==================');
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
                {(() => {
                  const currentUser = getCurrentUser();
                  const userCourseType = currentUser?.courseType || 'advanced';
                  
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
        {currentSubject && (
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
            
            {/* 評定表示用の学期選択 */}
            <div style={{ marginBottom: '25px' }}>
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
              </select>
            </div>
            

            {/* 年間評定計算ボタン */}

            {/* 年間評定計算結果表示 */}
            {showYearlyResults && yearlyResults && yearlyResults.hasTests && (
              <div style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '15px',
                padding: '25px',
                marginBottom: '25px',
                border: '3px solid #007bff'
              }}>
                <h3 style={{
                  textAlign: 'center',
                  marginBottom: '20px',
                  color: '#007bff',
                  fontSize: '1.3rem'
                }}>
                  📊 年間評定計算（{yearlyResults.courseType === 'advanced' ? '進学コース' : '普通コース'}）
                </h3>
                <div style={{
                  textAlign: 'center',
                  padding: '25px',
                  backgroundColor: yearlyResults.isYearlyTargetAchieved ? '#e8f5e8' : '#fff3e0',
                  borderRadius: '15px',
                  border: `3px solid ${yearlyResults.isYearlyTargetAchieved ? '#4CAF50' : '#FF9800'}`,
                  marginBottom: '20px'
                }}>
                  <div style={{ 
                    fontSize: '3.5rem', 
                    fontWeight: 'bold', 
                    color: yearlyResults.isYearlyTargetAchieved ? '#4CAF50' : '#FF9800',
                    marginBottom: '10px' 
                  }}>
                    {yearlyResults.yearlyGrade}
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
                    現在の年間評定
                  </div>
                  <div style={{ fontSize: '1rem', color: '#888' }}>
                    全テスト平均: {yearlyResults.yearlyAverage}点
                  </div>
                </div>
              </div>
            )}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <button
                onClick={() => setShowYearlyResults(!showYearlyResults)}
                style={{
                  padding: '15px 30px',
                  backgroundColor: showYearlyResults ? '#6c757d' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0,123,255,0.3)'
                }}
              >
                📊 {showYearlyResults ? '年間評定を閉じる' : '年間評定を計算'}
              </button>
            </div>
            {/* 学期が選択されているかどうかをチェック */}
            {!viewSemester || viewSemester === '' ? (
              // 学期が選択されていない場合の案内
              <div style={{
                textAlign: 'center',
                padding: '40px',
                backgroundColor: '#fff9e6',
                borderRadius: '15px',
                border: '3px solid #ffa726',
                marginBottom: '25px'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📅</div>
                <h3 style={{ color: '#f57c00', marginBottom: '15px', fontSize: '1.5rem' }}>
                  評定を見たい学期を選択してください
                </h3>
                <p style={{ color: '#e65100', fontSize: '1.1rem', lineHeight: '1.6' }}>
                  上記で学期を選択すると、<br />
                  その学期の評定を計算して表示します
                </p>
                <div style={{ 
                  marginTop: '20px', 
                  padding: '15px', 
                  backgroundColor: '#fff3e0', 
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  color: '#bf360c'
                }}>
                  💡 ヒント: 学期ごとに別々の評定が計算されます
                </div>
              </div>
            ) : (
              // 学期が選択されている場合の評定表示
              // 特定の学期が選択されている場合、その学期の評定のみ表示
              (() => {
                // ユーザーのコース情報を取得
                const currentUser = getCurrentUser();
                const userCourseType = currentUser?.courseType || 'advanced';
                
                // 学期を明示的に指定して再計算
                const semesterResults = getResults(currentSubject, viewSemester, userCourseType);
                
                // デバッグ: 学期選択時の計算確認
                console.log(`\n🎯 ${viewSemester}表示用計算:`);
                console.log(`選択学期: ${viewSemester}`);
                console.log(`コース: ${userCourseType === 'advanced' ? '進学' : '普通'}`);
                console.log(`直接計算結果: 評定${semesterResults?.currentGrade} (テスト数: ${semesterResults?.testCount})`);
                console.log(`useMemo結果: 評定${results?.currentGrade} (テスト数: ${results?.testCount})`);
                
                // どちらの結果を使うかを決定（直接計算を優先）
                const finalResults = semesterResults;
                
                return finalResults ? (
                  <>
                    <div style={{ 
                      textAlign: 'center', 
                      marginBottom: '20px',
                      padding: '10px',
                      backgroundColor: '#f0f8ff',
                      borderRadius: '10px',
                      border: '2px solid #2196F3'
                    }}>
                      <h3 style={{ color: '#2196F3', margin: '0', fontSize: '1.3rem' }}>
                        📅 {viewSemester}の評定
                      </h3>
                    </div>
                    
                    {finalResults.testCount === 0 ? (
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
                          {viewSemester}のテストがありません
                        </h3>
                        <p style={{ color: '#888', fontSize: '1rem' }}>
                          {viewSemester}のテスト結果を追加してください
                        </p>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginBottom: '25px' }}>
                          {/* 現在の評定 */}
                          <div style={{
                            textAlign: 'center',
                            padding: '25px',
                            backgroundColor: finalResults.currentGrade >= currentSubject?.targetGrade ? '#e8f5e8' : '#fff3e0',
                            borderRadius: '15px',
                            border: `3px solid ${finalResults.currentGrade >= currentSubject?.targetGrade ? '#4CAF50' : '#FF9800'}`
                          }}>
                            <div style={{ 
                              fontSize: '3rem', 
                              fontWeight: 'bold', 
                              color: finalResults.currentGrade >= currentSubject?.targetGrade ? '#4CAF50' : '#FF9800',
                              marginBottom: '10px'
                            }}>
                              {finalResults.currentGrade}
                            </div>
                            <div style={{ fontSize: '1.1rem', color: '#666', marginBottom: '5px' }}>{viewSemester}評定</div>
                            <div style={{ fontSize: '0.9rem', color: '#888' }}>平均: {finalResults.currentAverage}点</div>
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
                              {currentSubject?.targetGrade}
                            </div>
                            <div style={{ fontSize: '1.1rem', color: '#666', marginBottom: '5px' }}>目標評定</div>
                            <div style={{ fontSize: '0.9rem', color: '#888' }}>必要: {finalResults.targetAverage}点</div>
                          </div>
                          
                          {/* 達成状況 */}
                          <div style={{
                            textAlign: 'center',
                            padding: '25px',
                            backgroundColor: finalResults.isAchieved ? '#e8f5e8' : '#fce4ec',
                            borderRadius: '15px',
                            border: `3px solid ${finalResults.isAchieved ? '#4CAF50' : '#E91E63'}`
                          }}>
                            <div style={{ 
                              fontSize: '3rem', 
                              marginBottom: '5px'
                            }}>
                              {finalResults.isAchieved ? '🎉' : '💪'}
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#666', marginBottom: '5px' }}>
                              {finalResults.isAchieved ? '達成済み！' : '頑張ろう！'}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#888' }}>
                              {finalResults.isAchieved ? 'おめでとう！' : '次回頑張ろう'}
                            </div>
                          </div>
                        </div>

                        {/* 詳細メッセージ */}
                        <div style={{
                          backgroundColor: finalResults.isAchieved ? '#e8f5e8' : '#fff3e0',
                          borderRadius: '12px',
                          padding: '20px',
                          marginBottom: '20px'
                        }}>
                          <div style={{ 
                            fontSize: '1.2rem', 
                            fontWeight: 'bold', 
                            marginBottom: '8px',
                            color: finalResults.isAchieved ? '#2e7d32' : '#f57c00'
                          }}>
                            {finalResults.isAchieved ? `🎯 ${viewSemester}目標達成！` : `📈 ${viewSemester}で頑張ろう！`}
                          </div>
                          <div style={{ fontSize: '1.1rem', color: finalResults.isAchieved ? '#2e7d32' : '#bf360c' }}>
                            {finalResults.isAchieved 
                              ? `素晴らしい！${viewSemester}で評定${currentSubject?.targetGrade}を達成しています！`
                              : `${viewSemester}の次のテストで約${finalResults.nextTestScore}点以上取れば目標達成です！`
                            }
                          </div>
                          {!finalResults.isAchieved && (
                            <div style={{ 
                              fontSize: '0.95rem', 
                              color: '#666', 
                              marginTop: '8px',
                              fontStyle: 'italic'
                            }}>
                              💡 平常点を{currentSubject.participationScore}点と仮定した場合
                            </div>
                          )}
                          {!finalResults.isAchieved && currentSubject && currentSubject.currentTests.length > 0 && (
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
                                次回: テスト{finalResults.nextTestScore}点 + 平常点{currentSubject.participationScore}点で目標達成！
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
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
                    <h3 style={{ color: '#666', marginBottom: '10px', fontSize: '1.3rem' }}>
                      {viewSemester}のテストを追加してください
                    </h3>
                    <p style={{ color: '#888', fontSize: '1rem' }}>
                      上記フォームから{viewSemester}のテスト結果を追加してください
                    </p>
                  </div>
                );
              })()
            )}

            {/* テスト履歴 */}
            {currentSubject && (
              <div style={{ marginTop: '25px' }}>
                <h3 style={{ color: '#333', marginBottom: '15px' }}>📝 テスト履歴</h3>
                {currentSubject.currentTests.length === 0 ? (
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    borderRadius: '12px',
                    padding: '30px',
                    textAlign: 'center',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📋</div>
                    <p style={{ color: '#666', fontSize: '1.1rem' }}>
                      まだテストが登録されていません
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {viewSemester ? (
                      // 特定の学期が選択されている場合、その学期のテストのみを表示
                      (() => {
                        const semesterTests = currentSubject.currentTests.filter(test => test.semester === viewSemester);
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
                                {viewSemester}のテストがありません
                              </h4>
                              <p style={{ color: '#888', fontSize: '0.9rem' }}>
                                上記フォームから{viewSemester}のテストを追加してください
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
                              📚 {viewSemester}
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
                      })()
                    ) : (
                      // 学期が選択されていない場合、全学期のテストを学期別に表示
                      ['一学期', '二学期', '三学期'].map(semester => {
                        const semesterTests = currentSubject.currentTests.filter(test => test.semester === semester);
                        if (semesterTests.length === 0) return null;
                        
                        return (
                          <div key={semester} style={{
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
                      })
                    )}
                  </div>
                )}
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
    </div>
  );
};

export default GradeCalculator;