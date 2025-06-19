const DeletedAppError = () => {
  return (
    <div className="container">
      <div className="consent-form-container">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
            <h2 className="text-lg font-semibold mb-2">This App Has Been Deleted</h2>
            <p>
              The application you&apos;re trying to access has been deleted by its creator. You
              cannot grant permissions to a deleted application.
            </p>
          </div>

          <p className="mt-4 text-gray-600">
            Please contact the application developer for more information or try using a different
            application.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeletedAppError;
