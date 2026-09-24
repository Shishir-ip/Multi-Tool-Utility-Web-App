// Serverless function to poll download job status from VidKraken API
// This proxies the request to avoid CORS issues

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { jobId, apiKey } = req.query;

    // Validate inputs
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ error: 'API key is required' });
    }

    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({ error: 'Invalid job ID provided' });
    }

    // Poll job status from VidKraken API
    const response = await fetch(`https://vidkraken.com/api/v2/download/${jobId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    const data = await response.json();

    // Handle VidKraken API errors
    if (!response.ok) {
      console.error('VidKraken API error:', data);
      
      if (response.status === 401) {
        return res.status(401).json({ error: 'Invalid API key' });
      }
      if (response.status === 404) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      return res.status(response.status).json({ 
        error: data.message || 'Failed to check job status' 
      });
    }

    // Return successful response
    return res.status(200).json(data);

  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
