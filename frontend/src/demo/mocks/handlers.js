// Mock service worker handlers for the demo mode
import { http, delay, HttpResponse } from 'msw';
import { v4 as uuidv4 } from 'uuid';
import { getDB, getItemById, addItem, updateItem, deleteItem, queryCollection } from '../data/persist';
import { jwtDecode } from 'jwt-decode';

// Config for demo mode behavior
let demoConfig = {
  latency: 300, // Default delay in ms
  errorRate: 0, // Probability of error (0 to 1)
  errorMode: false, // Force all requests to fail
  slowNetwork: false, // Simulate slow network
};

// Update demo configuration
export const updateDemoConfig = (config) => {
  demoConfig = { ...demoConfig, ...config };
};

// Get the current demo configuration
export const getDemoConfig = () => demoConfig;

// Helper to apply configured delay
const applyDelay = async () => {
  const latency = demoConfig.slowNetwork ? demoConfig.latency * 3 : demoConfig.latency;
  await delay(latency);
};

// Helper to maybe return an error based on error rate or error mode
const maybeError = () => {
  if (demoConfig.errorMode || (Math.random() < demoConfig.errorRate)) {
    const statusCodes = [400, 401, 403, 404, 500];
    const status = statusCodes[Math.floor(Math.random() * statusCodes.length)];
    const message = `Demo API ${status} error`;
    
    return new HttpResponse(JSON.stringify({ error: message, status }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return null;
};

// Generate tokens for authentication
const generateTokens = (user) => {
  // Create a very simple JWT-like token
  const now = Math.floor(Date.now() / 1000);
  const accessToken = btoa(JSON.stringify({
    sub: user.id,
    email: user.email,
    role: user.role,
    iat: now,
    exp: now + 3600, // 1 hour
  }));
  
  return {
    access_token: accessToken,
    refresh_token: 'demo-refresh-token',
    expires_in: 3600,
    token_type: 'Bearer',
  };
};

// Simple token store
let tokenStore = {
  accessToken: null,
  refreshToken: null,
  user: null,
};

// Extract user from authorization header
const getUserFromAuth = (req) => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  try {
    // Simple decode (in real JWT you'd verify the signature)
    const decoded = JSON.parse(atob(token));
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired token
    }
    
    // Find the user
    const users = getDB().users;
    return users.find(user => user.id === decoded.sub) || null;
  } catch (e) {
    return null;
  }
};

// =================================================================
// API Handlers
// =================================================================

// Auth API handlers
const authHandlers = [
  // Login handler
  http.post('/api/auth/login', async ({ request }) => {
    await applyDelay();
    const error = maybeError();
    if (error) return error;

    const body = await request.json();
    const { email, password } = body;
    
    // Check credentials against demo users
    const users = getDB().users;
    const user = users.find(u => u.email === email);
    
    if (!user || password !== 'demo123') {
      return new HttpResponse(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Generate token and update token store
    const tokens = generateTokens(user);
    tokenStore = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      user,
    };
    
    return HttpResponse.json({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      }
    });
  }),
  
  // Refresh token handler
  http.post('/api/auth/refresh', async () => {
    await applyDelay();
    const error = maybeError();
    if (error) return error;
    
    // In demo mode, we'll auto-refresh if we have a user
    if (!tokenStore.user) {
      return new HttpResponse(
        JSON.stringify({ error: 'Invalid refresh token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Generate new token
    const tokens = generateTokens(tokenStore.user);
    tokenStore.accessToken = tokens.access_token;
    
    return HttpResponse.json({
      access_token: tokens.access_token,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type,
      user: {
        id: tokenStore.user.id,
        email: tokenStore.user.email,
        firstName: tokenStore.user.firstName,
        lastName: tokenStore.user.lastName,
        role: tokenStore.user.role,
      }
    });
  }),
  
  // Logout handler
  http.post('/api/auth/logout', async () => {
    await applyDelay();
    const error = maybeError();
    if (error) return error;
    
    // Clear token store
    tokenStore = {
      accessToken: null,
      refreshToken: null,
      user: null,
    };
    
    return new HttpResponse(null, { status: 204 });
  }),
  
  // Get current user
  http.get('/api/users/me', async ({ request }) => {
    await applyDelay();
    const error = maybeError();
    if (error) return error;
    
    const user = getUserFromAuth(request);
    if (!user) {
      return new HttpResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return HttpResponse.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }),
];

// Properties API handlers
const propertyHandlers = [
  // Get all properties
  http.get('/api/properties', async ({ request }) => {
    await applyDelay();
    const error = maybeError();
    if (error) return error;
    
    const user = getUserFromAuth(request);
    if (!user) {
      return new HttpResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const properties = getDB().properties;
    
    // Filter by landlord for non-admin users
    let result = properties;
    if (user.role === 'landlord') {
      result = properties.filter(prop => prop.landlordId === user.id);
    }
    
    return HttpResponse.json(result);
  }),
  
  // Get property by ID
  http.get('/api/properties/:id', async ({ request, params }) => {
    await applyDelay();
    const error = maybeError();
    if (error) return error;
    
    const user = getUserFromAuth(request);
    if (!user) {
      return new HttpResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const property = getItemById('properties', params.id);
    
    if (!property) {
      return new HttpResponse(
        JSON.stringify({ error: 'Property not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if user has access to this property
    if (user.role === 'landlord' && property.landlordId !== user.id) {
      return new HttpResponse(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return HttpResponse.json(property);
  }),
  
  // Create property
  http.post('/api/properties', async ({ request }) => {
    await applyDelay();
    const error = maybeError();
    if (error) return error;
    
    const user = getUserFromAuth(request);
    if (!user) {
      return new HttpResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Only landlords and admins can create properties
    if (user.role !== 'landlord' && user.role !== 'admin') {
      return new HttpResponse(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const body = await request.json();
    
    const newProperty = {
      id: `property-${uuidv4()}`,
      ...body,
      landlordId: user.role === 'landlord' ? user.id : body.landlordId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    addItem('properties', newProperty);
    
    return HttpResponse.json(newProperty, { status: 201 });
  }),
  
  // Update property
  http.patch('/api/properties/:id', async ({ request, params }) => {
    await applyDelay();
    const error = maybeError();
    if (error) return error;
    
    const user = getUserFromAuth(request);
    if (!user) {
      return new HttpResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const property = getItemById('properties', params.id);
    
    if (!property) {
      return new HttpResponse(
        JSON.stringify({ error: 'Property not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if user has access to update this property
    if (user.role === 'landlord' && property.landlordId !== user.id) {
      return new HttpResponse(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const body = await request.json();
    
    // Don't allow changing landlordId for non-admins
    if (user.role !== 'admin') {
      delete body.landlordId;
    }
    
    const updatedProperty = {
      ...property,
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    updateItem('properties', property.id, updatedProperty);
    
    return HttpResponse.json(updatedProperty);
  }),
  
  // Delete property
  http.delete('/api/properties/:id', async ({ request, params }) => {
    await applyDelay();
    const error = maybeError();
    if (error) return error;
    
    const user = getUserFromAuth(request);
    if (!user) {
      return new HttpResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const property = getItemById('properties', params.id);
    
    if (!property) {
      return new HttpResponse(
        JSON.stringify({ error: 'Property not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if user has access to delete this property
    if (user.role === 'landlord' && property.landlordId !== user.id) {
      return new HttpResponse(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    deleteItem('properties', params.id);
    
    return new HttpResponse(null, { status: 204 });
  }),
];

// Units API handlers
const unitHandlers = [
  // Get all units
  http.get('/api/units', async ({ request }) => {
    await applyDelay();
    const error = maybeError();
    if (error) return error;
    
    const user = getUserFromAuth(request);
    if (!user) {
      return new HttpResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const units = getDB().units;
    const properties = getDB().properties;
    
    // Filter by landlord's properties for non-admin users
    let result = units;
    if (user.role === 'landlord') {
      const landlordPropertyIds = properties
        .filter(prop => prop.landlordId === user.id)
        .map(prop => prop.id);
      
      result = units.filter(unit => landlordPropertyIds.includes(unit.propertyId));
    } else if (user.role === 'tenant') {
      // For tenants, only show their rented unit
      const tenantProfile = getDB().tenants.find(t => t.userId === user.id);
      if (tenantProfile) {
        result = units.filter(unit => unit.id === tenantProfile.unitId);
      } else {
        result = [];
      }
    }
    
    return HttpResponse.json(result);
  }),
  
  // Get unit by ID
  http.get('/api/units/:id', async ({ request, params }) => {
    await applyDelay();
    const error = maybeError();
    if (error) return error;
    
    const user = getUserFromAuth(request);
    if (!user) {
      return new HttpResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const unit = getItemById('units', params.id);
    
    if (!unit) {
      return new HttpResponse(
        JSON.stringify({ error: 'Unit not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if user has access to this unit
    if (user.role === 'landlord') {
      const property = getItemById('properties', unit.propertyId);
      if (!property || property.landlordId !== user.id) {
        return new HttpResponse(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else if (user.role === 'tenant') {
      const tenantProfile = getDB().tenants.find(t => t.userId === user.id);
      if (!tenantProfile || tenantProfile.unitId !== unit.id) {
        return new HttpResponse(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    return HttpResponse.json(unit);
  }),
  
  // Create unit
  http.post('/api/units', async ({ request }) => {
    await applyDelay();
    const error = maybeError();
    if (error) return error;
    
    const user = getUserFromAuth(request);
    if (!user) {
      return new HttpResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Only landlords and admins can create units
    if (user.role !== 'landlord' && user.role !== 'admin') {
      return new HttpResponse(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const body = await request.json();
    
    // Verify property exists and user has access to it
    const property = getItemById('properties', body.propertyId);
    if (!property) {
      return new HttpResponse(
        JSON.stringify({ error: 'Property not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (user.role === 'landlord' && property.landlordId !== user.id) {
      return new HttpResponse(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const newUnit = {
      id: `unit-${uuidv4()}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    addItem('units', newUnit);
    
    return HttpResponse.json(newUnit, { status: 201 });
  }),
  
  // Update unit
  http.patch('/api/units/:id', async ({ request, params }) => {
    await applyDelay();
    const error = maybeError();
    if (error) return error;
    
    const user = getUserFromAuth(request);
    if (!user) {
      return new HttpResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const unit = getItemById('units', params.id);
    
    if (!unit) {
      return new HttpResponse(
        JSON.stringify({ error: 'Unit not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if user has access to update this unit
    if (user.role === 'landlord') {
      const property = getItemById('properties', unit.propertyId);
      if (!property || property.landlordId !== user.id) {
        return new HttpResponse(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else if (user.role === 'tenant') {
      return new HttpResponse(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const body = await request.json();
    
    const updatedUnit = {
      ...unit,
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    updateItem('units', unit.id, updatedUnit);
    
    return HttpResponse.json(updatedUnit);
  }),
  
  // Delete unit
  http.delete('/api/units/:id', async ({ request, params }) => {
    await applyDelay();
    const error = maybeError();
    if (error) return error;
    
    const user = getUserFromAuth(request);
    if (!user) {
      return new HttpResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const unit = getItemById('units', params.id);
    
    if (!unit) {
      return new HttpResponse(
        JSON.stringify({ error: 'Unit not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if user has access to delete this unit
    if (user.role === 'landlord') {
      const property = getItemById('properties', unit.propertyId);
      if (!property || property.landlordId !== user.id) {
        return new HttpResponse(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else if (user.role === 'tenant') {
      return new HttpResponse(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    deleteItem('units', params.id);
    
    return new HttpResponse(null, { status: 204 });
  }),
];

// Tenant API handlers
const tenantHandlers = [
  // Get all tenants
  http.get('/api/tenants', async ({ request }) => {
    await applyDelay();
    const error = maybeError();
    if (error) return error;
    
    const user = getUserFromAuth(request);
    if (!user) {
      return new HttpResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const tenants = getDB().tenants;
    const users = getDB().users;
    
    // Enrich with user details
    const enrichedTenants = tenants.map(tenant => {
      const userInfo = users.find(u => u.id === tenant.userId) || {};
      return {
        ...tenant,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        email: userInfo.email,
        phone: userInfo.phone,
      };
    });
    
    // Filter by access rights
    let result = enrichedTenants;
    
    if (user.role === 'landlord') {
      // Get units from landlord's properties
      const properties = getDB().properties.filter(p => p.landlordId === user.id);
      const units = getDB().units.filter(u => properties.some(p => p.id === u.propertyId));
      const unitIds = units.map(u => u.id);
      
      result = enrichedTenants.filter(t => unitIds.includes(t.unitId));
    } else if (user.role === 'tenant') {
      // Tenants can only see themselves
      result = enrichedTenants.filter(t => t.userId === user.id);
    }
    
    return HttpResponse.json(result);
  }),
  
  // Get tenant by ID
  http.get('/api/tenants/:id', async ({ request, params }) => {
    await applyDelay();
    const error = maybeError();
    if (error) return error;
    
    const user = getUserFromAuth(request);
    if (!user) {
      return new HttpResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const tenant = getItemById('tenants', params.id);
    
    if (!tenant) {
      return new HttpResponse(
        JSON.stringify({ error: 'Tenant not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Enrich with user details
    const userInfo = getItemById('users', tenant.userId) || {};
    const enrichedTenant = {
      ...tenant,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      email: userInfo.email,
      phone: userInfo.phone,
    };
    
    // Check access rights
    if (user.role === 'landlord') {
      // Check if tenant belongs to a unit in landlord's property
      const unit = getItemById('units', tenant.unitId);
      const property = unit ? getItemById('properties', unit.propertyId) : null;
      
      if (!property || property.landlordId !== user.id) {
        return new HttpResponse(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else if (user.role === 'tenant' && user.id !== tenant.userId) {
      // Tenants can only see themselves
      return new HttpResponse(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return HttpResponse.json(enrichedTenant);
  }),
  
  // Create tenant
  http.post('/api/tenants', async ({ request }) => {
    await applyDelay();
    const error = maybeError();
    if (error) return error;
    
    const user = getUserFromAuth(request);
    if (!user) {
      return new HttpResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Only landlords and admins can create tenants
    if (user.role !== 'landlord' && user.role !== 'admin') {
      return new HttpResponse(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const body = await request.json();
    
    // Verify unit exists and user has access to it
    const unit = getItemById('units', body.unitId);
    if (!unit) {
      return new HttpResponse(
        JSON.stringify({ error: 'Unit not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (user.role === 'landlord') {
      const property = getItemById('properties', unit.propertyId);
      if (!property || property.landlordId !== user.id) {
        return new HttpResponse(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    const newTenant = {
      id: `tenant-profile-${uuidv4()}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    addItem('tenants', newTenant);
    
    // Update unit status to occupied
    updateItem('units', unit.id, { 
      ...unit, 
      status: 'occupied', 
      updatedAt: new Date().toISOString() 
    });
    
    return HttpResponse.json(newTenant, { status: 201 });
  }),
  
  // Update tenant
  http.patch('/api/tenants/:id', async ({ request, params }) => {
    await applyDelay();
    const error = maybeError();
    if (error) return error;
    
    const user = getUserFromAuth(request);
    if (!user) {
      return new HttpResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const tenant = getItemById('tenants', params.id);
    
    if (!tenant) {
      return new HttpResponse(
        JSON.stringify({ error: 'Tenant not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check access rights
    if (user.role === 'landlord') {
      // Check if tenant belongs to a unit in landlord's property
      const unit = getItemById('units', tenant.unitId);
      const property = unit ? getItemById('properties', unit.propertyId) : null;
      
      if (!property || property.landlordId !== user.id) {
        return new HttpResponse(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else if (user.role === 'tenant' && user.id !== tenant.userId) {
      // Tenants can only update themselves
      return new HttpResponse(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const body = await request.json();
    
    // If unitId is changing, check access to new unit
    if (body.unitId && body.unitId !== tenant.unitId) {
      const newUnit = getItemById('units', body.unitId);
      if (!newUnit) {
        return new HttpResponse(
          JSON.stringify({ error: 'Unit not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      if (user.role === 'landlord') {
        const property = getItemById('properties', newUnit.propertyId);
        if (!property || property.landlordId !== user.id) {
          return new HttpResponse(
            JSON.stringify({ error: 'Forbidden' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }
    
    const updatedTenant = {
      ...tenant,
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    updateItem('tenants', tenant.id, updatedTenant);
    
    return HttpResponse.json(updatedTenant);
  }),
  
  // Delete tenant
  http.delete('/api/tenants/:id', async ({ request, params }) => {
    await applyDelay();
    const error = maybeError();
    if (error) return error;
    
    const user = getUserFromAuth(request);
    if (!user) {
      return new HttpResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const tenant = getItemById('tenants', params.id);
    
    if (!tenant) {
      return new HttpResponse(
        JSON.stringify({ error: 'Tenant not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check access rights - only admins and landlords can delete tenants
    if (user.role === 'landlord') {
      // Check if tenant belongs to a unit in landlord's property
      const unit = getItemById('units', tenant.unitId);
      const property = unit ? getItemById('properties', unit.propertyId) : null;
      
      if (!property || property.landlordId !== user.id) {
        return new HttpResponse(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else if (user.role === 'tenant') {
      return new HttpResponse(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get the unit to update status
    const unit = getItemById('units', tenant.unitId);
    
    deleteItem('tenants', params.id);
    
    // Update unit status to vacant if applicable
    if (unit) {
      updateItem('units', unit.id, { 
        ...unit, 
        status: 'vacant', 
        updatedAt: new Date().toISOString() 
      });
    }
    
    return new HttpResponse(null, { status: 204 });
  }),
];

// Dashboard handlers
const dashboardHandlers = [
  // Dashboard stats endpoint
  http.get('/api/dashboard/stats', async ({ request }) => {
    await applyDelay();
    const errorResponse = maybeError();
    if (errorResponse) return errorResponse;

    // Get current user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new HttpResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const db = getDB();
    
    return HttpResponse.json({
      propertyCount: db.properties.length,
      unitCount: db.units.length,
      tenantCount: db.tenants.length,
      occupancyRate: Math.round(Math.random() * 20 + 80), // 80-100%
      maintenanceCount: 3,
      paymentsDue: 2,
      paymentsReceived: 5,
      revenue: {
        current: 12500,
        previous: 11800,
        trend: '+5.9%'
      },
      expenses: {
        current: 3200,
        previous: 3500,
        trend: '-8.6%'
      }
    });
  }),

  // Recent activities endpoint
  http.get('/api/activities', async ({ request }) => {
    await applyDelay();
    const errorResponse = maybeError();
    if (errorResponse) return errorResponse;

    // Get current user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new HttpResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Generate realistic activities
    const activities = [
      {
        id: 'act1',
        type: 'maintenance',
        title: 'Maintenance request',
        description: 'New maintenance request for Unit 101',
        status: 'pending',
        time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      },
      {
        id: 'act2',
        type: 'payment',
        title: 'Payment received',
        description: 'Rent payment for Unit 305',
        status: 'completed',
        time: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
      },
      {
        id: 'act3',
        type: 'notification',
        title: 'New tenant application',
        description: 'Application for Unit 202',
        status: 'pending',
        time: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
      },
      {
        id: 'act4',
        type: 'maintenance',
        title: 'Maintenance completed',
        description: 'HVAC repair in Unit 205',
        status: 'completed',
        time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      },
    ];

    return HttpResponse.json(activities);
  }),
  
  // Calendar events endpoint
  http.get('/api/events', async ({ request }) => {
    await applyDelay();
    const errorResponse = maybeError();
    if (errorResponse) return errorResponse;

    // Get current user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new HttpResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const today = new Date();
    
    // Generate realistic events
    const events = [
      {
        id: 'evt1',
        title: 'Rent Due - All Properties',
        start: new Date(today.getFullYear(), today.getMonth(), 1).toISOString(),
        end: new Date(today.getFullYear(), today.getMonth(), 1).toISOString(),
        type: 'payment',
        allDay: true,
      },
      {
        id: 'evt2',
        title: 'Maintenance Visit - Unit 101',
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 10, 0).toISOString(),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 12, 0).toISOString(),
        type: 'maintenance',
        allDay: false,
      },
      {
        id: 'evt3',
        title: 'New Tenant Move-In - Unit 305',
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5).toISOString(),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5).toISOString(),
        type: 'tenant',
        allDay: true,
      },
    ];

    return HttpResponse.json(events);
  }),

  // Maintenance requests endpoint
  http.get('/api/maintenance', async ({ request }) => {
    await applyDelay();
    const errorResponse = maybeError();
    if (errorResponse) return errorResponse;

    // Get current user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new HttpResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const maintenance = [
      {
        id: 'm1',
        title: 'Leaking faucet in kitchen',
        description: 'The kitchen sink faucet is leaking',
        status: 'pending',
        priority: 'medium',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        unitId: 'unit1',
        unitName: 'Unit 101',
        propertyId: 'prop1',
        propertyName: 'Sunset Apartments',
        tenantName: 'John Doe',
      },
      {
        id: 'm2',
        title: 'HVAC not working',
        description: 'The air conditioning is not cooling properly',
        status: 'in-progress',
        priority: 'high',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        unitId: 'unit2',
        unitName: 'Unit 202',
        propertyId: 'prop1',
        propertyName: 'Sunset Apartments',
        tenantName: 'Jane Smith',
      },
      {
        id: 'm3',
        title: 'Replace light bulbs',
        description: 'Several light bulbs need to be replaced in the living room',
        status: 'completed',
        priority: 'low',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
        unitId: 'unit3',
        unitName: 'Unit 305',
        propertyId: 'prop2',
        propertyName: 'Harbor View Condos',
        tenantName: 'Mike Johnson',
      },
    ];

    return HttpResponse.json(maintenance);
  }),
];

// Payments handlers
const paymentHandlers = [
  http.get('/api/payments', async ({ request }) => {
    await applyDelay();
    const errorResponse = maybeError();
    if (errorResponse) return errorResponse;

    // Get current user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new HttpResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const payments = [
      {
        id: 'pay1',
        amount: 1500,
        status: 'paid',
        dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        paidDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
        type: 'rent',
        unitId: 'unit1',
        unitName: 'Unit 101',
        propertyId: 'prop1',
        propertyName: 'Sunset Apartments',
        tenantName: 'John Doe',
      },
      {
        id: 'pay2',
        amount: 1800,
        status: 'pending',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
        type: 'rent',
        unitId: 'unit2',
        unitName: 'Unit 202',
        propertyId: 'prop1',
        propertyName: 'Sunset Apartments',
        tenantName: 'Jane Smith',
      },
      {
        id: 'pay3',
        amount: 100,
        status: 'overdue',
        dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        type: 'utility',
        unitId: 'unit3',
        unitName: 'Unit 305',
        propertyId: 'prop2',
        propertyName: 'Harbor View Condos',
        tenantName: 'Mike Johnson',
      },
    ];

    return HttpResponse.json(payments);
  }),
];

// Combine all API handlers
export const handlers = [
  ...authHandlers,
  ...propertyHandlers,
  ...unitHandlers,
  ...tenantHandlers,
  ...dashboardHandlers,
  ...paymentHandlers,
  
  // Health check endpoint
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' });
  }),
  
  // User profile handlers
  http.get('/api/users/me', async ({ request }) => {
    await applyDelay();
    const errorResponse = maybeError();
    if (errorResponse) return errorResponse;

    // Get current user from auth header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new HttpResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    if (!token) {
      return new HttpResponse(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }
    
    try {
      // Parse token
      const decoded = jwtDecode(token);
      const userId = decoded.sub;
      
      // Find user in DB
      const db = getDB();
      const user = db.users.find(u => u.id === userId);
      
      if (!user) {
        return new HttpResponse(JSON.stringify({ error: 'User not found' }), { status: 404 });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return HttpResponse.json(userWithoutPassword);
    } catch (err) {
      return new HttpResponse(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }
  }),

  // User profile update
  http.put('/api/users/me', async ({ request }) => {
    await applyDelay();
    const errorResponse = maybeError();
    if (errorResponse) return errorResponse;

    // Get current user from auth header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new HttpResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    
    try {
      const body = await request.json();
      
      // Extract token
      const token = authHeader.split(' ')[1];
      if (!token) {
        return new HttpResponse(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
      }
      
      // Parse token
      const decoded = jwtDecode(token);
      const userId = decoded.sub;
      
      // Find and update user in DB
      const db = getDB();
      const userIndex = db.users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        return new HttpResponse(JSON.stringify({ error: 'User not found' }), { status: 404 });
      }
      
      // Update user data
      db.users[userIndex] = {
        ...db.users[userIndex],
        ...body,
        // Don't allow changing these fields
        id: userId,
        email: db.users[userIndex].email,
        role: db.users[userIndex].role,
      };
      
      // Return updated user without password
      const { password, ...userWithoutPassword } = db.users[userIndex];
      return HttpResponse.json(userWithoutPassword);
    } catch (err) {
      return new HttpResponse(JSON.stringify({ error: err.message }), { status: 400 });
    }
  }),
  
  // Notifications handlers
  http.get('/api/notifications', async ({ request }) => {
    await applyDelay();
    const errorResponse = maybeError();
    if (errorResponse) return errorResponse;

    // Get current user from auth header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new HttpResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    
    // Generate notifications
    const notifications = [
      {
        id: 'notif1',
        title: 'Rent payment due',
        message: 'Your rent payment for Unit 101 is due in 3 days',
        type: 'payment',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
      {
        id: 'notif2',
        title: 'Maintenance completed',
        message: 'The maintenance request for your kitchen sink has been completed',
        type: 'maintenance',
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
      {
        id: 'notif3',
        title: 'New message',
        message: 'You have a new message from your landlord',
        type: 'message',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
      },
    ];
    
    return HttpResponse.json(notifications);
  }),
  
  // Documents handlers
  http.get('/api/documents', async ({ request }) => {
    await applyDelay();
    const errorResponse = maybeError();
    if (errorResponse) return errorResponse;

    // Get current user from auth header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new HttpResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    
    // Generate documents
    const documents = [
      {
        id: 'doc1',
        title: 'Lease Agreement',
        type: 'lease',
        fileType: 'pdf',
        fileSize: 2459648,
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      },
      {
        id: 'doc2',
        title: 'Rent Receipt - January',
        type: 'receipt',
        fileType: 'pdf',
        fileSize: 128976,
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
      },
      {
        id: 'doc3',
        title: 'Property Inspection Report',
        type: 'report',
        fileType: 'pdf',
        fileSize: 789432,
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      },
    ];
    
    return HttpResponse.json(documents);
  }),
  
  // Messages handlers
  http.get('/api/messages', async ({ request }) => {
    await applyDelay();
    const errorResponse = maybeError();
    if (errorResponse) return errorResponse;

    // Get current user from auth header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new HttpResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    
    // Generate message threads
    const messageThreads = [
      {
        id: 'thread1',
        title: 'Maintenance request for Unit 101',
        lastMessage: 'The plumber will arrive tomorrow between 10am and 12pm.',
        unread: true,
        participants: [
          { id: 'user1', name: 'John Doe', role: 'landlord' },
          { id: 'user2', name: 'Jane Smith', role: 'tenant' }
        ],
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
      {
        id: 'thread2',
        title: 'Question about rent payment',
        lastMessage: 'Yes, you can pay with a credit card through the tenant portal.',
        unread: false,
        participants: [
          { id: 'user1', name: 'John Doe', role: 'landlord' },
          { id: 'user3', name: 'Mike Johnson', role: 'tenant' }
        ],
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      },
    ];
    
    return HttpResponse.json(messageThreads);
  }),
  
  // Message thread detail
  http.get('/api/messages/:threadId', async ({ params, request }) => {
    await applyDelay();
    const errorResponse = maybeError();
    if (errorResponse) return errorResponse;

    const { threadId } = params;
    
    // Get current user from auth header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new HttpResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    
    // Generate messages for this thread
    const messages = [
      {
        id: 'msg1',
        threadId,
        senderId: 'user2',
        senderName: 'Jane Smith',
        senderRole: 'tenant',
        content: 'Hello, I have a problem with my kitchen sink. It\'s leaking under the cabinet.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      },
      {
        id: 'msg2',
        threadId,
        senderId: 'user1',
        senderName: 'John Doe',
        senderRole: 'landlord',
        content: 'I\'ll send a plumber to check it out. When would be a good time?',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1 - 1000 * 60 * 60 * 2).toISOString(),
      },
      {
        id: 'msg3',
        threadId,
        senderId: 'user2',
        senderName: 'Jane Smith',
        senderRole: 'tenant',
        content: 'Tomorrow morning would be great if possible.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
      },
      {
        id: 'msg4',
        threadId,
        senderId: 'user1',
        senderName: 'John Doe',
        senderRole: 'landlord',
        content: 'The plumber will arrive tomorrow between 10am and 12pm.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
    ];
    
    return HttpResponse.json(messages);
  }),

  // Catch-all handler for any API requests not explicitly handled
  http.all('/api/*', async ({ request }) => {
    console.log('🔮 [Demo Mode] Unhandled API request:', request.method, request.url);
    await applyDelay();
    return HttpResponse.json({ message: 'Endpoint not implemented in demo mode' }, { status: 200 });
  }),
];
