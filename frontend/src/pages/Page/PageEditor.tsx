import React from 'react';

export default function PageEditor() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="prose max-w-none">
        <h1 className="text-4xl font-bold mb-4">Page Title</h1>
        <div className="mt-8">
          <p className="text-gray-600">Start typing to add content...</p>
        </div>
      </div>
    </div>
  );
}

