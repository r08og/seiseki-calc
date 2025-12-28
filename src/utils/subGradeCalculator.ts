import type { GradingCriteria, TestScore } from '../types/grading';

// 技能評価用の評定基準（5段階評価）
export const SUB_GRADING_CRITERIA: GradingCriteria = {
  grade5: { min: 85, max: 100 },
  grade4: { min: 70, max: 84 },
  grade3: { min: 55, max: 69 },
  grade2: { min: 40, max: 54 },
  grade1: { min: 0, max: 39 },
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
    const finalScore = testPercentage * 0.8 + participationScore;
    totalScore += finalScore;
    
    console.log(`技能評価テスト: ${test.name}, テスト点: ${testPercentage}%, 平常点: ${participationScore}, 最終点: ${finalScore}`);
  });
  
  const average = totalScore / tests.length;
  console.log(`技能評価全体平均: ${average}`);
  return average;
};

// 加重平均から評定を計算する関数（技能評価基準）
export const calculateGradeFromAverage = (
  average: number,
  criteria: GradingCriteria = SUB_GRADING_CRITERIA
): number => {
  if (average >= criteria.grade5.min) return 5;
  if (average >= criteria.grade4.min) return 4;
  if (average >= criteria.grade3.min) return 3;
  if (average >= criteria.grade2.min) return 2;
  return 1;
};

// 目標評定に必要な加重平均を計算する関数（技能評価基準）
export const getRequiredAverageForGrade = (
  targetGrade: number,
  criteria: GradingCriteria = SUB_GRADING_CRITERIA
): number => {
  switch (targetGrade) {
    case 5: return criteria.grade5.min;
    case 4: return criteria.grade4.min;
    case 3: return criteria.grade3.min;
    case 2: return criteria.grade2.min;
    case 1: return criteria.grade1.min;
    default: return criteria.grade3.min;
  }
};

// 次のテストで必要な点数を計算（技能評価基準）
export const calculateRequiredScoreForNextTest = (
  currentTests: TestScore[],
  defaultParticipationScore: number,
  targetGrade: number,
  nextTestMaxScore: number = 100,
  nextTestParticipationScore?: number
): number => {
  // 目標評定に必要な総合点数
  const targetAverage = getRequiredAverageForGrade(targetGrade);
  
  // 次のテストで使用する平常点
  const nextParticipation = nextTestParticipationScore ?? defaultParticipationScore;
  
  // 現在のテスト数
  const currentTestCount = currentTests.length;
  
  if (currentTestCount === 0) {
    // テストが1つもない場合
    // targetAverage = nextTestScore * 0.8 + nextParticipation
    // nextTestScore = (targetAverage - nextParticipation) / 0.8
    const requiredTestScore = (targetAverage - nextParticipation) / 0.8;
    return Math.max(0, (requiredTestScore * nextTestMaxScore) / 100);
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
  // targetAverage = (currentTotalScore + nextTestFinalScore) / (currentTestCount + 1)
  // nextTestFinalScore = targetAverage * (currentTestCount + 1) - currentTotalScore
  
  const nextTestCount = currentTestCount + 1;
  const requiredNextTestFinalScore = targetAverage * nextTestCount - currentTotalScore;
  
  // nextTestFinalScore = nextTestScore * 0.8 + nextParticipation
  // nextTestScore = (nextTestFinalScore - nextParticipation) / 0.8
  const requiredTestScore100 = (requiredNextTestFinalScore - nextParticipation) / 0.8;
  
  // nextTestMaxScoreに合わせて調整
  const requiredScore = (requiredTestScore100 * nextTestMaxScore) / 100;
  
  return Math.max(0, requiredScore);
};

// 現在の評定をキープするために次のテストで必要な最低点数を計算（技能評価基準）
export const calculateRequiredScoreToKeepGrade = (
  currentTests: TestScore[],
  defaultParticipationScore: number,
  currentGrade: number,
  nextTestMaxScore: number = 100,
  nextTestParticipationScore?: number
): number => {
  // 現在の評定をキープするために必要な最低平均点
  const minAverageToKeep = getRequiredAverageForGrade(currentGrade);
  
  // 次のテストで使用する平常点
  const nextParticipation = nextTestParticipationScore ?? defaultParticipationScore;
  
  // 現在のテスト数
  const currentTestCount = currentTests.length;
  
  if (currentTestCount === 0) {
    // テストが1つもない場合、現在の評定をキープするための点数
    const requiredTestScore = (minAverageToKeep - nextParticipation) / 0.8;
    return Math.max(0, (requiredTestScore * nextTestMaxScore) / 100);
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
  const requiredTestScore100 = (requiredNextTestFinalScore - nextParticipation) / 0.8;
  const requiredScore = (requiredTestScore100 * nextTestMaxScore) / 100;
  
  return Math.max(0, requiredScore);
};
