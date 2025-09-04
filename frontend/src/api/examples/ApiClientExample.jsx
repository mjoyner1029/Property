// frontend/src/api/examples/ApiClientExample.jsx

import React, { useState, useEffect } from 'react';
import api from '../api';

/**
 * Example component demonstrating the usage of the API client
 */
const ApiClientExample = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Example of using the API client to fetch data
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await api.properties.getAll();
        setProperties(data);
      } catch (err) {
        console.error('Failed to fetch properties:', err);
        setError(err.message || 'Failed to fetch properties');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Example of using the API client to create data
  const handleCreateProperty = async (propertyData) => {
    setLoading(true);
    setError(null);
    
    try {
      const newProperty = await api.properties.create(propertyData);
      setProperties([...properties, newProperty]);
      return newProperty;
    } catch (err) {
      console.error('Failed to create property:', err);
      setError(err.message || 'Failed to create property');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Example of using the API client to delete data
  const handleDeleteProperty = async (propertyId) => {
    setLoading(true);
    setError(null);
    
    try {
      await api.properties.delete(propertyId);
      setProperties(properties.filter(property => property.id !== propertyId));
    } catch (err) {
      console.error('Failed to delete property:', err);
      setError(err.message || 'Failed to delete property');
    } finally {
      setLoading(false);
    }
  };

  // Render component
  return (
    <div>
      <h1>Properties</h1>
      
      {loading && <p>Loading...</p>}
      
      {error && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          Error: {error}
        </div>
      )}
      
      <ul>
        {properties.map(property => (
          <li key={property.id}>
            {property.name || property.address}
            <button 
              onClick={() => handleDeleteProperty(property.id)}
              style={{ marginLeft: '1rem' }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      
      <button 
        onClick={() => handleCreateProperty({ 
          name: 'New Property', 
          address: '123 Main St' 
        })}
        disabled={loading}
      >
        Add Property
      </button>
    </div>
  );
};

export default ApiClientExample;
