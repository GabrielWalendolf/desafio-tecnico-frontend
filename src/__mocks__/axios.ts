const axios = {
  create: jest.fn(() => ({
    get:  jest.fn(),
    post: jest.fn(),
    interceptors: {
      response: { use: jest.fn() },
    },
  })),
};

export default axios;
