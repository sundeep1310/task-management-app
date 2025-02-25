import axios from 'axios';

// Simulated streaming data
const MOCK_STREAMING_DATA = [
  {
    id: 'stream1',
    title: 'Building a React App from Scratch',
    author: 'CodeMaster',
    viewers: 1243,
    category: 'Programming',
    tags: ['react', 'javascript', 'webdev']
  },
  {
    id: 'stream2',
    title: 'Database Design Best Practices',
    author: 'DataGuru',
    viewers: 895,
    category: 'Programming',
    tags: ['database', 'sql', 'architecture']
  },
  {
    id: 'stream3',
    title: 'DevOps Pipeline Automation',
    author: 'CloudNinja',
    viewers: 674,
    category: 'DevOps',
    tags: ['ci/cd', 'docker', 'kubernetes']
  }
];

// In a real application, this would fetch data from an actual streaming API like Twitch
export const fetchStreamingData = async () => {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Randomly decide whether to simulate an error (10% chance)
    if (Math.random() < 0.1) {
      throw new Error('Streaming API temporarily unavailable');
    }
    
    // Randomize the viewer count to simulate live data
    return MOCK_STREAMING_DATA.map(stream => ({
      ...stream,
      viewers: Math.floor(stream.viewers * (0.9 + Math.random() * 0.2))
    }));
    
    // In a real application, you would use something like:
    // const response = await axios.get('https://api.twitch.tv/helix/streams', {
    //   headers: {
    //     'Authorization': `Bearer ${process.env.TWITCH_ACCESS_TOKEN}`,
    //     'Client-ID': process.env.TWITCH_CLIENT_ID
    //   }
    // });
    // return response.data;
  } catch (error) {
    console.error('Error fetching streaming data:', error);
    throw error;
  }
};