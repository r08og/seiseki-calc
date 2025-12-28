import React, { useState, useEffect } from 'react';
import type { Student } from '../types';
import StudentForm from './StudentForm';
import StudentList from './StudentList';

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showForm, setShowForm] = useState(false);

  // ローカルストレージから学生データを読み込み
  useEffect(() => {
    const savedStudents = localStorage.getItem('students');
    if (savedStudents) {
      const parsedStudents = JSON.parse(savedStudents).map((student: any) => ({
        ...student,
        enrollmentDate: new Date(student.enrollmentDate)
      }));
      setStudents(parsedStudents);
    }
  }, []);

  // 学生データをローカルストレージに保存
  const saveStudents = (updatedStudents: Student[]) => {
    setStudents(updatedStudents);
    localStorage.setItem('students', JSON.stringify(updatedStudents));
  };

  // 学生を追加
  const handleAddStudent = (studentData: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...studentData,
      id: Date.now().toString(),
    };
    const updatedStudents = [...students, newStudent];
    saveStudents(updatedStudents);
    setShowForm(false);
  };

  // 学生を更新
  const handleUpdateStudent = (studentData: Omit<Student, 'id'>) => {
    if (!selectedStudent) return;
    
    const updatedStudents = students.map(student =>
      student.id === selectedStudent.id
        ? { ...studentData, id: selectedStudent.id }
        : student
    );
    saveStudents(updatedStudents);
    setSelectedStudent(null);
    setShowForm(false);
  };

  // 学生を削除
  const handleDeleteStudent = (studentId: string) => {
    if (confirm('この学生を削除してもよろしいですか？')) {
      const updatedStudents = students.filter(student => student.id !== studentId);
      saveStudents(updatedStudents);
    }
  };

  // 学生を選択して編集
  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowForm(true);
  };

  // フォームをキャンセル
  const handleCancelForm = () => {
    setSelectedStudent(null);
    setShowForm(false);
  };

  return (
    <div className="student-management">
      <h2>学生管理</h2>
      
      <div className="management-header">
        <button 
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          新規学生追加
        </button>
      </div>

      {showForm && (
        <StudentForm
          student={selectedStudent}
          onSubmit={selectedStudent ? handleUpdateStudent : handleAddStudent}
          onCancel={handleCancelForm}
        />
      )}

      <StudentList
        students={students}
        onEdit={handleEditStudent}
        onDelete={handleDeleteStudent}
      />
    </div>
  );
};

export default StudentManagement;
