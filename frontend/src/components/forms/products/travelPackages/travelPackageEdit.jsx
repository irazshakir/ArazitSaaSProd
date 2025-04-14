import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Typography, message } from 'antd';
import axios from 'axios';
import TravelPackageForm from './travelPackageForm';

const { Title } = Typography;

const TravelPackageEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackageData = async () => {
      try {
        const response = await axios.get(`/api/travel-packages/${id}/`);
        setPackageData(response.data);
      } catch (error) {
        message.error('Failed to load package data');
        console.error('Error fetching package data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPackageData();
  }, [id]);

  const handleSuccess = () => {
    navigate('/dashboard/travel/travel-packages');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!packageData) {
    return <div>Package not found</div>;
  }

  return (
    <div className="travel-package-edit">
      <Card>
        <Title level={2}>Edit Travel Package</Title>
        <TravelPackageForm 
          initialData={packageData}
          editMode={true}
          onSuccess={handleSuccess}
        />
      </Card>
    </div>
  );
};

export default TravelPackageEdit; 