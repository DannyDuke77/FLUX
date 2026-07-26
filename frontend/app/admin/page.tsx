'use client';

import React from 'react';

const AdminPage = () => {

  const [data, setData] = React.useState(null);
  return (
    <div>
      <h1>Admin Page</h1>
      <p>Welcome to the admin dashboard. Here you can manage users, view analytics, and configure settings.</p>
    </div>
  );
};

export default AdminPage;