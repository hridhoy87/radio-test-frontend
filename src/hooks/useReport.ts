import { useState } from 'react';

export const useReport = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateStationReport = async (reportData: {
    start_date: string;
    end_date: string;
    station1: string;
    station2: string;
  }) => {
    setIsGenerating(true);
    try {
      // Use local API route instead of direct backend call
      const res = await fetch('/api/download-station-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Report request failed (${res.status}): ${text}`);
      }

      // Get filename from headers, fallback if missing
      const cd = res.headers.get('content-disposition') || '';
      const m = /filename="?([^"]+)"?/i.exec(cd);
      const filename = m?.[1] ?? `radio_report_${reportData.station1}_${reportData.station2}.xlsx`;

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateStationReport, isGenerating };
};