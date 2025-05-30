import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography } from 'antd';
import TravelPackageForm from './travelPackageForm';

const { Title } = Typography;

const TravelPackageCreate = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/dashboard/travel/travel-packages');
  };

  return (
    <div className="travel-package-create">
      <Card>
        <Title level={2}>Create Travel Package</Title>
        <TravelPackageForm 
          onSuccess={handleSuccess}
        />
      </Card>
    </div>
  );
};

export default TravelPackageCreate; 