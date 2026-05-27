import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Trophy, 
  UserPlus, 
  Bell, 
  Zap, 
  Moon, 
  Clock, 
  Brain, 
  ShieldAlert, 
  ChevronRight,
  UserCheck
} from 'lucide-react';

const Competitive = () => {
  const { user, authFetch, addFriend, clearNotifications } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [friendEmail, setFriendEmail] = useState('');
  const [selectedFriendId, setSelectedFriendId] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    try {
      const res = await authFetch('/auth/friends/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
        // Default select first friend for comparison if available
        if (data.length > 1 && !selectedFriendId) {
          const firstFriend = data.find(f => f.userId !== user._id);
          if (firstFriend) {
            setSelectedFriendId(firstFriend.userId);
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch leaderboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [user?.friends]);

  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!friendEmail.trim()) return;

    setMessage({ text: '', type: '' });
    try {
      const data = await addFriend(friendEmail);
      setMessage({ text: data.message || 'Friend added!', type: 'success' });
      setFriendEmail('');
      fetchLeaderboard();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to add friend', type: 'error' });
    }
  };

  const handlePoke = async (friendId, name) => {
    try {
      const res = await authFetch('/auth/friends/poke', {
        method: 'POST',
        body: JSON.stringify({ friendId })
      });
      if (res.ok) {
        setMessage({ text: `You poked ${name}! Nudge sent successfully.`, type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
      }
    } catch (e) {
      console.error('Poke error:', e);
    }
  };

  // Get selected friend details for comparison
  const selectedFriend = leaderboard.find(f => f.userId === selectedFriendId);
  const myStats = leaderboard.find(f => f.userId === user._id);

  return (
    <div className="page-container">
      
      {/* Notifications banner */}
      {user?.notifications && user.notifications.length > 0 && (
        <div className="card" style={{ 
          background: 'rgba(99, 102, 241, 0.08)', 
          border: '1px solid rgba(99, 102, 241, 0.3)',
          padding: '16px 20px',
          flexShrink: 0
        }}>
          <div className="flex justify-between align-center" style={{ marginBottom: '10px' }}>
            <span className="flex align-center gap-8" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
              <Bell size={14} /> Alerts & Social Logs
            </span>
            <button 
              onClick={clearNotifications}
              className="btn-icon" 
              style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-column gap-8">
            {user.notifications.map((notif) => (
              <div key={notif.id} className="flex justify-between align-center" style={{ 
                fontSize: '13px', 
                padding: '8px 12px', 
                background: 'rgba(255, 255, 255, 0.02)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '6px' 
              }}>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>{notif.senderName}</strong> {notif.message}
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {message.text && (
        <div style={{
          background: message.type === 'success' ? 'var(--color-success-glow)' : 'var(--color-danger-glow)',
          border: `1px solid ${message.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}`,
          color: 'var(--text-primary)',
          padding: '12px 16px',
          borderRadius: '6px',
          fontSize: '13px',
          flexShrink: 0
        }}>
          {message.text}
        </div>
      )}

      <div className="grid-dash">
        
        {/* Left Side: Leaderboard & Add Friends */}
        <div className="inner-column">
          
          {/* Add Friend Card */}
          <div className="card" style={{ flexShrink: 0 }}>
            <span className="card-title" style={{ fontSize: '13px', marginBottom: '12px' }}>
              <span className="flex align-center gap-8"><UserPlus size={14} /> Add Friend to compete</span>
            </span>
            <form onSubmit={handleAddFriend} className="flex gap-12 align-center">
              <input
                type="email"
                className="form-input"
                placeholder="friend@email.com"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
                required
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                Add Friend
              </button>
            </form>
          </div>

          {/* Leaderboard Rankings */}
          <div className="card" style={{ flex: 1, minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
            <span className="card-title" style={{ fontSize: '13px', marginBottom: '16px' }}>
              <span className="flex align-center gap-8"><Trophy size={14} /> Global Leaderboard (Today)</span>
            </span>

            {loading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                Loading Arena Stats...
              </div>
            ) : leaderboard.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No active competition logs. Add a friend to start tracking scores!
              </div>
            ) : (
              <div className="flex flex-column gap-12" style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                {leaderboard.map((player, index) => {
                  const isMe = player.userId === user._id;
                  const rank = index + 1;
                  
                  return (
                    <div 
                      key={player.userId} 
                      className={`flex align-center justify-between`}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        background: isMe ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${isMe ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-color)'}`,
                        transition: 'border-color 0.2s ease',
                      }}
                    >
                      <div className="flex align-center gap-12">
                        {/* Rank Badge */}
                        <div style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: rank === 1 ? '#d97706' : rank === 2 ? '#4b5563' : rank === 3 ? '#b45309' : 'rgba(255, 255, 255, 0.05)',
                          color: rank <= 3 ? '#fff' : 'var(--text-secondary)',
                          fontSize: '11px',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {rank}
                        </div>

                        <div>
                          <div className="flex align-center gap-8">
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {player.name} {isMe && <span style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: 700 }}>(YOU)</span>}
                            </span>
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Tasks: {player.todayTasksCompleted}/{player.todayTasksTotal} completed
                          </span>
                        </div>
                      </div>

                      <div className="flex align-center gap-20">
                        {/* Life Score Display */}
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Life Score</div>
                          <div style={{ 
                            fontSize: '16px', 
                            fontWeight: 800, 
                            color: player.lifeScore >= 85 ? 'var(--color-success)' : player.lifeScore >= 60 ? 'var(--color-warning)' : 'var(--color-danger)'
                          }}>
                            {player.lifeScore}
                          </div>
                        </div>

                        {/* Nudge/Poke interaction */}
                        {!isMe && (
                          <button 
                            onClick={() => handlePoke(player.userId, player.name)}
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '11px', height: '30px' }}
                          >
                            Poke
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Comparative Mode & Progress Meters */}
        <div className="inner-column" style={{ gap: '24px' }}>
          
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <span className="card-title" style={{ fontSize: '13px', marginBottom: '16px' }}>
              <span className="flex align-center gap-8"><Zap size={14} style={{ color: 'var(--color-warning)' }} /> Head-To-Head Duel</span>
            </span>

            {leaderboard.length <= 1 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                Add at least one friend to unlock the side-by-side performance duel.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                
                {/* Friend Selector Dropdown */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Compare With Friend</label>
                  <select 
                    className="form-input" 
                    value={selectedFriendId}
                    onChange={(e) => setSelectedFriendId(e.target.value)}
                  >
                    {leaderboard.filter(f => f.userId !== user._id).map(friend => (
                      <option key={friend.userId} value={friend.userId}>{friend.name} ({friend.email})</option>
                    ))}
                  </select>
                </div>

                {selectedFriend && myStats && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', flex: 1, overflowY: 'auto' }}>
                    
                    {/* Duel stat: Life Score */}
                    <div>
                      <div className="flex justify-between" style={{ fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600 }}>Overall Life Score</span>
                        <span>{myStats.lifeScore} vs {selectedFriend.lifeScore}</span>
                      </div>
                      <div className="flex align-center gap-8">
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '10px', color: 'var(--color-primary)' }}>You</span>
                          <div className="water-progress-bar" style={{ margin: 0, height: '6px' }}>
                            <div className="water-progress-fill" style={{ width: `${myStats.lifeScore}%`, backgroundColor: 'var(--color-primary)' }} />
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '10px', color: '#a855f7' }}>{selectedFriend.name}</span>
                          <div className="water-progress-bar" style={{ margin: 0, height: '6px' }}>
                            <div className="water-progress-fill" style={{ width: `${selectedFriend.lifeScore}%`, backgroundColor: '#a855f7' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Duel stat: Tasks Completed */}
                    {(() => {
                      const myTaskPct = myStats.todayTasksTotal > 0 ? (myStats.todayTasksCompleted / myStats.todayTasksTotal) * 100 : 0;
                      const friendTaskPct = selectedFriend.todayTasksTotal > 0 ? (selectedFriend.todayTasksCompleted / selectedFriend.todayTasksTotal) * 100 : 0;
                      
                      return (
                        <div>
                          <div className="flex justify-between" style={{ fontSize: '12px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 600 }}>Task Completion Rate</span>
                            <span>{Math.round(myTaskPct)}% vs {Math.round(friendTaskPct)}%</span>
                          </div>
                          <div className="flex align-center gap-8">
                            <div style={{ flex: 1 }}>
                              <div className="water-progress-bar" style={{ margin: 0, height: '6px' }}>
                                <div className="water-progress-fill" style={{ width: `${myTaskPct}%`, backgroundColor: 'var(--color-success)' }} />
                              </div>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div className="water-progress-bar" style={{ margin: 0, height: '6px' }}>
                                <div className="water-progress-fill" style={{ width: `${friendTaskPct}%`, backgroundColor: '#a855f7' }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Duel stat: Study Hours */}
                    <div>
                      <div className="flex justify-between" style={{ fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600 }}>Studied Hours Today</span>
                        <span>{myStats.todayStudyHours}h vs {selectedFriend.todayStudyHours}h</span>
                      </div>
                      <div className="flex align-center gap-8">
                        <div style={{ flex: 1 }}>
                          <div className="water-progress-bar" style={{ margin: 0, height: '6px' }}>
                            <div className="water-progress-fill" style={{ width: `${Math.min(100, (myStats.todayStudyHours / 8) * 100)}%`, backgroundColor: 'var(--color-warning)' }} />
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="water-progress-bar" style={{ margin: 0, height: '6px' }}>
                            <div className="water-progress-fill" style={{ width: `${Math.min(100, (selectedFriend.todayStudyHours / 8) * 100)}%`, backgroundColor: '#a855f7' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Duel stat: Sleep score */}
                    <div>
                      <div className="flex justify-between" style={{ fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600 }}>Sleep Quality Score</span>
                        <span>{myStats.todaySleepScore || 'N/A'} vs {selectedFriend.todaySleepScore || 'N/A'}</span>
                      </div>
                      <div className="flex align-center gap-8">
                        <div style={{ flex: 1 }}>
                          <div className="water-progress-bar" style={{ margin: 0, height: '6px' }}>
                            <div className="water-progress-fill" style={{ width: `${myStats.todaySleepScore || 0}%`, backgroundColor: '#3b82f6' }} />
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="water-progress-bar" style={{ margin: 0, height: '6px' }}>
                            <div className="water-progress-fill" style={{ width: `${selectedFriend.todaySleepScore || 0}%`, backgroundColor: '#a855f7' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Duel stat: Dopamine focus */}
                    <div>
                      <div className="flex justify-between" style={{ fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600 }}>Dopamine Focus Index</span>
                        <span>{myStats.todayFocusScore}% vs {selectedFriend.todayFocusScore}%</span>
                      </div>
                      <div className="flex align-center gap-8">
                        <div style={{ flex: 1 }}>
                          <div className="water-progress-bar" style={{ margin: 0, height: '6px' }}>
                            <div className="water-progress-fill" style={{ width: `${myStats.todayFocusScore}%`, backgroundColor: 'var(--color-primary)' }} />
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="water-progress-bar" style={{ margin: 0, height: '6px' }}>
                            <div className="water-progress-fill" style={{ width: `${selectedFriend.todayFocusScore}%`, backgroundColor: '#a855f7' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};

export default Competitive;
