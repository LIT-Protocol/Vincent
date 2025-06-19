import request from 'supertest';

// Helper function to create a request client
export const createClient = () => {
  const baseUrl = `http://localhost:${process.env.PORT || 3000}`;
  return request(baseUrl);
};
