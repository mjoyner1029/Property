import React, { useState, useEffect } from 'react';
import { useDemoAuth } from '../providers/DemoAuthProvider';
import { updateDemoConfig, getDemoConfig } from '../mocks/handlers';
import { getDB, resetDB } from '../data/persist';

// Styles for the demo panel
const styles = {
  panelContainer: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    background: 'rgba(0, 0, 0, 0.85)',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    color: 'white',
    zIndex: 9999,
    width: '300px',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    transition: 'transform 0.3s ease',
    backdropFilter: 'blur(5px)',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
  },
  panelTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
  },
  panelContent: {
    padding: '16px',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  section: {
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '8px',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  button: {
    background: '#4a4a4a',
    border: 'none',
    borderRadius: '4px',
    color: 'white',
    cursor: 'pointer',
    padding: '8px 12px',
    margin: '0 8px 8px 0',
    fontSize: '14px',
    transition: 'background 0.2s ease',
  },
  activeButton: {
    background: '#2563eb',
  },
  slider: {
    width: '100%',
    marginBottom: '8px',
  },
  sliderLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  toggle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  resetButton: {
    background: '#dc2626',
    border: 'none',
    borderRadius: '4px',
    color: 'white',
    cursor: 'pointer',
    padding: '8px 12px',
    fontSize: '14px',
    width: '100%',
    marginTop: '8px',
  },
  minimizedPanel: {
    transform: 'translateX(calc(100% - 40px))',
  },
  badge: {
    background: '#2563eb',
    borderRadius: '20px',
    padding: '2px 8px',
    fontSize: '12px',
    fontWeight: '600',
  },
  userInfo: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '12px',
  },
  roleLabel: {
    textTransform: 'capitalize',
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    marginLeft: '6px',
  },
};

// Role-specific badge colors
const getRoleBadgeStyle = (role) => {
  const baseStyle = {
    ...styles.roleLabel,
  };
  
  switch (role) {
    case 'admin':
      return { ...baseStyle, background: '#dc2626' };
    case 'landlord':
      return { ...baseStyle, background: '#2563eb' };
    case 'tenant':
      return { ...baseStyle, background: '#16a34a' };
    default:
      return { ...baseStyle, background: '#6b7280' };
  }
};

export const DemoPanel = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, switchUser } = useDemoAuth();
  
  // Get initial demo config
  const [demoConfig, setDemoConfig] = useState(getDemoConfig());
  const [debugInfo, setDebugInfo] = useState({});
  
  // Get debug info on mount and periodically
  useEffect(() => {
    const updateDebugInfo = () => {
      const db = getDB();
      const info = {
        dbInitialized: !!db,
        userCount: db?.users?.length || 0,
        propertiesCount: db?.properties?.length || 0,
        authToken: !!localStorage.getItem('demo_access_token'),
        currentUser: user ? `${user.firstName} ${user.lastName} (${user.role})` : 'Not logged in',
      };
      setDebugInfo(info);
    };
    
    // Update immediately and every 2 seconds
    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 2000);
    
    return () => clearInterval(interval);
  }, [user]);
  
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  const handleSwitchUser = async (role) => {
    await switchUser(role);
  };
  
  const handleLatencyChange = (e) => {
    const newLatency = parseInt(e.target.value, 10);
    const newConfig = { ...demoConfig, latency: newLatency };
    updateDemoConfig(newConfig);
    setDemoConfig(newConfig);
  };
  
  const handleErrorRateChange = (e) => {
    const newErrorRate = parseFloat(e.target.value);
    const newConfig = { ...demoConfig, errorRate: newErrorRate };
    updateDemoConfig(newConfig);
    setDemoConfig(newConfig);
  };
  
  const handleToggleErrorMode = () => {
    const newConfig = { ...demoConfig, errorMode: !demoConfig.errorMode };
    updateDemoConfig(newConfig);
    setDemoConfig(newConfig);
  };
  
  const handleToggleSlowNetwork = () => {
    const newConfig = { ...demoConfig, slowNetwork: !demoConfig.slowNetwork };
    updateDemoConfig(newConfig);
    setDemoConfig(newConfig);
  };
  
  const handleResetDemo = () => {
    if (window.confirm('This will reset all demo data to initial state. Continue?')) {
      // Reset DB first
      resetDB();
      // Clear auth tokens
      localStorage.removeItem('demo_access_token');
      localStorage.removeItem('demo_refresh_token');
      window.location.reload();
    }
  };
  
  return (
    <div style={{
      ...styles.panelContainer,
      ...(isCollapsed ? styles.minimizedPanel : {})
    }}>
      <div style={styles.panelHeader} onClick={toggleCollapse}>
        <h3 style={styles.panelTitle}>
          Demo Mode <span style={styles.badge}>Active</span>
        </h3>
        <span>{isCollapsed ? '◀' : '▼'}</span>
      </div>
      
      {!isCollapsed && (
        <div style={styles.panelContent}>
          {/* Current User Section */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Current User</div>
            <div style={styles.userInfo}>
              {user ? (
                <>
                  <div>
                    {user.firstName} {user.lastName}
                    <span style={getRoleBadgeStyle(user.role)}>{user.role}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
                    {user.email}
                  </div>
                </>
              ) : (
                <div>Not logged in</div>
              )}
            </div>
          </div>
          
          {/* Switch User Section */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Switch User Role</div>
            <button
              style={{
                ...styles.button,
                ...(user?.role === 'admin' ? styles.activeButton : {})
              }}
              onClick={() => handleSwitchUser('admin')}
            >
              Admin
            </button>
            <button
              style={{
                ...styles.button,
                ...(user?.role === 'landlord' ? styles.activeButton : {})
              }}
              onClick={() => handleSwitchUser('landlord')}
            >
              Landlord
            </button>
            <button
              style={{
                ...styles.button,
                ...(user?.role === 'tenant' ? styles.activeButton : {})
              }}
              onClick={() => handleSwitchUser('tenant')}
            >
              Tenant
            </button>
          </div>
          
          {/* Network Settings */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>API Settings</div>
            
            {/* Latency Slider */}
            <div>
              <div style={styles.sliderLabel}>
                <span>Latency</span>
                <span>{demoConfig.latency}ms</span>
              </div>
              <input
                type="range"
                min="0"
                max="2000"
                step="50"
                value={demoConfig.latency}
                onChange={handleLatencyChange}
                style={styles.slider}
              />
            </div>
            
            {/* Error Rate Slider */}
            <div>
              <div style={styles.sliderLabel}>
                <span>Random Error Rate</span>
                <span>{Math.round(demoConfig.errorRate * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={demoConfig.errorRate}
                onChange={handleErrorRateChange}
                style={styles.slider}
              />
            </div>
            
            {/* Error Mode Toggle */}
            <div style={styles.toggle}>
              <span>Force Error Mode</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={demoConfig.errorMode}
                  onChange={handleToggleErrorMode}
                />
                <span>{demoConfig.errorMode ? 'On' : 'Off'}</span>
              </label>
            </div>
            
            {/* Debug Info Section */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Debug Info</h3>
              <div style={{ fontSize: '12px', background: '#222', padding: '8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                <div>Database initialized: {debugInfo.dbInitialized ? '✅' : '❌'}</div>
                <div>Users in DB: {debugInfo.userCount}</div>
                <div>Properties in DB: {debugInfo.propertiesCount}</div>
                <div>Auth token exists: {debugInfo.authToken ? '✅' : '❌'}</div>
                <div>Current user: {debugInfo.currentUser}</div>
              </div>
            </div>
            
            {/* Slow Network Toggle */}
            <div style={styles.toggle}>
              <span>Slow Network</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={demoConfig.slowNetwork}
                  onChange={handleToggleSlowNetwork}
                />
                <span>{demoConfig.slowNetwork ? 'On' : 'Off'}</span>
              </label>
            </div>
          </div>
          
          {/* Reset Demo Data */}
          <button
            style={styles.resetButton}
            onClick={handleResetDemo}
          >
            Reset Demo Data
          </button>
        </div>
      )}
    </div>
  );
};

export default DemoPanel;
