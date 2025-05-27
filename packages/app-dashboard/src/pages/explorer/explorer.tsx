import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import UserHeader from '@/layout/user-dashboard/UserHeader';
import ProtectedByLit from '@/layout/shared/ProtectedByLit';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/app-dashboard/ui/badge';
import { Users, ChevronRight, Star, Shield } from 'lucide-react';

// Local interface definition for mock data
interface IAppDef {
  appId: number;
  identity: number;
  id: number;
  activeVersion: number;
  name: string;
  description: string;
  contactEmail: string;
  appUserUrl: string;
  logo?: string;
  redirectUrls: string[];
  deploymentStatus: string;
  managerAddress: string;
  lastUpdated: Date;
}

// Extended dummy data for dApp registry
const dummyApps: (IAppDef & { category: string; userCount: number; rating: number })[] = [
  {
    appId: 1,
    identity: 1001,
    id: 101,
    activeVersion: 1,
    name: 'DeFiSwap',
    description:
      'Leading **decentralized exchange** for swapping tokens with the best rates and lowest fees.',
    contactEmail: 'support@defiswap.com',
    appUserUrl: 'https://defiswap.com',
    logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    redirectUrls: ['https://defiswap.com/callback'],
    deploymentStatus: 'prod',
    managerAddress: '0x742d35Cc6634C0532925a3b8D0Fa8C4C1234567A',
    lastUpdated: new Date('2024-01-15'),
    category: 'DeFi',
    userCount: 125000,
    rating: 4.8,
  },
  {
    appId: 2,
    identity: 1002,
    id: 102,
    activeVersion: 2,
    name: 'CryptoLend',
    description:
      'Earn **high yield** on your crypto holdings through secure lending protocols and liquidity mining.',
    contactEmail: 'team@cryptolend.finance',
    appUserUrl: 'https://cryptolend.finance',
    redirectUrls: ['https://cryptolend.finance/auth', 'https://cryptolend.finance/callback'],
    deploymentStatus: 'prod',
    managerAddress: '0x9876543210987654321098765432109876543210',
    lastUpdated: new Date('2024-01-10'),
    category: 'DeFi',
    userCount: 89000,
    rating: 4.6,
  },
  {
    appId: 3,
    identity: 1003,
    id: 103,
    activeVersion: 1,
    name: 'NFT Marketplace Pro',
    description:
      'Discover, buy, and sell **unique digital assets** on the most advanced NFT marketplace.',
    contactEmail: 'hello@nftmarketpro.io',
    appUserUrl: 'https://nftmarketpro.io',
    redirectUrls: ['https://nftmarketpro.io/login'],
    deploymentStatus: 'test',
    managerAddress: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
    lastUpdated: new Date('2024-01-20'),
    category: 'NFT',
    userCount: 156000,
    rating: 4.9,
  },
  {
    appId: 4,
    identity: 1004,
    id: 104,
    activeVersion: 1,
    name: 'StakeVault',
    description:
      'Maximize your **staking rewards** with automated strategies and compound interest.',
    contactEmail: 'support@stakevault.crypto',
    appUserUrl: 'https://stakevault.crypto',
    redirectUrls: ['https://stakevault.crypto/callback'],
    deploymentStatus: 'prod',
    managerAddress: '0x1234567890ABCDEF1234567890ABCDEF12345678',
    lastUpdated: new Date('2024-01-18'),
    category: 'DeFi',
    userCount: 67000,
    rating: 4.4,
  },
  {
    appId: 5,
    identity: 1005,
    id: 105,
    activeVersion: 1,
    name: 'Web3 Analytics',
    description: 'Track your **DeFi portfolio** performance across multiple protocols and chains.',
    contactEmail: 'info@web3analytics.xyz',
    appUserUrl: 'https://web3analytics.xyz',
    redirectUrls: ['https://web3analytics.xyz/auth'],
    deploymentStatus: 'prod',
    managerAddress: '0xFEDCBA0987654321FEDCBA0987654321FEDCBA09',
    lastUpdated: new Date('2024-01-12'),
    category: 'Analytics',
    userCount: 43000,
    rating: 4.3,
  },
];

const featuredApps = [dummyApps[0], dummyApps[2], dummyApps[1]]; // DeFiSwap, NFT Marketplace Pro, CryptoLend
const popularApps = dummyApps;

const categories = ['All', 'DeFi', 'NFT', 'Analytics', 'Social', 'Utilities'];

const getDeploymentStatusBadge = (status: string) => {
  switch (status) {
    case 'prod':
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          Prod
        </Badge>
      );
    case 'test':
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          Test
        </Badge>
      );
    case 'dev':
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800">
          Dev
        </Badge>
      );
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const renderStarRating = (rating: number) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3 h-3 ${star <= rating ? 'fill-black text-black' : 'text-gray-300'}`}
        />
      ))}
      <span className="text-xs text-black font-medium ml-1">{rating.toFixed(1)}</span>
    </div>
  );
};

export default function Explorer() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userAddress, setUserAddress] = useState('');

  const handleAuthenticate = () => {
    // Mock authentication
    setIsAuthenticated(true);
    setUserAddress('0x' + Math.random().toString(16).substr(2, 40));
  };

  return (
    <>
      <Helmet>
        <title>Vincent | App Explorer</title>
        <meta name="description" content="Discover decentralized applications on Vincent" />
      </Helmet>
      <UserHeader title="App Explorer" showButtons={true} />

      <div className="bg-background min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Authentication Header */}
          <div className="flex justify-end mb-6">
            {isAuthenticated ? (
              <div className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-gray-600">Connected:</span>
                <span className="font-mono text-xs bg-green-50 px-2 py-1 rounded border">
                  {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                </span>
              </div>
            ) : (
              <Button
                onClick={handleAuthenticate}
                className="bg-black text-white hover:bg-gray-800"
              >
                Authenticate
              </Button>
            )}
          </div>

          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Application Registry</h1>
            <p className="text-muted-foreground">
              Discover and connect to decentralized applications built on the Vincent protocol
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="mb-8 space-y-4">
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Search applications..."
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button key={category} variant="outline" size="sm" className="text-xs">
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Featured Applications */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Featured Applications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredApps.map((app) => (
                <div
                  key={app.appId}
                  onClick={() => navigate(`/explorer/app/${app.appId}`)}
                  className="bg-card rounded-xl border border-border p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/20 hover:-translate-y-1"
                >
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
                        {app.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-card-foreground">{app.name}</h3>
                          {getDeploymentStatusBadge(app.deploymentStatus)}
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">{app.category}</p>
                      </div>
                    </div>
                    <p
                      className="text-sm text-muted-foreground leading-relaxed mb-4"
                      dangerouslySetInnerHTML={{
                        __html: app.description.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
                      }}
                    />
                    <div className="text-xs text-gray-500 mb-3">
                      Updated {app.lastUpdated.toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{app.userCount.toLocaleString()} users</span>
                      </div>
                      {renderStarRating(app.rating)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/appId/${app.appId}/consent`);
                      }}
                      className="bg-black text-white border-black hover:bg-gray-800 hover:border-gray-800 transition-colors"
                    >
                      Connect
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Applications */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Popular Applications</h2>
              <Button variant="ghost" className="text-primary hover:text-primary/80">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {popularApps.map((app, index) => (
                <div
                  key={app.appId}
                  onClick={() => navigate(`/explorer/app/${app.appId}`)}
                  className="bg-card rounded-lg border border-border p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/20 hover:bg-card/80"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">#{index + 1}</span>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-gray-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-lg">
                        {app.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-card-foreground truncate">
                            {app.name}
                          </h3>
                          {getDeploymentStatusBadge(app.deploymentStatus)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="bg-muted px-2 py-1 rounded-md font-medium">
                            {app.category}
                          </span>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{app.userCount.toLocaleString()} users</span>
                          </div>
                          {renderStarRating(app.rating)}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/appId/${app.appId}/consent`);
                      }}
                      className="shrink-0 bg-black text-white border-black hover:bg-gray-800 hover:border-gray-800 transition-colors"
                    >
                      Connect
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <ProtectedByLit />
        </div>
      </div>
    </>
  );
}
