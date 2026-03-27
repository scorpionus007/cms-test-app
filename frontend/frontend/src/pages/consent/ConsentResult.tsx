import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';

export default function ConsentResult() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');

  const isSuccess = status === 'success' || status === 'ACTIVE';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center border border-gray-100">
          
          <div className="flex justify-center mb-6">
            {isSuccess ? (
              <svg className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          
          <h2 className={`text-2xl font-bold mb-2 ${isSuccess ? 'text-green-700' : 'text-red-700'}`}>
            {isSuccess ? 'Consent Granted Successfully' : 'Consent Request Failed or Canceled'}
          </h2>
          
          <p className="text-gray-600 mb-8">
            {isSuccess 
              ? 'Thank you! Your consent preferences have been recorded. You may now close this page or return to the dashboard.' 
              : 'The consent request was not completed. If this was a mistake, you can try again.'}
          </p>

          <Link
            to="/dashboard"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
          >
            Return to Dashboard
          </Link>
          
          <div className="mt-4">
             <Link to="/consent/redirect" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
               Or create a new request
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
