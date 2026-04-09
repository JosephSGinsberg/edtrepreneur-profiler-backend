const request = require('supertest');
const express = require('express');

// Mock the User model before requiring the route
jest.mock('../models/User');
const User = require('../models/User');

const authRouter = require('./auth');

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('POST /api/auth/register', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns 400 if user already exists', async () => {
    User.findOne.mockResolvedValue({ email: 'test@example.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'pass123', firstName: 'John', lastName: 'Doe' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('User already exists');
  });

  it('creates user and returns token on success', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      getSignedJwtToken: () => 'fake-token',
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@example.com', password: 'pass123', firstName: 'Jane', lastName: 'Doe' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBe('fake-token');
  });

  it('returns 500 on unexpected error', async () => {
    User.findOne.mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'x@example.com', password: 'pass' });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('DB error');
  });
});

describe('POST /api/auth/login', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns 400 if user not found', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noone@example.com', password: 'pass' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('returns 400 if password does not match', async () => {
    User.findOne.mockResolvedValue({
      matchPassword: jest.fn().mockResolvedValue(false),
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('returns token on successful login', async () => {
    User.findOne.mockResolvedValue({
      matchPassword: jest.fn().mockResolvedValue(true),
      getSignedJwtToken: () => 'login-token',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'correct' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBe('login-token');
  });

  it('returns 500 on unexpected error', async () => {
    User.findOne.mockRejectedValue(new Error('DB down'));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'x@example.com', password: 'pass' });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('DB down');
  });
});
