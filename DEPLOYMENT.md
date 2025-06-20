# VirtualDoc Deployment Guide

## Prerequisites

Before deploying, ensure you have:

1. **Supabase Project**: Already configured with your database schema
2. **API Keys**: 
   - Google Gemini API key
   - ElevenLabs API key (optional)
   - Tavus API key (optional)
3. **Domain**: For production deployment

## Environment Variables

Create a `.env.production` file with:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Services
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key
VITE_TAVUS_API_KEY=your_tavus_api_key

# App Configuration
VITE_APP_NAME=VirtualDoc
VITE_APP_VERSION=1.0.0
```

## Deployment Options

### Option 1: Netlify (Recommended for Frontend)

**Pros:**
- Easy deployment from Git
- Automatic builds on push
- Built-in CDN
- Custom domains
- Serverless functions support

**Steps:**
1. Push your code to GitHub/GitLab
2. Connect repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables in Netlify dashboard

**Netlify Configuration:**
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 2: Vercel

**Pros:**
- Excellent React/Vite support
- Edge functions
- Automatic deployments
- Great performance

**Steps:**
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in project directory
3. Follow prompts to deploy
4. Add environment variables in Vercel dashboard

### Option 3: AWS Amplify

**Pros:**
- Full AWS integration
- Scalable hosting
- CI/CD pipeline
- Custom domains

### Option 4: Self-Hosted (VPS/Cloud Server)

**For production control:**

```dockerfile
# Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
    }
}
```

## Production Optimizations

### 1. Build Optimization
```json
// vite.config.ts additions
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react'],
          supabase: ['@supabase/supabase-js'],
          ai: ['@google/generative-ai']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
```

### 2. Security Headers
```javascript
// _headers (for Netlify)
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://api.elevenlabs.io https://tavusapi.com https://generativelanguage.googleapis.com;
```

### 3. Performance Monitoring
Consider adding:
- Google Analytics or Plausible
- Sentry for error tracking
- Web Vitals monitoring

## Database Considerations

Your Supabase setup is production-ready, but consider:

1. **Backup Strategy**: Enable point-in-time recovery
2. **Scaling**: Monitor database performance
3. **Security**: Review RLS policies
4. **Monitoring**: Set up alerts for critical metrics

## Domain and SSL

1. **Custom Domain**: Configure in your hosting provider
2. **SSL Certificate**: Automatically provided by most hosts
3. **DNS Configuration**: Point your domain to hosting provider

## Monitoring and Maintenance

### Health Checks
```javascript
// Add to your app for monitoring
const healthCheck = {
  supabase: () => supabase.from('profiles').select('count').limit(1),
  gemini: () => geminiService.generateResponse('test'),
  // Add other service checks
};
```

### Error Boundaries
```jsx
// Add error boundaries for production
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

## Cost Considerations

### Supabase
- Free tier: 500MB database, 2GB bandwidth
- Pro tier: $25/month for production features

### Hosting
- Netlify: Free tier available, Pro at $19/month
- Vercel: Free tier available, Pro at $20/month
- AWS Amplify: Pay-as-you-go pricing

### AI Services
- Google Gemini: Pay per API call
- ElevenLabs: Subscription-based
- Tavus: Usage-based pricing

## Recommended Production Setup

1. **Frontend**: Netlify or Vercel
2. **Backend**: Supabase (already configured)
3. **Domain**: Custom domain with SSL
4. **Monitoring**: Basic analytics and error tracking
5. **CI/CD**: Automatic deployments from Git

This setup provides a robust, scalable foundation for your telemedicine platform while keeping costs manageable.