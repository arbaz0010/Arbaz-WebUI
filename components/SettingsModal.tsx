
import React, { useState } from 'react';
import { X, Moon, Sun, Check, Cpu, SlidersHorizontal, Shield, Activity, Zap, Settings as SettingsIcon } from './Icon';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'params' | 'advanced'>('general');
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  // Sync when opening
  React.useEffect(() => {
    if (isOpen) setLocalSettings(settings);
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleChange = (key: keyof AppSettings, value: any) => {
    if (['temperature', 'topP', 'topK', 'minP', 'maxTokens', 'repeatPenalty', 'repeatLastN', 'presencePenalty', 'frequencyPenalty', 'seed', 'mirostat', 'mirostatTau', 'mirostatEta'].includes(key)) {
       value = Number(value);
    }
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const renderSlider = (label: string, key: keyof AppSettings, min: number, max: number, step: number, helpText?: string) => (
    <div style={{ marginBottom: '1.5rem' }}>
      <div className="flex justify-between items-center mb-2">
         <label className="text-sm font-medium">{label}</label>
         <div className="flex items-center gap-2">
            <input
                type="number"
                value={localSettings[key] as number}
                onChange={(e) => handleChange(key, e.target.value)}
                style={{ width: '4rem', padding: '0.25rem', textAlign: 'right', fontSize: '0.75rem', borderRadius: '0.25rem', border: '1px solid var(--border)', fontFamily: 'monospace' }}
            />
         </div>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step}
        value={localSettings[key] as number}
        onChange={(e) => handleChange(key, e.target.value)}
        style={{ width: '100%', height: '0.375rem', borderRadius: '0.5rem', cursor: 'pointer', accentColor: 'var(--primary)' }}
      />
      {helpText && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}
    </div>
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        
        {/* Header */}
        <div className="modal-header">
          <h2 className="font-bold text-lg">Settings</h2>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Layout */}
        <div className="modal-body">
            {/* Sidebar Tabs */}
            <div className="modal-sidebar">
               {[
                 { id: 'general', label: 'General', icon: Zap },
                 { id: 'params', label: 'Parameters', icon: SlidersHorizontal },
                 { id: 'advanced', label: 'Advanced', icon: Activity },
               ].map((tab) => (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`modal-tab ${activeTab === tab.id ? 'active' : ''}`}
                 >
                    <tab.icon size={16} />
                    {tab.label}
                 </button>
               ))}
            </div>

            {/* Content Area */}
            <div className="modal-panel">
              
              {activeTab === 'general' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                     <h3 className="text-xs font-bold uppercase text-gray-500">Appearance</h3>
                     <div className="flex gap-4">
                        <label 
                            style={{ 
                                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem', borderRadius: '0.75rem', 
                                border: localSettings.theme === 'light' ? '2px solid var(--primary)' : '2px solid var(--border)',
                                cursor: 'pointer', backgroundColor: localSettings.theme === 'light' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                            }}
                        >
                           <input type="radio" name="theme" className="hidden" onChange={() => handleChange('theme', 'light')} checked={localSettings.theme === 'light'} />
                           <Sun size={24} style={{ color: localSettings.theme === 'light' ? 'var(--primary)' : 'gray' }} />
                           <span className="text-sm font-medium">Light</span>
                        </label>
                        <label 
                            style={{ 
                                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem', borderRadius: '0.75rem', 
                                border: localSettings.theme === 'dark' ? '2px solid var(--primary)' : '2px solid var(--border)',
                                cursor: 'pointer', backgroundColor: localSettings.theme === 'dark' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                            }}
                        >
                           <input type="radio" name="theme" className="hidden" onChange={() => handleChange('theme', 'dark')} checked={localSettings.theme === 'dark'} />
                           <Moon size={24} style={{ color: localSettings.theme === 'dark' ? 'var(--primary)' : 'gray' }} />
                           <span className="text-sm font-medium">Dark</span>
                        </label>
                     </div>
                   </div>

                   <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                     <h3 className="text-xs font-bold uppercase text-gray-500">Backend</h3>
                     <select 
                        value={localSettings.backend}
                        onChange={(e) => handleChange('backend', e.target.value)}
                        style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'transparent' }}
                     >
                        <option value="api">External API (llama.cpp server)</option>
                        <option value="browser">In-Browser (WASM / WebGPU)</option>
                        <option value="mock">Mock (Demo Mode)</option>
                     </select>
                     
                     {localSettings.backend === 'api' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                           <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">API Endpoint</label>
                              <input
                                type="text"
                                value={localSettings.apiUrl}
                                onChange={(e) => handleChange('apiUrl', e.target.value)}
                                style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontFamily: 'monospace' }}
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">API Key</label>
                              <input
                                type="password"
                                value={localSettings.apiKey}
                                onChange={(e) => handleChange('apiKey', e.target.value)}
                                style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontFamily: 'monospace' }}
                                placeholder="sk-..."
                              />
                           </div>
                        </div>
                     )}
                   </div>

                   <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                     <h3 className="text-xs font-bold uppercase text-gray-500">System Prompt</h3>
                     <textarea
                        value={localSettings.systemPrompt}
                        onChange={(e) => handleChange('systemPrompt', e.target.value)}
                        rows={3}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', resize: 'none' }}
                      />
                   </div>
                </div>
              )}

              {activeTab === 'params' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                    {renderSlider("Temperature", "temperature", 0, 2, 0.1, "Controls randomness. 0.8 is creative, 0.2 is focused.")}
                    {renderSlider("Top P", "topP", 0, 1, 0.05, "Nucleus sampling. Lower values limit the token set.")}
                    {renderSlider("Top K", "topK", 0, 100, 1, "Limits vocabulary to the top K tokens.")}
                    {renderSlider("Max Tokens", "maxTokens", 256, 8192, 256, "Maximum length of the generated response.")}
                </div>
              )}

              {activeTab === 'advanced' && (
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                        {renderSlider("Repeat Penalty", "repeatPenalty", 1, 1.5, 0.05, "Penalize repetitive tokens.")}
                        {renderSlider("Repeat Last N", "repeatLastN", 0, 2048, 64, "Context window for repetition check.")}
                        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                            {renderSlider("Mirostat Tau", "mirostatTau", 0, 10, 0.5, "Target entropy for Mirostat sampling.")}
                            {renderSlider("Mirostat Eta", "mirostatEta", 0, 1, 0.05, "Learning rate for Mirostat.")}
                        </div>
                 </div>
              )}

            </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', backgroundColor: 'var(--bg-body)' }}>
          <button
            onClick={onClose}
            style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 500 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 500, backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Check size={16} />
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
