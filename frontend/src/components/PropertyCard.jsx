import React from 'react';
import { Box, Typography, Paper, Chip, Avatar } from '@mui/material';
import { Link } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import ApartmentIcon from '@mui/icons-material/Apartment';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import HotelIcon from '@mui/icons-material/Hotel';
import VillaIcon from '@mui/icons-material/Villa';

const getPropertyIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'apartment':
      return <ApartmentIcon />;
    case 'house':
      return <HomeIcon />;
    case 'condo':
      return <BusinessIcon />;
    case 'villa':
      return <VillaIcon />;
    case 'room':
      return <HotelIcon />;
    default:
      return <HomeIcon />;
  }
};

const PropertyCard = ({
  id,
  name,
  address,
  city,
  state,
  zipCode,
  imageUrl,
  type = 'apartment',
  units = 0,
  vacancyCount = 0,
  onClick
}) => {
  const fullAddress = [address, city, state, zipCode].filter(Boolean).join(', ');
  const defaultImage = '/images/property-placeholder.jpg';
  const propertyIcon = getPropertyIcon(type);
  
  const handleClick = () => {
    if (onClick) onClick(id);
  };
  
  return (
    <Paper
      elevation={1}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        height: '100%',
        backgroundColor: '#1F2327',
        color: '#F5F5F5',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3
        }
      }}
      onClick={handleClick}
      component={id ? Link : 'div'}
      to={id ? `/properties/${id}` : undefined}
      style={{ textDecoration: 'none' }}
    >
      {/* Property Image */}
      <Box
        sx={{
          width: '100%',
          height: 160,
          position: 'relative',
          backgroundImage: `url(${imageUrl || defaultImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            borderRadius: 1,
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}
        >
          <Box sx={{ color: '#F5E6DE' }}>{propertyIcon}</Box>
          <Typography variant="body2">{type}</Typography>
        </Box>
      </Box>

      {/* Property Details */}
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="h3" gutterBottom noWrap>
          {name}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'text.secondary' }}>
          <LocationOnIcon fontSize="small" sx={{ mr: 0.5 }} />
          <Typography variant="body2" noWrap title={fullAddress}>
            {fullAddress}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Chip
            size="small"
            label={`${units} ${units === 1 ? 'Unit' : 'Units'}`}
            sx={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: '#3B82F6',
            }}
          />
          
          {units > 0 && (
            <Chip
              size="small"
              label={`${vacancyCount} Vacant`}
              sx={{
                backgroundColor: vacancyCount > 0 
                  ? 'rgba(16, 185, 129, 0.1)' 
                  : 'rgba(239, 68, 68, 0.1)',
                color: vacancyCount > 0 
                  ? '#10B981' 
                  : '#EF4444',
              }}
            />
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default PropertyCard;