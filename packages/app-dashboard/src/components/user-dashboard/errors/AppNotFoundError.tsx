const AppNotFoundError = () => {
  return (
    <div className="container">
      <div className="consent-form-container">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
            <h2 className="text-lg font-semibold mb-2">Application Not Found</h2>
            <p>The application you&apos;re trying to access does not exist.</p>
          </div>

          <p className="mt-4 text-gray-600">
            If you believe this is an error, please contact the application developer for
            assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AppNotFoundError;
