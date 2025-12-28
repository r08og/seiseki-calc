import type { User, UserSession } from '../types/user';

// 現在のユーザーセッションを取得
export const getCurrentUser = (): UserSession | null => {
  const stored = localStorage.getItem('currentUser');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
};

// ユーザーセッションを設定
export const setCurrentUser = (user: UserSession): void => {
  localStorage.setItem('currentUser', JSON.stringify(user));
};

// ユーザーを作成
export const createUser = (name: string): UserSession => {
  const user: UserSession = {
    userId: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    userName: name
  };
  
  // 全ユーザーリストに追加
  const allUsers = getAllUsers();
  const newUser: User = {
    id: user.userId,
    name: user.userName,
    createdAt: new Date()
  };
  allUsers.push(newUser);
  localStorage.setItem('allUsers', JSON.stringify(allUsers));
  
  // 現在のユーザーとして設定
  setCurrentUser(user);
  
  return user;
};

// 全ユーザーを取得
export const getAllUsers = (): User[] => {
  const stored = localStorage.getItem('allUsers');
  if (stored) {
    try {
      return JSON.parse(stored).map((user: any) => ({
        ...user,
        createdAt: new Date(user.createdAt)
      }));
    } catch {
      return [];
    }
  }
  return [];
};

// ユーザー固有のキーを生成
export const getUserStorageKey = (baseKey: string, userId?: string): string => {
  const currentUser = userId || getCurrentUser()?.userId;
  if (!currentUser) {
    throw new Error('ユーザーが設定されていません');
  }
  return `${baseKey}_${currentUser}`;
};

// ユーザーをログアウト
export const logoutUser = (): void => {
  localStorage.removeItem('currentUser');
};
