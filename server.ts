import express from 'express';
import { createServer as createViteServer } from 'vite';
import cookieParser from 'cookie-parser';
import path from 'path';
import { execSync } from 'child_process';

const app = express();
const PORT = 3000;

app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));

// GitHub OAuth Routes
app.get('/api/auth/github/url', (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: 'GITHUB_CLIENT_ID is not configured' });
    }
    const redirectUri = (req.query.redirect_uri as string) || `${process.env.APP_URL}/api/auth/github/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'repo read:user',
    });
    res.json({ url: `https://github.com/login/oauth/authorize?${params}` });
  });

  app.get(['/api/auth/github/callback', '/api/auth/github/callback/'], async (req, res) => {
    const { code } = req.query;
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!code || typeof code !== 'string') {
      return res.status(400).send('No code provided');
    }

    try {
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.access_token) {
        res.cookie('github_token', tokenData.access_token, {
          secure: true,
          sameSite: 'none',
          httpOnly: true,
          path: '/',
        });

        res.send(`
          <html>
            <body>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                  window.close();
                } else {
                  window.location.href = '/';
                }
              </script>
              <p>Authentication successful. This window should close automatically.</p>
            </body>
          </html>
        `);
      } else {
        res.status(400).send('Failed to get access token');
      }
    } catch (error) {
      console.error('OAuth error:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  app.get('/api/github/repos', async (req, res) => {
    const token = req.cookies.github_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    try {
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=10', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch repos');
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch repositories' });
    }
  });

  app.get('/api/github/user', async (req, res) => {
    const token = req.cookies.github_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch user');
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  app.post('/api/auth/github/logout', (req, res) => {
    res.clearCookie('github_token', {
      secure: true,
      sameSite: 'none',
      httpOnly: true,
      path: '/',
    });
    res.json({ success: true });
  });

  app.post('/api/github/clone', async (req, res) => {
    const token = req.cookies.github_token;
    const { fullName } = req.body;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    if (!fullName) return res.status(400).json({ error: 'Repository name required' });

    try {
      const tarballUrl = `https://api.github.com/repos/${fullName}/tarball`;
      const cmd = `curl -sL -H "Authorization: Bearer ${token}" -H "Accept: application/vnd.github.v3+json" ${tarballUrl} | tar -xz --strip-components=1 -C ${process.cwd()}`;
      execSync(cmd, { stdio: 'inherit' });
      res.json({ success: true });
    } catch (error) {
      console.error('Clone error:', error);
      res.status(500).json({ error: 'Failed to clone repository' });
    }
  });

  // Add a route to download the current project as a ZIP file
  app.get('/api/download-zip', (req, res) => {
    try {
      // Create a temporary zip file
      const zipPath = path.join('/tmp', 'project-export.zip');
      
      // Use npx archiver-cli to compress the current directory
      // We'll just zip the src, public, and config files to avoid node_modules
      execSync(`npx -y archiver-cli "src/**/*" "public/**/*" "package.json" "package-lock.json" "vite.config.ts" "server.ts" "index.html" "tailwind.config.js" "postcss.config.js" ".env.example" --out-file=${zipPath}`);
      
      res.download(zipPath, 'ai-studio-project.zip', (err) => {
        if (err) {
          console.error('Error sending zip file:', err);
        }
        // Clean up the temp file after sending
        try {
          execSync(`rm ${zipPath}`);
        } catch (e) {
          // Ignore cleanup errors
        }
      });
    } catch (error) {
      console.error('Error creating zip:', error);
      res.status(500).send('Failed to create zip file');
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    }).then((vite) => {
      app.use(vite.middlewares);
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

export default app;
