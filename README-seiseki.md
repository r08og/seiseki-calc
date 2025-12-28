# 成績管理システム (Seiseki)

React + TypeScript + Viteで構築された学生の成績を管理するWebアプリケーションです。

## 機能

### 学生管理
- 学生情報の登録・編集・削除
- 学生一覧の表示・検索・ソート
- 学生データの永続化（ローカルストレージ）

### 成績管理
- 成績の入力・登録
- 科目別成績の管理
- 各種試験種別（中間試験、期末試験、課題、小テスト）のサポート
- 自動評価（A-F）の計算

### レポート機能
- 学生個別成績レポート
- 科目別成績レポート
- 全体統計レポート
- 成績分布の可視化

## 技術スタック

- **Frontend**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: CSS3 (カスタムスタイル)
- **Data Storage**: localStorage (ブラウザローカルストレージ)

## 開発環境のセットアップ

### 前提条件
- Node.js (version 18以上)
- npm または yarn

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

## プロジェクト構造

```
src/
├── components/          # Reactコンポーネント
│   ├── StudentManagement.tsx    # 学生管理コンポーネント
│   ├── StudentForm.tsx          # 学生登録・編集フォーム
│   ├── StudentList.tsx          # 学生一覧表示
│   ├── GradeManagement.tsx      # 成績管理コンポーネント
│   └── ReportGenerator.tsx      # レポート生成コンポーネント
├── types/               # TypeScript型定義
│   └── index.ts         # アプリケーション全体の型定義
├── App.tsx              # メインアプリケーションコンポーネント
├── App.css              # アプリケーションスタイル
└── main.tsx             # エントリーポイント
```

## データモデル

### Student（学生）
```typescript
interface Student {
  id: string;
  name: string;
  studentNumber: string;
  grade: number;
  class: string;
  email?: string;
  enrollmentDate: Date;
}
```

### Grade（成績）
```typescript
interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  score: number;
  letterGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  semester: string;
  year: number;
  examType: 'midterm' | 'final' | 'assignment' | 'quiz';
  recordedDate: Date;
}
```

### Subject（科目）
```typescript
interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
  category: 'required' | 'elective' | 'specialized';
}
```

## 評価基準

- A: 90点以上
- B: 80-89点
- C: 70-79点
- D: 60-69点
- F: 60点未満

## 使用方法

1. **学生管理**: 新規学生を登録し、学生情報を管理します
2. **成績管理**: 登録済み学生に対して各科目の成績を入力します
3. **レポート**: 個別学生レポート、科目別レポート、全体統計を確認できます

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 貢献

プルリクエストや課題報告を歓迎します。

## 開発者

React + TypeScript + Viteによる成績管理システム
