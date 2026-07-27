import React, { useState } from 'react';

export default function LicenseModal({ isOpen, onClose, track, onSubmitLicense }) {
  const [formData, setFormData] = useState({
    supervisorName: '', company: '', projectTitle: '', email: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitLicense(track.id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-950 border border-cyan-500/30 p-8 rounded-xl max-w-md w-full shadow-2xl shadow-cyan-500/10">
        <h3 className="text-2xl font-bold text-white mb-2">Secure License</h3>
        <p className="text-zinc-400 text-sm mb-6">
          Requesting license for: <span className="text-cyan-400 font-medium">{track?.title}</span>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {['supervisorName', 'company', 'projectTitle', 'email'].map((field, idx) => (
            <div key={idx}>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                {field.replace(/([A-Z])/g, ' ').trim()}
              </label>
              <input 
                type={field === 'email' ? 'email' : 'text'} required
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                value={formData[field]}
                onChange={(e) => setFormData({...formData, [field]: e.target.value})}
              />
            </div>
          ))}
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="w-1/2 border border-zinc-800 text-zinc-400 py-2 rounded text-sm hover:bg-zinc-900">Cancel</button>
            <button type="submit" className="w-1/2 bg-cyan-500 text-black font-bold py-2 rounded text-sm hover:bg-cyan-400 shadow-lg shadow-cyan-500/20">Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
}