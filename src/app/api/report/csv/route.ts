import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('🚀 CSV API Route called:', request.url);
  
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('device_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    console.log('📋 CSV Query params:', { deviceId, startDate, endDate });

    // Build URL with query parameters
    let apiUrl = 'https://radio-test-backend.vercel.app/report/csv';
    const params = new URLSearchParams();
    
    if (deviceId) params.append('device_id', deviceId);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    if (params.toString()) {
      apiUrl += `?${params.toString()}`;
    }

    console.log('🔗 Calling CSV backend:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📡 CSV Backend response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ CSV Backend data received');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ CSV API route error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate CSV report',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}