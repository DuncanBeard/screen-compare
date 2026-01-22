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

The site implements client-side security policies via HTML meta tags:

**Implemented via Meta Tags:**
- **Content Security Policy (CSP)**: Restricts resource loading to help prevent XSS attacks
  - `default-src 'self'`: Only allow resources from same origin
  - `script-src 'self'`: Only allow scripts from same origin (no inline scripts)
  - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`: Allow styles from same origin, inline styles, and Google Fonts
- **Referrer Policy**: Controls referrer information sent with requests (`strict-origin-when-cross-origin`)

**Note on HTTP Headers:**
Some security features like `X-Content-Type-Options`, `X-Frame-Options`, and CSP directives such as `frame-ancestors` require actual HTTP response headers and are not effective when set via HTML meta tags. GitHub Pages provides HTTPS enforcement automatically, but for additional HTTP-level security headers (including clickjacking protection), you would need to configure them via a CDN or reverse proxy (e.g., Cloudflare, Netlify).

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

Local development uses HTTP for testing, which works fine with the current CSP configuration:

```bash
npm run serve  # Starts Python HTTP server on http://localhost:8000
```

The site's Content Security Policy is compatible with local HTTP development. HTTPS is automatically enforced in production by GitHub Pages.

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
