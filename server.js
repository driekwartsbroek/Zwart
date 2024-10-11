const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const qbittorrentUrl = process.env.QBITTORRENT_URL || 'http://localhost:8080';

const axiosInstance = axios.create({
  baseURL: qbittorrentUrl,
  withCredentials: true
});

axiosInstance.interceptors.request.use(async (config) => {
  if (!qBittorrentCookie) {
    await loginToQBittorrent();
  }
  if (qBittorrentCookie) {
    config.headers['Cookie'] = qBittorrentCookie;
  }
  return config;
});

let qBittorrentCookie = null;

async function loginToQBittorrent() {
  try {
    const response = await axios.post(`${qbittorrentUrl}/api/v2/auth/login`, null, {
      params: {
        username: process.env.QBITTORRENT_USERNAME,
        password: process.env.QBITTORRENT_PASSWORD
      }
    });
    if (response.data === 'Ok.') {
      console.log('Successfully logged in to qBittorrent');
      qBittorrentCookie = response.headers['set-cookie'];
      return true;
    } else {
      console.error('Login failed');
      return false;
    }
  } catch (error) {
    console.error('Error logging in to qBittorrent:', error.message);
    return false;
  }
}

const path = require('path');

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const response = await axios.post(`${qbittorrentUrl}/api/v2/auth/login`, null, {
      params: { username, password },
      withCredentials: true
    });
    
    // Set the session cookie
    if (response.headers['set-cookie']) {
      res.setHeader('Set-Cookie', response.headers['set-cookie']);
    }
    
    res.json({ success: true, message: 'Login successful' });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Login failed' });
  }
});


app.get('/api/torrents', async (req, res) => {
  try {
    const response = await axios.get(`${qbittorrentUrl}/api/v2/torrents/info`);
    const torrents = response.data;

    // Fetch categories
    const categoriesResponse = await axios.get(`${qbittorrentUrl}/api/v2/torrents/categories`);
    const categories = categoriesResponse.data;

    // Add category information to each torrent
    const torrentsWithCategories = torrents.map(torrent => ({
      ...torrent,
      categoryName: categories[torrent.category] ? categories[torrent.category].name : 'Uncategorized'
    }));

    res.json(torrentsWithCategories);
  } catch (error) {
    console.error('Failed to fetch torrents:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch torrents' });
  }
});

app.get('/api/torrents/:hash/files', async (req, res) => {
  try {
    const response = await axios.get(`${qbittorrentUrl}/api/v2/torrents/files`, {
      params: {
        hash: req.params.hash
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching torrent files:', error);
    res.status(500).json({ error: 'Failed to fetch torrent files' });
  }
});

app.post('/api/torrents/:hash/open-in-explorer', async (req, res) => {
  const { hash } = req.params;
  try {
    const propertiesResponse = await axiosInstance.get('/api/v2/torrents/properties', { params: { hash } });
    const filesResponse = await axiosInstance.get('/api/v2/torrents/files', { params: { hash } });
    
    const savePath = propertiesResponse.data.save_path;
    const torrentName = filesResponse.data[0].name.split('/')[0]; // Get the first folder name
    const fullPath = path.join(savePath, torrentName);

    let command;
    switch (process.platform) {
      case 'win32':
        command = `explorer "${fullPath}"`;
        break;
      case 'darwin':
        command = `open "${fullPath}"`;
        break;
      default:
        command = `xdg-open "${fullPath}"`;
    }

    const { exec } = require('child_process');
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Error opening explorer:', error);
        res.status(500).json({ error: 'Failed to open in explorer', details: error.message });
      } else if (stderr) {
        console.error('Error opening explorer:', stderr);
        res.status(500).json({ error: 'Failed to open in explorer', details: stderr });
      } else {
        res.status(200).json({ message: 'Opened in explorer' });
      }
    });
  } catch (error) {
    console.error('Error getting torrent info:', error);
    res.status(500).json({ error: 'Failed to get torrent info', details: error.message });
  }
});

app.post('/api/logout', async (req, res) => {
  try {
    await axios.post(`${qbittorrentUrl}/api/v2/auth/logout`);
    res.json({ success: true, message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
});

app.post('/api/torrents/:hash/remove', async (req, res) => {
  const { hash } = req.params;
  const { deleteFiles } = req.body;
  try {
    const response = await axiosInstance.post('/api/v2/torrents/delete', `hashes=${hash}&deleteFiles=${deleteFiles ? 'true' : 'false'}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    if (response.status === 200) {
      res.status(200).json({ message: 'Torrent removed successfully' });
    } else {
      res.status(response.status).json({ error: 'Failed to remove torrent', details: response.data });
    }
  } catch (error) {
    console.error('Error removing torrent:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to remove torrent', details: error.response ? error.response.data : error.message });
  }
});

app.post('/api/torrents/:hash/stop', async (req, res) => {
  const { hash } = req.params;
  try {
    console.log(`Attempting to stop torrent with hash: ${hash}`);

    const response = await axiosInstance.post('/api/v2/torrents/pause', `hashes=${hash}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('qBittorrent API response status:', response.status);
    console.log('qBittorrent API response data:', response.data);

    if (response.status === 200) {
      res.status(200).json({ message: 'Torrent stopped successfully' });
    } else {
      console.error('Unexpected response status:', response.status);
      res.status(response.status).json({ error: 'Failed to stop torrent', details: response.data });
    }
  } catch (error) {
    console.error('Error stopping torrent:', error.message);
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
    }
    res.status(error.response ? error.response.status : 500).json({ error: 'Failed to stop torrent', details: error.response ? error.response.data : error.message });
  }
});

app.get('/api/torrents/:hash', async (req, res) => {
  const { hash } = req.params;
  try {
    const response = await axiosInstance.get('/api/v2/torrents/info', {
      params: { hashes: hash }
    });
    console.log('Torrent info response:', response.data);
    if (response.data.length > 0) {
      res.status(200).json(response.data[0]);
    } else {
      res.status(404).json({ error: 'Torrent not found' });
    }
  } catch (error) {
    console.error('Error fetching torrent info:', error.message);
    res.status(500).json({ error: 'Failed to fetch torrent info', details: error.message });
  }
});

app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  await loginToQBittorrent();
});