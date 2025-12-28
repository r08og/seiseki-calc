import React, { useState } from 'react';
import type { Grade, Student, Subject, GradeStatistics } from '../types';

interface ReportGeneratorProps {
  students: Student[];
  grades: Grade[];
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ students, grades }) => {
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
  const [reportType, setReportType] = useState<'student' | 'subject' | 'overall'>('student');

  // 統計情報を計算
  const calculateStatistics = (gradeList: Grade[]): GradeStatistics => {
    if (gradeList.length === 0) {
      return {
        average: 0,
        highest: 0,
        lowest: 0,
        passingRate: 0,
        gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 }
      };
    }

    const scores = gradeList.map(g => g.score);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const passingGrades = gradeList.filter(g => g.score >= 40).length;
    const passingRate = (passingGrades / gradeList.length) * 100;

    const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    gradeList.forEach(grade => {
      gradeDistribution[grade.letterGrade]++;
    });

    return {
      average: Math.round(average * 10) / 10,
      highest,
      lowest,
      passingRate: Math.round(passingRate * 10) / 10,
      gradeDistribution
    };
  };

  // 学生個別レポート
  const generateStudentReport = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return null;

    const studentGrades = grades.filter(g => g.studentId === studentId);
    const statistics = calculateStatistics(studentGrades);

    return (
      <div className="report">
        <h3>学生個別成績レポート</h3>
        <div className="report-header">
          <h4>{student.name} ({student.studentNumber})</h4>
          <p>{student.grade}年 {student.class}</p>
        </div>

        <div className="statistics">
          <div className="stat-item">
            <span className="label">平均点:</span>
            <span className="value">{statistics.average}点</span>
          </div>
          <div className="stat-item">
            <span className="label">最高点:</span>
            <span className="value">{statistics.highest}点</span>
          </div>
          <div className="stat-item">
            <span className="label">最低点:</span>
            <span className="value">{statistics.lowest}点</span>
          </div>
          <div className="stat-item">
            <span className="label">合格率:</span>
            <span className="value">{statistics.passingRate}%</span>
          </div>
        </div>

        <div className="grade-distribution">
          <h5>評価分布</h5>
          <div className="distribution-chart">
            {Object.entries(statistics.gradeDistribution).map(([grade, count]) => (
              <div key={grade} className="distribution-item">
                <span className={`grade-label grade-${grade.toLowerCase()}`}>{grade}</span>
                <span className="count">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="detailed-grades">
          <h5>詳細成績</h5>
          <table className="report-table">
            <thead>
              <tr>
                <th>科目</th>
                <th>点数</th>
                <th>評価</th>
                <th>試験種別</th>
                <th>学期</th>
              </tr>
            </thead>
            <tbody>
              {studentGrades.map(grade => (
                <tr key={grade.id}>
                  <td>{subjects.find(s => s.id === grade.subjectId)?.name || '不明'}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 科目別レポート
  const generateSubjectReport = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return null;

    const subjectGrades = grades.filter(g => g.subjectId === subjectId);
    const statistics = calculateStatistics(subjectGrades);

    return (
      <div className="report">
        <h3>科目別成績レポート</h3>
        <div className="report-header">
          <h4>{subject.name} ({subject.code})</h4>
          <p>{subject.credits}単位 - {
            subject.category === 'required' ? '必修' :
            subject.category === 'elective' ? '選択' : '専門'
          }</p>
        </div>

        <div className="statistics">
          <div className="stat-item">
            <span className="label">受講者数:</span>
            <span className="value">{subjectGrades.length}人</span>
          </div>
          <div className="stat-item">
            <span className="label">平均点:</span>
            <span className="value">{statistics.average}点</span>
          </div>
          <div className="stat-item">
            <span className="label">最高点:</span>
            <span className="value">{statistics.highest}点</span>
          </div>
          <div className="stat-item">
            <span className="label">最低点:</span>
            <span className="value">{statistics.lowest}点</span>
          </div>
          <div className="stat-item">
            <span className="label">合格率:</span>
            <span className="value">{statistics.passingRate}%</span>
          </div>
        </div>

        <div className="grade-distribution">
          <h5>評価分布</h5>
          <div className="distribution-chart">
            {Object.entries(statistics.gradeDistribution).map(([grade, count]) => (
              <div key={grade} className="distribution-item">
                <span className={`grade-label grade-${grade.toLowerCase()}`}>{grade}</span>
                <span className="count">{count}</span>
                <span className="percentage">
                  ({subjectGrades.length > 0 ? Math.round((count / subjectGrades.length) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="detailed-grades">
          <h5>受講者成績一覧</h5>
          <table className="report-table">
            <thead>
              <tr>
                <th>学生</th>
                <th>学籍番号</th>
                <th>点数</th>
                <th>評価</th>
                <th>試験種別</th>
                <th>学期</th>
              </tr>
            </thead>
            <tbody>
              {subjectGrades.map(grade => {
                const student = students.find(s => s.id === grade.studentId);
                return (
                  <tr key={grade.id}>
                    <td>{student?.name || '不明'}</td>
                    <td>{student?.studentNumber || '不明'}</td>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 全体レポート
  const generateOverallReport = () => {
    const statistics = calculateStatistics(grades);

    return (
      <div className="report">
        <h3>全体成績レポート</h3>
        
        <div className="statistics">
          <div className="stat-item">
            <span className="label">総成績数:</span>
            <span className="value">{grades.length}件</span>
          </div>
          <div className="stat-item">
            <span className="label">全体平均点:</span>
            <span className="value">{statistics.average}点</span>
          </div>
          <div className="stat-item">
            <span className="label">最高点:</span>
            <span className="value">{statistics.highest}点</span>
          </div>
          <div className="stat-item">
            <span className="label">最低点:</span>
            <span className="value">{statistics.lowest}点</span>
          </div>
          <div className="stat-item">
            <span className="label">全体合格率:</span>
            <span className="value">{statistics.passingRate}%</span>
          </div>
        </div>

        <div className="grade-distribution">
          <h5>全体評価分布</h5>
          <div className="distribution-chart">
            {Object.entries(statistics.gradeDistribution).map(([grade, count]) => (
              <div key={grade} className="distribution-item">
                <span className={`grade-label grade-${grade.toLowerCase()}`}>{grade}</span>
                <span className="count">{count}</span>
                <span className="percentage">
                  ({grades.length > 0 ? Math.round((count / grades.length) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 科目別統計 */}
        <div className="subject-statistics">
          <h5>科目別統計</h5>
          <table className="report-table">
            <thead>
              <tr>
                <th>科目</th>
                <th>受講者数</th>
                <th>平均点</th>
                <th>最高点</th>
                <th>最低点</th>
                <th>合格率</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map(subject => {
                const subjectGrades = grades.filter(g => g.subjectId === subject.id);
                const subjectStats = calculateStatistics(subjectGrades);
                
                if (subjectGrades.length === 0) return null;
                
                return (
                  <tr key={subject.id}>
                    <td>{subject.name}</td>
                    <td>{subjectGrades.length}</td>
                    <td>{subjectStats.average}</td>
                    <td>{subjectStats.highest}</td>
                    <td>{subjectStats.lowest}</td>
                    <td>{subjectStats.passingRate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderReport = () => {
    switch (reportType) {
      case 'student':
        return selectedStudent ? generateStudentReport(selectedStudent) : null;
      case 'subject':
        return selectedSubject ? generateSubjectReport(selectedSubject) : null;
      case 'overall':
        return generateOverallReport();
      default:
        return null;
    }
  };

  return (
    <div className="report-generator">
      <h2>成績レポート</h2>
      
      <div className="report-controls">
        <div className="form-group">
          <label>レポート種別</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as 'student' | 'subject' | 'overall')}
          >
            <option value="student">学生個別レポート</option>
            <option value="subject">科目別レポート</option>
            <option value="overall">全体レポート</option>
          </select>
        </div>

        {reportType === 'student' && (
          <div className="form-group">
            <label>学生選択</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              <option value="">学生を選択</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.studentNumber})
                </option>
              ))}
            </select>
          </div>
        )}

        {reportType === 'subject' && (
          <div className="form-group">
            <label>科目選択</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="">科目を選択</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="report-content">
        {renderReport()}
      </div>
    </div>
  );
};

export default ReportGenerator;
