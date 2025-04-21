import React, { useEffect } from 'react';
import { useHistory } from '@docusaurus/router';
import Layout from '@theme/Layout';

// This component will either redirect to the SDK docs or show a loading message
export default function SdkDocsPage(props: { sdkData: { title: string; description: string } }) {
  const history = useHistory();
  const { sdkData } = props;

  useEffect(() => {
    // Redirect to the TypeDoc documentation
    window.location.href = '/api/index.html';
  }, []);

  return (
    <Layout title={sdkData.title} description={sdkData.description}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
          fontSize: '20px',
        }}>
        <p>
          Loading SDK documentation...
        </p>
      </div>
    </Layout>
  );
} 