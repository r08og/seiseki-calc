import React, { useState, useEffect } from 'react';
import type { SubjectGrades, TestScore } from '../types/grading';
import { 
  calculateWeightedAverage, 
  calculateGradeFromAverage, 
  getRequiredAverageForGrade,
  calculateRequiredScoreForNextTest,
  calculateRequiredScoreToKeepGrade,
  getGradingCriteria
} from '../utils/gradeCalculator';
import { getCurrentUser, getUserStorageKey } from '../utils/userManager';

const GradeCalculator: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectGrades[]>([]);
  
  // 現在のユーザーのコースタイプを取得
  const currentUser = getCurrentUser();
  const userCourseType = currentUser?.courseType || 'regular';
  
  // 緊急修正：進学コースユーザーの評定基準を強制適用
  const finalUserCourseType = (currentUser?.userName === 's' || currentUser?.userName === 'sさん') 
    ? 'advanced' 
    : userCourseType;

  const [formData, setFormData] = useState({
    subjectName: '',
    semester: '',
    testName: '',
    score: '',
    targetGrade: 4,
    participation: '16'
  });

  // ユーザー固有のローカルストレージキーを取得
  const getStorageKey = () => {
    const currentUser = getCurrentUser();
    return currentUser ? getUserStorageKey(currentUser.userId, 'gradeSubjects') : 'gradeSubjects';
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
  const checkTestLimits = (subjectName: string, semester: string) => {
    const maxTests = semester === '三学期' ? 1 : 2;
    const subject = subjects.find(s => s.subjectName === subjectName.trim());
    
    if (!subject) {
      return true;
    }

    const testsInSemester = subject.currentTests.filter((test: TestScore) => test.semester === semester);
    return testsInSemester.length < maxTests;
  };

  // テスト追加
  const addTest = () => {
    if (!formData.testName.trim() || !formData.score || !formData.subjectName.trim() || !formData.semester) {
      alert('すべての項目（学期を含む）を入力してください');
      return;
    }

    if (!checkTestLimits(formData.subjectName, formData.semester)) {
      const maxTests = formData.semester === '三学期' ? 1 : 2;
      alert(`${formData.semester}は最大${maxTests}個のテストまでしか追加できません。`);
      return;
    }

    let targetSubject = subjects.find(s => s.subjectName === formData.subjectName.trim());
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
      maxScore: 100,
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
    setFormData(prev => ({
      ...prev,
      testName: '',
      score: ''
    }));
  };

  // 計算結果取得
  const getResults = (subject: SubjectGrades) => {
    try {
      const criteria = getGradingCriteria(finalUserCourseType);
      const participationScore = parseInt(formData.participation) || subject.participationScore;
      
      if (subject.currentTests.length === 0) {
        return {
          currentAverage: 0,
          currentGrade: 1,
          required: [0, 0, 0, 0, 0],
          keepGrade5: null
        };
      }

      const weightedAvg = calculateWeightedAverage(subject.currentTests, [], participationScore);
      const currentGrade = calculateGradeFromAverage(weightedAvg, criteria);

      const required = [1, 2, 3, 4, 5].map(grade => {
        const requiredAvg = getRequiredAverageForGrade(grade, criteria);
        return calculateRequiredScoreForNextTest(subject.currentTests, requiredAvg, participationScore);
      });

      let keepGrade5 = null;
      if (currentGrade >= 5) {
        const grade5Avg = getRequiredAverageForGrade(5, criteria);
        keepGrade5 = calculateRequiredScoreToKeepGrade(subject.currentTests, grade5Avg, participationScore);
      }

      return {
        currentAverage: Math.round(weightedAvg * 10) / 10,
        currentGrade,
        required,
        keepGrade5
      };
    } catch (error) {
      console.error('計算エラー:', error);
      return {
        currentAverage: 0,
        currentGrade: 1,
        required: [0, 0, 0, 0, 0],
        keepGrade5: null
      };
    }
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: "'Noto Sans JP', sans-serif"
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '30px 25px',
        borderRadius: '20px',
        textAlign: 'center',
        marginBottom: '30px',
        boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)'
      }}>
        <h1 style={{ 
          margin: '0 0 10px 0', 
          fontSize: '2rem', 
          fontWeight: '700' 
        }}>
          📚 主要教科 評定計算
        </h1>
        <p style={{ 
          margin: 0, 
          fontSize: '1.1rem', 
          opacity: 0.9 
        }}>
          目標評定を達成するために必要な点数を計算します
        </p>
      </div>

      {/* 入力フォーム */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '15px',
        padding: '25px',
        marginBottom: '25px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
        border: '1px solid #e1e5e9'
      }}>
        <h2 style={{ 
          margin: '0 0 20px 0', 
          color: '#333', 
          fontSize: '1.3rem',
          fontWeight: '600' 
        }}>
          📝 テスト結果を入力
        </h2>

        {/* 科目名入力 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            marginBottom: '10px', 
            color: '#333' 
          }}>
            📖 科目名
          </label>
          <input
            type="text"
            placeholder="例：数学、英語、理科..."
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

        {/* テスト名入力 */}
        <div style={{ marginBottom: '20px' }}>
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
            placeholder="例：中間テスト"
            value={formData.testName}
            onChange={(e) => setFormData(prev => ({ ...prev, testName: e.target.value }))}
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

        {/* 得点入力 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            marginBottom: '10px', 
            color: '#333' 
          }}>
            📊 得点
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

        {/* 目標評定と平常点 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
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
                boxSizing: 'border-box',
                outline: 'none',
                backgroundColor: 'white',
                color: '#333'
              }}
            >
              {finalUserCourseType === 'advanced' ? (
                // 進学コース基準
                <>
                  <option value={5}>5 (80点以上)</option>
                  <option value={4}>4 (65-79点)</option>  
                  <option value={3}>3 (50-64点)</option>
                  <option value={2}>2 (40-49点)</option>
                  <option value={1}>1 (39点以下)</option>
                </>
              ) : (
                // 普通コース基準
                <>
                  <option value={5}>5 (85点以上)</option>
                  <option value={4}>4 (70-84点)</option>
                  <option value={3}>3 (55-69点)</option>
                  <option value={2}>2 (40-54点)</option>
                  <option value={1}>1 (39点以下)</option>
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
              ✨ 平常点
            </label>
            <input
              type="number"
              min="0"
              max="20"
              placeholder="16"
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

        <button
          onClick={addTest}
          style={{
            width: '100%',
            padding: '15px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
          }}
        >
          ➕ テスト結果を追加
        </button>
      </div>

      {/* 結果表示 */}
      {subjects.map((subject) => {
        if (subject.currentTests.length === 0) return null;
        
        const results = getResults(subject);
        const targetResult = results.required[subject.targetGrade - 1];

        return (
          <div
            key={subject.id}
            style={{
              backgroundColor: 'white',
              borderRadius: '15px',
              padding: '25px',
              marginBottom: '25px',
              boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
              border: '1px solid #e1e5e9'
            }}
          >
            <h3 style={{ 
              margin: '0 0 20px 0', 
              color: '#333',
              fontSize: '1.4rem',
              fontWeight: '700' 
            }}>
              📖 {subject.subjectName}の状況
            </h3>

            {/* 現在の状況 */}
            <div style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h4 style={{ 
                margin: '0 0 15px 0', 
                color: '#333',
                fontSize: '1.2rem' 
              }}>
                📊 現在の状況
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#667eea' }}>
                    {results.currentAverage}
                  </div>
                  <div style={{ color: '#666' }}>平均点</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: results.currentGrade >= subject.targetGrade ? '#28a745' : '#dc3545' }}>
                    {results.currentGrade}
                  </div>
                  <div style={{ color: '#666' }}>現在の評定</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#333' }}>
                    {subject.targetGrade}
                  </div>
                  <div style={{ color: '#666' }}>目標評定</div>
                </div>
              </div>
            </div>

            {/* 目標達成のための必要点数 */}
            <div style={{
              backgroundColor: results.currentGrade >= subject.targetGrade ? '#d4edda' : '#fff3cd',
              borderRadius: '12px',
              padding: '20px',
              border: `2px solid ${results.currentGrade >= subject.targetGrade ? '#c3e6cb' : '#ffeeba'}`
            }}>
              <h4 style={{ 
                margin: '0 0 10px 0', 
                color: '#333',
                fontSize: '1.2rem' 
              }}>
                🎯 評定{subject.targetGrade}を{results.currentGrade >= subject.targetGrade ? 'キープ' : '達成'}するには
              </h4>
              
              {results.currentGrade >= subject.targetGrade ? (
                <div style={{ color: '#155724', fontWeight: '600', fontSize: '1.1rem' }}>
                  🎉 目標評定を達成済みです！
                </div>
              ) : (
                <div style={{ color: '#856404', fontWeight: '600', fontSize: '1.1rem' }}>
                  {Math.ceil(targetResult) > 100 ? (
                    <span style={{ fontWeight: '700', color: '#dc3545' }}>何点取っても達成できません</span>
                  ) : (
                    <>
                      次のテストで <span style={{ fontWeight: '700', color: '#dc3545' }}>{Math.max(0, Math.ceil(targetResult))}点以上</span> 取る必要があります
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {subjects.length === 0 && (
        <div style={{
          backgroundColor: '#f8f9fa',
          borderRadius: '15px',
          padding: '40px',
          textAlign: 'center',
          color: '#666'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📝</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
            テスト結果を追加してください
          </h3>
          <p style={{ margin: 0 }}>
            科目名、学期、テスト結果を入力して「テスト結果を追加」ボタンを押してください
          </p>
        </div>
      )}
    </div>
  );
};

export default GradeCalculator;
