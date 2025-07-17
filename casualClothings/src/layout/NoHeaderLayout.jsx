import React from 'react';

const NoHeaderLayout = ({ children }) => {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
};

export default NoHeaderLayout;
