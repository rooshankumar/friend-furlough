import React, { useState } from 'react';

interface B2ImageProps {
  src: string;
  alt?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
}

/**
 * Simple image component that handles URLs and base64 data
 */
export const B2Image: React.FC<B2ImageProps> = ({
  src,
  alt = '',
  className = '',
  loading = 'lazy',
  decoding = 'async'
}) => {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={`${className} bg-destructive/10 flex items-center justify-center`}>
        <span className="text-xs text-destructive">Failed to load</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      onError={() => setError(true)}
    />
  );
};

export default B2Image;
