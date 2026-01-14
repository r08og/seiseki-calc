import React, { useState } from 'react';

const SubGradeCalculator: React.FC = () => {
  const [formData, setFormData] = useState({
    subjectName: '',
    semester: '',
    testName: '',
    score: '',
    maxScore: '100',
    targetGrade: 4,
    participation: '16'
  });

  const [results, setResults] = useState<any>(null);

  const calculateGrade = () => {
    if (!formData.subjectName || !formData.semester || !formData.testName || !formData.score) {
      alert('すべての項目を入力してください');
      return;
    }

    const score = parseInt(formData.score);
    const maxScore = parseInt(formData.maxScore);
    const participation = parseInt(formData.participation);
    
    // 簡単な計算（80%テスト+20%平常点）
    const testPercentage = (score / maxScore) * 80;
    const participationPercentage = participation;
    const totalScore = testPercentage + participationPercentage;
    
    let grade = 1;
    if (totalScore >= 85) grade = 5;
    else if (totalScore >= 70) grade = 4;
    else if (totalScore >= 55) grade = 3;
    else if (totalScore >= 40) grade = 2;
    
    setResults({
      currentGrade: grade,
      currentAverage: Math.round(totalScore * 10) / 10,
      isAchieved: grade >= formData.targetGrade,
      testScore: score,
      maxScore: maxScore
    });
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
            onClick={calculateGrade}
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
              📊 {formData.subjectName} の結果
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
                <div style={{ fontSize: '0.9rem', color: '#888' }}>目指そう！</div>
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
                  {results.isAchieved ? 'おめでとう' : '次回頑張ろう'}
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
                  : '技能教科は実技や作品制作が重要です。頑張りましょう！'
                }
              </div>
            </div>

            {/* テスト結果表示 */}
            <div style={{ marginTop: '25px' }}>
              <h3 style={{ color: '#333', marginBottom: '15px' }}>📝 テスト結果</h3>
              <div style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: '600' }}>科目:</span>
                  <span>{formData.subjectName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: '600' }}>学期:</span>
                  <span>{formData.semester}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: '600' }}>テスト:</span>
                  <span>{formData.testName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: '600' }}>得点:</span>
                  <span>{results.testScore}/{results.maxScore}点 ({Math.round((results.testScore / results.maxScore) * 100)}%)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '600' }}>平常点:</span>
                  <span>{formData.participation}点</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 初回メッセージ */}
        {!results && (
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
};

export default SubGradeCalculator;
