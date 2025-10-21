import React from 'react';

const ApiConfigure: React.FC = () => {
    return (
        <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-800">Connect to an API</h3>
            <p className="text-sm text-gray-600">Placeholder configuration for importing an OpenAPI/Swagger file and auth settings.</p>
            <div className="grid grid-cols-1 gap-3">
                <div className="h-10 bg-gray-100 rounded-md border border-gray-200" />
                <div className="h-10 bg-gray-100 rounded-md border border-gray-200" />
            </div>
        </div>
    );
};

export default ApiConfigure;


