import React from 'react';
import './Avatar.css';

export const Avatar = ({ src, alt, className = '' }) => {
  return (
    <div className={`avatar ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="avatar-image" />
      ) : (
        <div className="avatar-placeholder">
          {alt ? alt.charAt(0).toUpperCase() : 'U'}
        </div>
      )}
    </div>
  );
}; 