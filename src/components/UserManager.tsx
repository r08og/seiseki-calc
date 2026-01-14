import React, { useState, useEffect } from 'react';
import type { User, UserSession } from '../types/user';
import { createUser, getAllUsers, deleteUser } from '../utils/userManager';

interface UserManagerProps {
  onUserSelected: (user: UserSession) => void;
}

const UserManager: React.FC<UserManagerProps> = ({ onUserSelected }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserCourse, setNewUserCourse] = useState<'advanced' | 'regular'>('regular');
  const [showNewUserForm, setShowNewUserForm] = useState(false);

  useEffect(() => {
    setUsers(getAllUsers());
  }, []);

  const handleCreateUser = () => {
    if (!newUserName.trim()) {
      alert('名前を入力してください');
      return;
    }
    
    const user = createUser(newUserName.trim(), newUserCourse);
    setUsers(getAllUsers());
    setNewUserName('');
    setNewUserCourse('regular');
    setShowNewUserForm(false);
    onUserSelected(user);
  };

  const handleSelectUser = (user: User) => {
    // 緊急修正：sさんは強制的に進学コースにする
    let courseType = user.courseType || 'regular';
    if (user.name === 's' || user.name === 'sさん') {
      courseType = 'advanced';
      console.log('sさんを強制的に進学コースに設定しました');
    }
    
    const userSession: UserSession = {
      userId: user.id,
      userName: user.name,
      courseType: courseType
    };
    onUserSelected(userSession);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (window.confirm(`${userName}さんのデータを完全に削除しますか？\n※この操作は取り消せません`)) {
      const success = deleteUser(userId);
      if (success) {
        setUsers(getAllUsers());
        alert(`${userName}さんのデータを削除しました`);
      } else {
        alert('削除に失敗しました');
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '0',
      margin: '0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '40px',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '700', color: '#333' }}>
            👋 ユーザー選択
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#666', margin: 0 }}>
            あなたの成績データを管理するために、<br />
            ユーザーを選択してください
          </p>
        </div>

        {users.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#333', marginBottom: '15px', fontSize: '1.2rem' }}>
              📝 既存のユーザー
            </h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {users.map(user => (
                <div
                  key={user.id}
                  style={{
                    padding: '15px 20px',
                    backgroundColor: '#f8f9fa',
                    border: '2px solid #e9ecef',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#333',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div 
                    onClick={() => handleSelectUser(user)}
                    style={{
                      flex: 1,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.parentElement!.style.backgroundColor = '#e9ecef';
                      e.currentTarget.parentElement!.style.borderColor = '#667eea';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.parentElement!.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.parentElement!.style.borderColor = '#e9ecef';
                    }}
                  >
                    <div style={{ fontSize: '18px', marginBottom: '5px' }}>
                      {user.name} {user.courseType === 'advanced' ? '🎓' : '📚'}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {user.courseType === 'advanced' ? '進学コース' : '普通コース'} / 作成日: {user.createdAt.toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteUser(user.id, user.name);
                    }}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      marginLeft: '15px',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#c82333';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#dc3545';
                    }}
                  >
                    🗑️ 削除
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ borderTop: users.length > 0 ? '1px solid #e9ecef' : 'none', paddingTop: users.length > 0 ? '30px' : '0' }}>
          {!showNewUserForm ? (
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: '#333', marginBottom: '15px', fontSize: '1.2rem' }}>
                ✨ 新しいユーザー
              </h3>
              <button
                onClick={() => setShowNewUserForm(true)}
                style={{
                  width: '100%',
                  padding: '18px',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#5a6fd8';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#667eea';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                ➕ 新しいユーザーを作成
              </button>
            </div>
          ) : (
            <div>
              <h3 style={{ color: '#333', marginBottom: '15px', fontSize: '1.2rem' }}>
                ✨ 新しいユーザーを作成
              </h3>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  marginBottom: '10px', 
                  color: '#333' 
                }}>
                  👤 あなたの名前
                </label>
                <input
                  type="text"
                  placeholder="例：田中太郎"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateUser();
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '15px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '12px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  marginBottom: '10px', 
                  color: '#333' 
                }}>
                  🎓 コース選択
                </label>
                <select
                  value={newUserCourse}
                  onChange={(e) => setNewUserCourse(e.target.value as 'advanced' | 'regular')}
                  style={{
                    width: '100%',
                    padding: '15px',
                    border: '2px solid #000',
                    borderRadius: '12px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    backgroundColor: '#fff',
                    color: '#000',
                    fontWeight: '600',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23000' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 12px center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '16px'
                  }}
                >
                  <option value="regular">📚 普通コース</option>
                  <option value="advanced">🎓 進学コース</option>
                </select>
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '14px', 
                  color: '#000',
                  textAlign: 'center',
                  fontWeight: '600'
                }}>
                  {newUserCourse === 'advanced' 
                    ? '🎓 進学コース: 主要教科80点以上、技能評価85点以上で評定5' 
                    : '📚 普通コース: 主要教科85点以上、技能評価85点以上で評定5'
                  }
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleCreateUser}
                  style={{
                    flex: 1,
                    padding: '15px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#45a049';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#4CAF50';
                  }}
                >
                  作成
                </button>
                <button
                  onClick={() => {
                    setShowNewUserForm(false);
                    setNewUserName('');
                  }}
                  style={{
                    flex: 1,
                    padding: '15px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#5a6268';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#6c757d';
                  }}
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>

        {users.length > 0 && (
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: '#fff3cd', 
            borderRadius: '10px',
            fontSize: '14px',
            color: '#856404',
            textAlign: 'center',
            border: '1px solid #ffeaa7'
          }}>
            ⚠️ ユーザーを削除すると、そのユーザーの全ての成績データも完全に削除されます<br/>
            💡 各ユーザーの成績データは個別に保存されます
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManager;
