import React, { useState, useEffect } from 'react';
import type { Grade, Student, Subject } from '../types';

interface GradeManagementProps {
  students: Student[];
}

const GradeManagement: React.FC<GradeManagementProps> = ({ students }) => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects] = useState<Subject[]>([
    { id: '1', name: '国語', code: 'JPN', credits: 4, category: 'required' },
    { id: '2', name: '数学', code: 'MATH', credits: 4, category: 'required' },
    { id: '3', name: '英語', code: 'ENG', credits: 4, category: 'required' },
    { id: '4', name: '理科', code: 'SCI', credits: 3, category: 'required' },
    { id: '5', name: '社会', code: 'SOC', credits: 3, category: 'required' },
    { id: '6', name: '体育', code: 'PE', credits: 2, category: 'required' },
    { id: '7', name: '音楽', code: 'MUS', credits: 1, category: 'elective' },
    { id: '8', name: '美術', code: 'ART', credits: 1, category: 'elective' },
  ]);
  
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [newGrade, setNewGrade] = useState<{
    score: string;
    examType: Grade['examType'];
    semester: string;
    year: number;
  }>({
    score: '',
    examType: 'midterm',
    semester: '2024-1',
    year: 2024,
  });

  // ローカルストレージから成績データを読み込み
  useEffect(() => {
    const savedGrades = localStorage.getItem('grades');
    if (savedGrades) {
      const parsedGrades = JSON.parse(savedGrades).map((grade: any) => ({
        ...grade,
        recordedDate: new Date(grade.recordedDate)
      }));
      setGrades(parsedGrades);
    }
  }, []);

  // 成績データをローカルストレージに保存
  const saveGrades = (updatedGrades: Grade[]) => {
    setGrades(updatedGrades);
    localStorage.setItem('grades', JSON.stringify(updatedGrades));
  };

  // 点数から評価を計算
  const calculateLetterGrade = (score: number): Grade['letterGrade'] => {
    if (score >= 80) return 'A';
    if (score >= 65) return 'B';
    if (score >= 50) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  };

  // 成績を追加
  const handleAddGrade = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudent || !selectedSubject || !newGrade.score) {
      alert('学生、科目、点数を選択してください');
      return;
    }

    const score = parseInt(newGrade.score);
    if (score < 0 || score > 100) {
      alert('点数は0-100の間で入力してください');
      return;
    }

    const grade: Grade = {
      id: Date.now().toString(),
      studentId: selectedStudent,
      subjectId: selectedSubject,
      score,
      letterGrade: calculateLetterGrade(score),
      semester: newGrade.semester,
      year: newGrade.year,
      examType: newGrade.examType,
      recordedDate: new Date(),
    };

    const updatedGrades = [...grades, grade];
    saveGrades(updatedGrades);
    
    // フォームをリセット
    setNewGrade({
      score: '',
      examType: 'midterm',
      semester: '2024-1',
      year: 2024,
    });
  };

  // 成績を削除
  const handleDeleteGrade = (gradeId: string) => {
    if (confirm('この成績を削除してもよろしいですか？')) {
      const updatedGrades = grades.filter(grade => grade.id !== gradeId);
      saveGrades(updatedGrades);
    }
  };

  // 学生名を取得
  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : '不明';
  };

  // 科目名を取得
  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? subject.name : '不明';
  };

  return (
    <div className="grade-management">
      <h2>成績管理</h2>
      
      {/* 成績入力フォーム */}
      <div className="grade-form">
        <h3>成績入力</h3>
        <form onSubmit={handleAddGrade}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="student">学生</label>
              <select
                id="student"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                required
              >
                <option value="">学生を選択</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.studentNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="subject">科目</label>
              <select
                id="subject"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                required
              >
                <option value="">科目を選択</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="score">点数</label>
              <input
                type="number"
                id="score"
                min="0"
                max="100"
                value={newGrade.score}
                onChange={(e) => setNewGrade(prev => ({ ...prev, score: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="examType">試験種別</label>
              <select
                id="examType"
                value={newGrade.examType}
                onChange={(e) => setNewGrade(prev => ({ ...prev, examType: e.target.value as Grade['examType'] }))}
              >
                <option value="midterm">中間試験</option>
                <option value="final">期末試験</option>
                <option value="assignment">課題</option>
                <option value="quiz">小テスト</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="semester">学期</label>
              <select
                id="semester"
                value={newGrade.semester}
                onChange={(e) => setNewGrade(prev => ({ ...prev, semester: e.target.value }))}
              >
                <option value="2024-1">2024年度 前期</option>
                <option value="2024-2">2024年度 後期</option>
              </select>
            </div>

            <button type="submit" className="btn-primary">
              成績を登録
            </button>
          </div>
        </form>
      </div>

      {/* 成績一覧 */}
      <div className="grade-list">
        <h3>登録済み成績</h3>
        {grades.length === 0 ? (
          <p>まだ成績が登録されていません。</p>
        ) : (
          <div className="table-container">
            <table className="grade-table">
              <thead>
                <tr>
                  <th>学生</th>
                  <th>科目</th>
                  <th>点数</th>
                  <th>評価</th>
                  <th>試験種別</th>
                  <th>学期</th>
                  <th>登録日</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {grades.map(grade => (
                  <tr key={grade.id}>
                    <td>{getStudentName(grade.studentId)}</td>
                    <td>{getSubjectName(grade.subjectId)}</td>
                    <td>{grade.score}</td>
                    <td className={`grade-${grade.letterGrade.toLowerCase()}`}>
                      {grade.letterGrade}
                    </td>
                    <td>
                      {grade.examType === 'midterm' && '中間試験'}
                      {grade.examType === 'final' && '期末試験'}
                      {grade.examType === 'assignment' && '課題'}
                      {grade.examType === 'quiz' && '小テスト'}
                    </td>
                    <td>{grade.semester}</td>
                    <td>{grade.recordedDate.toLocaleDateString('ja-JP')}</td>
                    <td>
                      <button
                        onClick={() => handleDeleteGrade(grade.id)}
                        className="btn-delete"
                        title="削除"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeManagement;
