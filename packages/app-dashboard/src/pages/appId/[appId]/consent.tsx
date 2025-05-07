import { Helmet } from 'react-helmet';
import ConsentView from '@/components/consent/pages/index';

export function Consent() {
  return (
    <>
      <Helmet>
        <title>Vincent | App Consent</title>
        <meta name="description" content="Review and provide consent for an application" />
      </Helmet>
      <ConsentView />
    </>
  );
}

export default Consent;
