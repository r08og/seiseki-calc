// ユーザー管理に関する型定義
export interface User {
  id: string;
  name: string;
  createdAt: Date;
}

// ユーザーセッション情報
export interface UserSession {
  userId: string;
  userName: string;
}
