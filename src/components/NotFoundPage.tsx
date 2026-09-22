import React from 'react';

export const NotFoundPage: React.FC = () => {
  const goHome = () => {
    window.history.pushState({}, '', '/');
    // Dispatch popstate so the app re-renders
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      goHome();
    }
  };

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        {/* Animated 404 Number */}
        <div className="not-found-number">
          <span className="not-found-digit">4</span>
          <span className="not-found-digit not-found-digit-center">0</span>
          <span className="not-found-digit">4</span>
        </div>

        {/* Error Message */}
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-description">
          Oops! The page you're looking for doesn't exist or may have been moved.
        </p>

        {/* Action Buttons */}
        <div className="not-found-actions">
          <button onClick={goHome} className="btn-primary not-found-btn">
            <i className="fas fa-home"></i>
            <span>Go to Homepage</span>
          </button>
          <button onClick={goBack} className="btn-secondary not-found-btn">
            <i className="fas fa-arrow-left"></i>
            <span>Go Back</span>
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="not-found-decoration">
          <div className="not-found-circle not-found-circle-1"></div>
          <div className="not-found-circle not-found-circle-2"></div>
          <div className="not-found-circle not-found-circle-3"></div>
        </div>
      </div>
    </div>
  );
};
