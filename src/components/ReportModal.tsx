import { useState, useEffect } from 'react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateReport: (reportData: {
    start_date: string;
    end_date: string;
    station1: string;
    station2: string;
  }) => void;
  stations: string[]; // Add this prop
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onGenerateReport,
  stations, // Receive stations from parent
}) => {
  const [start_date, setstart_date] = useState('');
  const [end_date, setend_date] = useState('');
  const [station1, setStation1] = useState('');
  const [station2, setStation2] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Set default dates to today
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setstart_date(today);
      setend_date(today);
      // Reset station selections when modal opens
      setStation1('');
      setStation2('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!start_date || !end_date || !station1 || !station2) {
      alert('Please fill in all fields');
      return;
    }

    if (station1 === station2) {
      alert('Please select two different stations');
      return;
    }

    setIsGenerating(true);
    try {
      await onGenerateReport({ start_date, end_date, station1, station2 });
      onClose();
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        width: '90%',
        maxWidth: '500px',
        border: '1px solid #e0e0e0',
      }}>
        <h2 style={{ margin: '0 0 1.5rem 0', color: '#333' }}>
          Generate Station Report
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Start Date:
            </label>
            <input
              type="date"
              value={start_date}
              onChange={(e) => setstart_date(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              End Date:
            </label>
            <input
              type="date"
              value={end_date}
              onChange={(e) => setend_date(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Station 1:
            </label>
            <select
              value={station1}
              onChange={(e) => setStation1(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
              }}
              required
            >
              <option value="">Select Station 1</option>
              {stations.map((station) => (
                <option key={station} value={station}>
                  {station}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Station 2:
            </label>
            <select
              value={station2}
              onChange={(e) => setStation2(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
              }}
              required
            >
              <option value="">Select Station 2</option>
              {stations.map((station) => (
                <option key={station} value={station}>
                  {station}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating || stations.length === 0}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: isGenerating ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontSize: '14px',
              }}
            >
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};