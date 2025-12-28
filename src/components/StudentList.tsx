import React, { useState } from 'react';
import type { Student } from '../types';

interface StudentListProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (studentId: string) => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof Student>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 検索とソートを適用
  const filteredAndSortedStudents = students
    .filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: keyof Student) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: keyof Student) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  if (students.length === 0) {
    return (
      <div className="student-list">
        <p className="no-data">登録されている学生がいません。</p>
      </div>
    );
  }

  return (
    <div className="student-list">
      <div className="list-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="学生検索（氏名、学籍番号、クラス）"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="student-count">
          {filteredAndSortedStudents.length} / {students.length} 人
        </div>
      </div>

      <div className="table-container">
        <table className="student-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} className="sortable">
                氏名 {getSortIcon('name')}
              </th>
              <th onClick={() => handleSort('studentNumber')} className="sortable">
                学籍番号 {getSortIcon('studentNumber')}
              </th>
              <th onClick={() => handleSort('grade')} className="sortable">
                学年 {getSortIcon('grade')}
              </th>
              <th onClick={() => handleSort('class')} className="sortable">
                クラス {getSortIcon('class')}
              </th>
              <th>メール</th>
              <th onClick={() => handleSort('enrollmentDate')} className="sortable">
                入学日 {getSortIcon('enrollmentDate')}
              </th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedStudents.map(student => (
              <tr key={student.id}>
                <td>{student.name}</td>
                <td>{student.studentNumber}</td>
                <td>{student.grade}年</td>
                <td>{student.class}</td>
                <td>{student.email || '-'}</td>
                <td>{student.enrollmentDate.toLocaleDateString('ja-JP')}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => onEdit(student)}
                      className="btn-edit"
                      title="編集"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(student.id)}
                      className="btn-delete"
                      title="削除"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAndSortedStudents.length === 0 && searchTerm && (
        <p className="no-results">検索条件に該当する学生が見つかりません。</p>
      )}
    </div>
  );
};

export default StudentList;
