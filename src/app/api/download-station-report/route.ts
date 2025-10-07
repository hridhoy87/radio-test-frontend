import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const reportData = await request.json();
    
    console.log('🚀 Station Report API Route called with:', reportData);

    const response = await fetch('https://radio-test-backend.vercel.app/api/download-station-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    });

    console.log('📡 Backend response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    // Get the blob and headers from the backend
    const blob = await response.blob();
    const contentType = response.headers.get('content-type');
    const contentDisposition = response.headers.get('content-disposition');

    console.log('✅ Station report generated successfully');

    // Return the blob with appropriate headers
    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': contentDisposition || `attachment; filename="station_report.xlsx"`,
      },
    });
  } catch (err: unknown) {
  // Optional: log the raw error for observability
  console.error("download-station-report failed:", err);

  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
      ? err
      : JSON.stringify(err);

  return NextResponse.json(
    {
      error: "Failed to generate station report",
      details: message,
    },
    { status: 500 }
  );
}
}