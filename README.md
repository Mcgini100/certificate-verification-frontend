# Certificate Verification System Frontend

A modern React frontend for the Certificate Verification System, built with React 18, Tailwind CSS, and advanced UI components.

## Features

### Admin Features
- **Dashboard**: Comprehensive overview with statistics and charts
- **Upload Certificates**: Single and batch upload with processing options
- **Database Management**: View, search, filter, and manage all certificates
- **Verification**: Advanced verification with multiple methods
- **User Management**: Admin-only access to system management

### User Features
- **Dashboard**: Personal verification history and quick actions
- **Certificate Verification**: Upload and verify certificates instantly
- **Detailed Results**: Comprehensive verification reports with confidence scores
- **History Tracking**: Keep track of all verification attempts

### Technical Features
- **Responsive Design**: Mobile-first design that works on all devices
- **Real-time Updates**: Dynamic updates with loading states
- **File Handling**: Drag-and-drop file uploads with validation
- **Data Visualization**: Charts and graphs for analytics
- **Security**: Client-side validation and secure API integration
- **Accessibility**: WCAG compliant with proper ARIA labels

## Technology Stack

- **React 18** - Latest React with hooks and concurrent features
- **React Router 6** - Modern routing with data loading
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Recharts** - Beautiful and responsive charts
- **Lucide React** - Modern icon library
- **React Hook Form** - Performant forms with validation
- **React Dropzone** - File upload with drag and drop
- **Axios** - HTTP client for API calls
- **React Toastify** - Toast notifications

## Setup Instructions

### Prerequisites
- Node.js 16 or higher
- npm or yarn package manager
- Certificate Verification API running on port 8000

### Installation

1. **Create React App and Install Dependencies**
```bash
# Create new React app
npx create-react-app certificate-verification-frontend
cd certificate-verification-frontend

# Install all dependencies
npm install react-router-dom@^6.3.0 axios@^1.4.0 lucide-react@^0.263.1 tailwindcss@^3.3.0 autoprefixer@^10.4.14 postcss@^8.4.24 react-toastify@^9.1.3 react-hook-form@^7.45.1 react-dropzone@^14.2.3 date-fns@^2.30.0 recharts@^2.7.2 framer-motion@^10.12.18

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

2. **Replace/Create Files**

Copy all the provided files into your project structure:

```
src/
├── components/
│   ├── Layout/
│   │   └── Layout.js
│   └── common/
│       ├── FileUpload.js
│       ├── LoadingSpinner.js
│       └── Modal.js
├── contexts/
│   └── AuthContext.js
├── pages/
│   ├── admin/
│   │   ├── AdminDashboard.js
│   │   ├── AdminUpload.js
│   │   ├── AdminDatabase.js
│   │   └── AdminVerify.js
│   ├── auth/
│   │   ├── LoginPage.js
│   │   └── SignupPage.js
│   ├── user/
│   │   ├── UserDashboard.js
│   │   └── UserVerify.js
│   ├── LandingPage.js
│   └── NotFoundPage.js
├── services/
│   └── api.js
├── App.js
├── index.js
└── index.css
```

3. **Update package.json**
Replace the content of `package.json` with the provided package.json file.

4. **Configure Tailwind CSS**
Replace `tailwind.config.js` and `postcss.config.js` with the provided configuration files.

5. **Update Styles**
Replace `src/index.css` with the provided CSS file that includes Tailwind imports and custom styles.

### Environment Configuration

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://localhost:8000/api/v1
REACT_APP_APP_NAME=CertVerify
```

### Running the Application

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

The application will be available at `http://localhost:3000`

## Default Login Credentials

### Admin Access
- **Email**: admin@admin.com
- **Password**: admin123

### User Access
- **Email**: user@user.com
- **Password**: user123

*Note: These are demo credentials. In production, implement proper authentication.*

## Project Structure

```
certificate-verification-frontend/
├── public/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout/          # Layout components
│   │   └── common/          # Common components
│   ├── contexts/            # React context providers
│   ├── pages/               # Page components
│   │   ├── admin/           # Admin-only pages
│   │   ├── auth/            # Authentication pages
│   │   └── user/            # User pages
│   ├── services/            # API services
│   ├── App.js               # Main app component
│   ├── index.js             # App entry point
│   └── index.css            # Global styles
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## Key Features Implementation

### Authentication System
- Context-based auth state management
- Role-based access control (admin/user)
- Protected routes with automatic redirects
- Persistent login sessions

### File Upload System
- Drag and drop interface
- File type validation
- Size limit enforcement
- Preview functionality
- Progress indicators

### API Integration
- Centralized API service
- Error handling and retry logic
- Request/response interceptors
- Loading states management

### UI/UX Features
- Responsive design for all screen sizes
- Dark/light mode support via Tailwind
- Smooth animations and transitions
- Toast notifications for user feedback
- Modal dialogs for detailed views

### Data Visualization
- Interactive charts with Recharts
- Real-time data updates
- Responsive chart layouts
- Multiple chart types (bar, pie, line)

## Customization

### Styling
- Modify `tailwind.config.js` for custom colors and themes
- Update `src/index.css` for global styles
- Use Tailwind utility classes for component styling

### API Configuration
- Update `src/services/api.js` for different backend URLs
- Modify request/response interceptors
- Add new API endpoints as needed

### Components
- All components are modular and reusable
- Props-based configuration for flexibility
- Consistent naming conventions
- TypeScript support can be added

## Production Deployment

### Build Optimization
```bash
npm run build
```

### Environment Variables
Set production environment variables:
- `REACT_APP_API_URL`: Production API URL
- `REACT_APP_APP_NAME`: Application name

### Deployment Options
- **Static Hosting**: Netlify, Vercel, GitHub Pages
- **CDN**: AWS CloudFront, Azure CDN
- **Container**: Docker with nginx
- **Traditional**: Apache/nginx server

### Performance Considerations
- Code splitting implemented with React.lazy
- Image optimization for certificates
- Caching strategies for API calls
- Bundle size optimization

## Troubleshooting

### Common Issues
1. **API Connection Errors**: Check if backend is running on port 8000
2. **Build Failures**: Ensure all dependencies are installed correctly
3. **Styling Issues**: Verify Tailwind CSS is configured properly
4. **Route Issues**: Check React Router configuration

### Debug Mode
Add to `.env` for debugging:
```env
REACT_APP_DEBUG=true
```

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing
1. Follow the existing code structure
2. Use consistent naming conventions
3. Add proper error handling
4. Write clear component documentation
5. Test on multiple screen sizes

## License
This project is part of the Certificate Verification System. See the main project LICENSE for details.