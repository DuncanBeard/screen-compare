# dbeard.dev

Personal landing page and utilities hosted at [dbeard.dev](https://dbeard.dev)

## Features

### Screen PPI Comparison Tool
Compare display specifications, pixel density, and effective resolution across multiple screens. Features include:
- Calculate PPI (Pixels Per Inch) for any display
- Compare multiple screens side-by-side
- Visual size comparison with scaling
- Physical vs. effective resolution modes
- Device presets (MacBook Pro, iMac, Studio Display, etc.)
- Save and share configurations

## HTTPS Configuration

This site is secured with HTTPS through GitHub Pages, which provides:

### Automatic HTTPS
- **Let's Encrypt SSL Certificate**: GitHub Pages automatically provisions and renews SSL certificates
- **Custom Domain Support**: HTTPS is enabled for the custom domain `dbeard.dev`
- **Forced HTTPS**: All HTTP traffic is automatically redirected to HTTPS

### Security Headers
The site implements multiple security headers via HTML meta tags:
- **Content Security Policy (CSP)**: Restricts resource loading to prevent XSS attacks
- **upgrade-insecure-requests**: Automatically upgrades HTTP requests to HTTPS
- **X-Content-Type-Options**: Prevents MIME-sniffing attacks
- **X-Frame-Options**: Protects against clickjacking
- **Referrer Policy**: Controls referrer information sent with requests

### Enabling HTTPS on GitHub Pages

If you fork this repository:

1. **Set up custom domain** (optional):
   - Update the `CNAME` file with your domain
   - Configure DNS with a CNAME record pointing to `<username>.github.io`

2. **Enable HTTPS in repository settings**:
   - Go to repository Settings → Pages
   - Under "Custom domain", verify your domain is listed
   - Check "Enforce HTTPS" checkbox
   - Wait a few minutes for SSL certificate provisioning

3. **Verify HTTPS**:
   - Visit your site at `https://yourdomain.com`
   - Check for the padlock icon in the browser address bar
   - Use [SSL Labs](https://www.ssllabs.com/ssltest/) to verify SSL configuration

### Local Development

Local development uses HTTP (not HTTPS) for testing:

```bash
npm run serve  # Starts Python HTTP server on http://localhost:8000
```

If you need HTTPS for local testing:

```bash
# Install mkcert for local SSL certificates
brew install mkcert  # macOS
# or
apt install mkcert   # Ubuntu/Debian

# Create local certificate authority
mkcert -install

# Create certificate for localhost
mkcert localhost 127.0.0.1 ::1
```

## Development

```bash
# Install dependencies
npm install

# Run local server
npm run serve

# Run tests
npm test

# Run tests with UI
npm run test:ui
```

## Tech Stack

- **Frontend**: Vanilla JavaScript (no framework)
- **Styling**: Custom CSS with CSS variables
- **Testing**: Playwright
- **Hosting**: GitHub Pages
- **SSL/TLS**: Let's Encrypt (via GitHub Pages)
- **Custom Domain**: dbeard.dev

## License

ISC

## Author

Duncan Beard - [hello@dbeard.dev](mailto:hello@dbeard.dev)
