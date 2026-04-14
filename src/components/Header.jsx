import { useState, useRef, useEffect } from 'react';
import { Search, Bell, LogOut, Key, ChevronDown, User, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';
import './Header.css';

export default function Header({ title, subtitle }) {
  const { user, logout, changePassword } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (!pwForm.current) { setPwError('Please enter your current password'); return; }
    if (!pwForm.new) { setPwError('Please enter a new password'); return; }
    if (pwForm.new.length < 6) { setPwError('New password must be at least 6 characters'); return; }
    if (pwForm.new !== pwForm.confirm) { setPwError('New passwords do not match'); return; }
    if (pwForm.current === pwForm.new) { setPwError('New password must be different from current'); return; }

    setPwLoading(true);
    try {
      const result = await changePassword(pwForm.current, pwForm.new);
      if (result.success) {
        setPwSuccess('Password changed successfully!');
        setPwForm({ current: '', new: '', confirm: '' });
        setTimeout(() => {
          setShowPasswordModal(false);
          setPwSuccess('');
        }, 1500);
      } else {
        setPwError(result.error);
      }
    } catch (err) {
      setPwError('Failed to change password. Please try again.');
    } finally {
      setPwLoading(false);
    }
  };

  const getPasswordStrength = (pw) => {
    if (!pw) return { label: '', color: '', width: '0%' };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { label: 'Weak', color: '#EF4444', width: '20%' };
    if (score <= 2) return { label: 'Fair', color: '#F59E0B', width: '40%' };
    if (score <= 3) return { label: 'Good', color: '#3B82F6', width: '60%' };
    if (score <= 4) return { label: 'Strong', color: '#10B981', width: '80%' };
    return { label: 'Excellent', color: '#059669', width: '100%' };
  };

  const strength = getPasswordStrength(pwForm.new);

  return (
    <>
      <header className="header">
        <div className="header-left">
          <div className="header-page-info">
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </div>

        <div className="header-search">
          <Search className="header-search-icon" />
          <input type="text" placeholder="Search leads, companies, events..." />
        </div>

        <div className="header-right">
          <button className="header-notification-btn">
            <Bell size={20} />
            <span className="header-notification-dot" />
          </button>

          <div className="header-user-container" ref={dropdownRef}>
            <div className="header-user" onClick={() => setShowDropdown(!showDropdown)}>
              <div className="header-user-avatar" style={{ background: user?.avatar || '#10B981' }}>{user?.initials || 'SB'}</div>
              <div className="header-user-info">
                <span className="header-user-name">{user?.name || 'User'}</span>
                <span className="header-user-role">{user?.role || 'Admin'}</span>
              </div>
              <ChevronDown size={14} className={`header-chevron ${showDropdown ? 'open' : ''}`} />
            </div>

            {showDropdown && (
              <div className="header-dropdown">
                <div className="header-dropdown-header">
                  <div className="header-dropdown-avatar" style={{ background: user?.avatar || '#10B981' }}>{user?.initials || 'SB'}</div>
                  <div>
                    <div className="header-dropdown-name">{user?.name}</div>
                    <div className="header-dropdown-email">{user?.email}</div>
                  </div>
                </div>
                <div className="header-dropdown-divider" />
                <button className="header-dropdown-item" onClick={() => {
                  setShowDropdown(false);
                  setShowPasswordModal(true);
                  setPwForm({ current: '', new: '', confirm: '' });
                  setPwError('');
                  setPwSuccess('');
                }}>
                  <Key size={14} />
                  Change Password
                </button>
                <div className="header-dropdown-divider" />
                <button className="header-dropdown-item header-dropdown-logout" onClick={() => { setShowDropdown(false); logout(); }}>
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="pw-modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="pw-modal" onClick={e => e.stopPropagation()}>
            <div className="pw-modal-header">
              <div className="pw-modal-icon">
                <Key size={20} />
              </div>
              <div>
                <h3>Change Password</h3>
                <p>Update your account password</p>
              </div>
              <button className="pw-modal-close" onClick={() => setShowPasswordModal(false)}>×</button>
            </div>

            <form onSubmit={handlePasswordChange} className="pw-modal-body">
              {pwError && (
                <div className="pw-alert pw-alert-error">
                  <AlertCircle size={14} />
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="pw-alert pw-alert-success">
                  <CheckCircle size={14} />
                  {pwSuccess}
                </div>
              )}

              <div className="pw-field">
                <label>Current Password</label>
                <div className="pw-input-wrap">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={pwForm.current}
                    onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                    placeholder="Enter current password"
                    autoFocus
                  />
                  <button type="button" className="pw-eye-btn" onClick={() => setShowCurrent(!showCurrent)}>
                    {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="pw-field">
                <label>New Password</label>
                <div className="pw-input-wrap">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={pwForm.new}
                    onChange={e => setPwForm(p => ({ ...p, new: e.target.value }))}
                    placeholder="Enter new password (min 6 chars)"
                  />
                  <button type="button" className="pw-eye-btn" onClick={() => setShowNew(!showNew)}>
                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {pwForm.new && (
                  <div className="pw-strength">
                    <div className="pw-strength-bar">
                      <div className="pw-strength-fill" style={{ width: strength.width, background: strength.color }} />
                    </div>
                    <span style={{ color: strength.color }}>{strength.label}</span>
                  </div>
                )}
              </div>

              <div className="pw-field">
                <label>Confirm New Password</label>
                <div className="pw-input-wrap">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={pwForm.confirm}
                    onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="Re-enter new password"
                  />
                  <button type="button" className="pw-eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {pwForm.confirm && pwForm.new && (
                  <div className="pw-match-indicator">
                    {pwForm.new === pwForm.confirm ? (
                      <span className="pw-match-yes"><CheckCircle size={12} /> Passwords match</span>
                    ) : (
                      <span className="pw-match-no"><AlertCircle size={12} /> Passwords don't match</span>
                    )}
                  </div>
                )}
              </div>

              <div className="pw-modal-footer">
                <button type="button" className="pw-btn-cancel" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                <button type="submit" className="pw-btn-save" disabled={pwLoading}>
                  {pwLoading ? <span className="pw-spinner" /> : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
