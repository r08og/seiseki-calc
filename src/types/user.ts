// ユーザー管理に関する型定義
export interface User {
  id: string;
  name: string;
  courseType: 'advanced' | 'regular';
  createdAt: Date;
}

// ユーザーセッション情報
export interface UserSession {
  userId: string;
  userName: string;
  courseType: 'advanced' | 'regular';
}
