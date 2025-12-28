import React, { useState, useEffect } from 'react';
import type { Student } from '../types';

interface StudentFormProps {
  student?: Student | null;
  onSubmit: (studentData: Omit<Student, 'id'>) => void;
  onCancel: () => void;
}

const StudentForm: React.FC<StudentFormProps> = ({ student, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    studentNumber: '',
    grade: 1,
    class: '',
    email: '',
    enrollmentDate: new Date().toISOString().split('T')[0],
  });

  // 編集時にフォームデータを設定
  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name,
        studentNumber: student.studentNumber,
        grade: student.grade,
        class: student.class,
        email: student.email || '',
        enrollmentDate: student.enrollmentDate.toISOString().split('T')[0],
      });
    }
  }, [student]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (!formData.name.trim() || !formData.studentNumber.trim()) {
      alert('名前と学籍番号は必須です');
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      studentNumber: formData.studentNumber.trim(),
      grade: formData.grade,
      class: formData.class.trim(),
      email: formData.email.trim() || undefined,
      enrollmentDate: new Date(formData.enrollmentDate),
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'grade' ? parseInt(value) : value,
    }));
  };

  return (
    <div className="student-form-modal">
      <div className="form-container">
        <h3>{student ? '学生情報編集' : '新規学生登録'}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">氏名 *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="studentNumber">学籍番号 *</label>
            <input
              type="text"
              id="studentNumber"
              name="studentNumber"
              value={formData.studentNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="grade">学年</label>
            <select
              id="grade"
              name="grade"
              value={formData.grade}
              onChange={handleChange}
            >
              {[1, 2, 3, 4, 5, 6].map(grade => (
                <option key={grade} value={grade}>{grade}年</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="class">クラス</label>
            <input
              type="text"
              id="class"
              name="class"
              value={formData.class}
              onChange={handleChange}
              placeholder="例: A組"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">メールアドレス</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="enrollmentDate">入学日</label>
            <input
              type="date"
              id="enrollmentDate"
              name="enrollmentDate"
              value={formData.enrollmentDate}
              onChange={handleChange}
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-secondary">
              キャンセル
            </button>
            <button type="submit" className="btn-primary">
              {student ? '更新' : '登録'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentForm;
