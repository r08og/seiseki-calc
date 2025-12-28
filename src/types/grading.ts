// 評定計算に関する型定義
export interface TestScore {
  id: string;
  name: string; // テスト名（中間テスト、期末テストなど）
  score: number; // 点数
  weight: number; // 重み（配点比率）
  maxScore: number; // 満点
  date: Date;
  participationScore?: number; // このテスト期間の平常点（0-20点）
  semester?: string; // 学期（一学期、二学期、三学期）
}

export interface SubjectGrades {
  id: string;
  subjectName: string;
  studentId: string;
  currentTests: TestScore[]; // 既に実施されたテスト
  upcomingTests: UpcomingTest[]; // これから実施されるテスト
  assignments: Assignment[]; // 提出物
  participationScore: number; // 平常点（0-20点）
  currentGrade: number; // 現在の評定（1-5）
  targetGrade: number; // 目標評定（1-5）
  courseType?: 'advanced' | 'regular'; // コース種別（進学コース・普通コース）
}

export interface UpcomingTest {
  id: string;
  name: string;
  weight: number;
  maxScore: number;
  scheduledDate: Date;
  requiredScore?: number; // 目標達成に必要な点数（計算結果）
}

export interface Assignment {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  submittedDate: Date;
}

// 評定基準の型定義
export interface GradingCriteria {
  grade5: { min: number; max: number };
  grade4: { min: number; max: number };
  grade3: { min: number; max: number };
  grade2: { min: number; max: number };
  grade1: { min: number; max: number };
}

// 評定計算結果の型定義
export interface GradeCalculation {
  currentWeightedAverage: number; // 現在の加重平均
  currentGrade: number; // 現在の評定
  targetWeightedAverage: number; // 目標評定に必要な加重平均
  requiredScores: { [testId: string]: number }; // 各upcoming testで必要な点数
  achievable: boolean; // 目標が達成可能かどうか
  recommendedStrategy: string; // 推奨戦略
}
