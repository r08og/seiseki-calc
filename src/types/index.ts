// 学生情報の型定義
export interface Student {
  id: string;
  name: string;
  studentNumber: string;
  grade: number; // 学年
  class: string; // クラス
  email?: string;
  enrollmentDate: Date;
}

// 科目の型定義
export interface Subject {
  id: string;
  name: string;
  code: string; // 科目コード
  credits: number; // 単位数
  category: 'required' | 'elective' | 'specialized'; // 必修/選択/専門
}

// 成績の型定義
export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  score: number; // 点数 (0-100)
  letterGrade: 'A' | 'B' | 'C' | 'D' | 'F'; // 評価
  semester: string; // 学期
  year: number; // 年度
  examType: 'midterm' | 'final' | 'assignment' | 'quiz'; // 試験種別
  recordedDate: Date;
}

// 成績統計の型定義
export interface GradeStatistics {
  average: number;
  highest: number;
  lowest: number;
  passingRate: number; // 合格率
  gradeDistribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
}

// 学期の型定義
export interface Semester {
  id: string;
  name: string;
  year: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}
