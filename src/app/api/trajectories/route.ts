import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('🚀 API Route called:', request.url);
  
  try {
    const { searchParams } = new URL(request.url);
    const dateFilter = searchParams.get('date_filter');
    const stationFilter = searchParams.get('station_filter');
    const deviceFilter = searchParams.get('device_filter');

    console.log('📋 Query params:', { dateFilter, stationFilter, deviceFilter });

    // Build URL with query parameters
    let apiUrl = 'https://radio-test-backend.vercel.app/api/trajectories';
    const params = new URLSearchParams();
    
    if (dateFilter) params.append('date_filter', dateFilter);
    if (stationFilter) params.append('station_filter', stationFilter);
    if (deviceFilter) params.append('device_filter', deviceFilter);
    
    if (params.toString()) {
      apiUrl += `?${params.toString()}`;
    }

    console.log('🔗 Calling backend:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📡 Backend response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Backend data received');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ API route error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch trajectories',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}