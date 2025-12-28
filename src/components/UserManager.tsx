import React, { useState, useEffect } from 'react';
import type { User, UserSession } from '../types/user';
import { createUser, getAllUsers } from '../utils/userManager';

interface UserManagerProps {
  onUserSelected: (user: UserSession) => void;
}

const UserManager: React.FC<UserManagerProps> = ({ onUserSelected }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUserName, setNewUserName] = useState('');
  const [showNewUserForm, setShowNewUserForm] = useState(false);

  useEffect(() => {
    setUsers(getAllUsers());
  }, []);

  const handleCreateUser = () => {
    if (!newUserName.trim()) {
      alert('名前を入力してください');
      return;
    }
    
    const user = createUser(newUserName.trim());
    setUsers(getAllUsers());
    setNewUserName('');
    setShowNewUserForm(false);
    onUserSelected(user);
  };

  const handleSelectUser = (user: User) => {
    const userSession: UserSession = {
      userId: user.id,
      userName: user.name
    };
    onUserSelected(userSession);
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
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  style={{
                    padding: '15px 20px',
                    backgroundColor: '#f8f9fa',
                    border: '2px solid #e9ecef',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#333',
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#e9ecef';
                    e.currentTarget.style.borderColor = '#667eea';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                    e.currentTarget.style.borderColor = '#e9ecef';
                  }}
                >
                  <div style={{ fontSize: '18px', marginBottom: '5px' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    作成日: {user.createdAt.toLocaleDateString('ja-JP')}
                  </div>
                </button>
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
            backgroundColor: '#f8f9fa', 
            borderRadius: '10px',
            fontSize: '14px',
            color: '#666',
            textAlign: 'center'
          }}>
            💡 各ユーザーの成績データは個別に保存されます
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManager;
