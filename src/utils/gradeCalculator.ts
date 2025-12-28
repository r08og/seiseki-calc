import type { GradingCriteria, TestScore } from '../types/grading';

// 進学コースの評定基準（5段階評価）
export const ADVANCED_COURSE_GRADING: GradingCriteria = {
  grade5: { min: 80, max: 100 },
  grade4: { min: 65, max: 79 },
  grade3: { min: 50, max: 64 },
  grade2: { min: 40, max: 49 },
  grade1: { min: 0, max: 39 },
};

// 普通コースの評定基準（5段階評価）
export const REGULAR_COURSE_GRADING: GradingCriteria = {
  grade5: { min: 85, max: 100 },
  grade4: { min: 70, max: 84 },
  grade3: { min: 55, max: 69 },
  grade2: { min: 40, max: 54 },
  grade1: { min: 0, max: 39 },
};

// デフォルトは進学コース基準
export const DEFAULT_GRADING_CRITERIA: GradingCriteria = ADVANCED_COURSE_GRADING;

// コース選択に応じた評定基準を取得
export const getGradingCriteria = (courseType: 'advanced' | 'regular'): GradingCriteria => {
  return courseType === 'advanced' ? ADVANCED_COURSE_GRADING : REGULAR_COURSE_GRADING;
};

// シンプルな平均計算（テスト80% + 平常点20%）
export const calculateWeightedAverage = (
  tests: TestScore[],
  _assignments: { score: number; maxScore: number; weight: number }[],
  defaultParticipationScore: number
): number => {
  if (tests.length === 0) {
    return 0;
  }

  // 各テストの得点を計算（テスト80% + 平常点20%）
  let totalScore = 0;
  tests.forEach(test => {
    const testPercentage = (test.score / test.maxScore) * 100;
    const participationScore = test.participationScore ?? defaultParticipationScore;
    // 平常点を20点満点から20%に変換
    const participationPercentage = participationScore; // 既に20%分の点数
    const finalScore = testPercentage * 0.8 + participationPercentage;
    totalScore += finalScore;
    
    console.log(`テスト: ${test.name}, テスト点: ${testPercentage}%, 平常点: ${participationScore}点(20%), 最終点: ${finalScore}`);
  });
  
  const average = totalScore / tests.length;
  console.log(`全体平均: ${average}`);
  return average;
};

// 加重平均から評定を計算する関数
export const calculateGradeFromAverage = (
  average: number,
  criteria: GradingCriteria = DEFAULT_GRADING_CRITERIA
): number => {
  if (average >= criteria.grade5.min) return 5;
  if (average >= criteria.grade4.min) return 4;
  if (average >= criteria.grade3.min) return 3;
  if (average >= criteria.grade2.min) return 2;
  return 1;
};

// 目標評定に必要な加重平均を計算する関数
export const getRequiredAverageForGrade = (
  targetGrade: number,
  criteria: GradingCriteria = DEFAULT_GRADING_CRITERIA
): number => {
  switch (targetGrade) {
    case 5: return criteria.grade5.min;
    case 4: return criteria.grade4.min;
    case 3: return criteria.grade3.min;
    case 2: return criteria.grade2.min;
    case 1: return criteria.grade1.min;
    default: return 0;
  }
};

// 次のテストで必要な点数を計算する関数（正確版）
export const calculateRequiredScoreForNextTest = (
  currentTests: TestScore[],
  defaultParticipationScore: number,
  targetGrade: number,
  _nextTestMaxScore: number = 100,
  nextTestParticipationScore?: number,
  criteria: GradingCriteria = DEFAULT_GRADING_CRITERIA
): number => {
  // 目標評定に必要な総合点数
  const targetAverage = getRequiredAverageForGrade(targetGrade, criteria);
  
  // 次のテストで使用する平常点
  const nextParticipation = nextTestParticipationScore ?? defaultParticipationScore;
  
  // 現在のテスト数
  const currentTestCount = currentTests.length;
  
  if (currentTestCount === 0) {
    // テストが1つもない場合
    // targetAverage = nextTestScore * 0.8 + nextParticipation
    // nextTestScore = (targetAverage - nextParticipation) / 0.8
    const requiredTestScore = (targetAverage - nextParticipation) / 0.8;
    return Math.max(0, requiredTestScore);
  }
  
  // 現在のテストの合計点数（最終得点ベース）
  let currentTotalScore = 0;
  currentTests.forEach(test => {
    const testPercentage = (test.score / test.maxScore) * 100;
    const participationScore = test.participationScore ?? defaultParticipationScore;
    // 平常点は既に20%分の点数として扱う
    const finalScore = testPercentage * 0.8 + participationScore;
    currentTotalScore += finalScore;
  });
  
  // 次のテストを含めた場合の計算
  // targetAverage = (currentTotalScore + nextTestFinalScore) / (currentTestCount + 1)
  // nextTestFinalScore = targetAverage * (currentTestCount + 1) - currentTotalScore
  
  const nextTestCount = currentTestCount + 1;
  const requiredNextTestFinalScore = targetAverage * nextTestCount - currentTotalScore;
  
  // nextTestFinalScore = nextTestScore * 0.8 + nextParticipation
  // nextTestScore = (nextTestFinalScore - nextParticipation) / 0.8
  const requiredTestScore = (requiredNextTestFinalScore - nextParticipation) / 0.8;
  
  return Math.max(0, requiredTestScore);
};

// 現在の評定をキープするために次のテストで必要な最低点数を計算
export const calculateRequiredScoreToKeepGrade = (
  currentTests: TestScore[],
  defaultParticipationScore: number,
  currentGrade: number,
  nextTestParticipationScore?: number,
  criteria: GradingCriteria = DEFAULT_GRADING_CRITERIA
): number => {
  // 現在の評定をキープするために必要な最低平均点
  const minAverageToKeep = getRequiredAverageForGrade(currentGrade, criteria);
  
  // 次のテストで使用する平常点
  const nextParticipation = nextTestParticipationScore ?? defaultParticipationScore;
  
  // 現在のテスト数
  const currentTestCount = currentTests.length;
  
  if (currentTestCount === 0) {
    // テストが1つもない場合、現在の評定をキープするための点数
    const requiredTestScore = (minAverageToKeep - nextParticipation) / 0.8;
    return Math.max(0, requiredTestScore);
  }
  
  // 現在のテストの合計点数（最終得点ベース）
  let currentTotalScore = 0;
  currentTests.forEach(test => {
    const testPercentage = (test.score / test.maxScore) * 100;
    const participationScore = test.participationScore ?? defaultParticipationScore;
    const finalScore = testPercentage * 0.8 + participationScore;
    currentTotalScore += finalScore;
  });
  
  // 次のテストを含めた場合の計算
  const nextTestCount = currentTestCount + 1;
  const requiredNextTestFinalScore = minAverageToKeep * nextTestCount - currentTotalScore;
  
  // 必要なテスト点数を計算
  const requiredTestScore = (requiredNextTestFinalScore - nextParticipation) / 0.8;
  
  return Math.max(0, requiredTestScore);
};
