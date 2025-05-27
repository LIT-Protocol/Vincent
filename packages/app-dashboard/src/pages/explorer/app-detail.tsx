import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import UserHeader from '@/layout/user-dashboard/UserHeader';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/app-dashboard/ui/badge';
import {
  ArrowLeft,
  ExternalLink,
  Shield,
  Users,
  Calendar,
  Code,
  Package,
  GitBranch,
  FileText,
  Star,
  Heart,
  ChevronDown,
} from 'lucide-react';

// Local interface definitions for mock data
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

interface IAppToolDef {
  appId: number;
  appVersionNumber: number;
  toolPackageName: string;
  toolVersion: string;
  appVersionIdentity: string;
  toolIdentity: string;
  identity: string;
  hiddenSupportedPolicies: string[];
}

interface IToolVersionDef {
  packageName: string;
  version: string;
  identity: string;
  changes: string;
  repository: string;
  description: string;
  keywords: string[];
  dependencies: string[];
  author: { name: string; email: string; url: string };
  contributors: any[];
  homepage: string;
  status: string;
  supportedPolicies: string[];
  policiesNotInRegistry: string[];
  ipfsCid: string;
}

interface IPolicyVersionDef {
  packageName: string;
  version: string;
  identity: string;
  changes: string;
  repository: string;
  description: string;
  keywords: string[];
  dependencies: string[];
  author: { name: string; email: string; url: string };
  contributors: any[];
  homepage: string;
  status: string;
  ipfsCid: string;
  parameters: {
    uiSchema: string;
    jsonSchema: string;
  };
}

// Mock data for applications - matching the real IAppDef interface
const mockApps: (IAppDef & { category: string; userCount: number; rating: number })[] = [
  {
    appId: 1,
    identity: 1001,
    id: 101,
    activeVersion: 1,
    name: 'DeFiSwap',
    description:
      'Leading decentralized exchange for swapping tokens with the best rates and lowest fees. Built on multiple chains with **advanced AMM algorithms** and **flash loan** capabilities.',
    contactEmail: 'support@defiswap.com',
    appUserUrl: 'https://defiswap.com',
    logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    redirectUrls: ['https://defiswap.com/callback', 'https://app.defiswap.com/auth'],
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
      'Earn **high yield** on your crypto holdings through secure lending protocols and **liquidity mining**. Supports major DeFi tokens.',
    contactEmail: 'team@cryptolend.finance',
    appUserUrl: 'https://cryptolend.finance',
    redirectUrls: ['https://cryptolend.finance/auth', 'https://app.cryptolend.finance/callback'],
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
      'Discover, buy, and sell **unique digital assets** on the most advanced NFT marketplace. Features include **batch minting** and **royalty management**.',
    contactEmail: 'hello@nftmarketpro.io',
    appUserUrl: 'https://nftmarketpro.io',
    redirectUrls: ['https://nftmarketpro.io/login', 'https://marketplace.nftmarketpro.io/oauth'],
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
      'Maximize your **staking rewards** with automated strategies and **compound interest**. Supporting Ethereum 2.0 and other PoS networks.',
    contactEmail: 'support@stakevault.crypto',
    appUserUrl: 'https://stakevault.crypto',
    redirectUrls: ['https://stakevault.crypto/callback', 'https://app.stakevault.crypto/login'],
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
    description:
      'Track your **DeFi portfolio** performance across multiple protocols and chains. **Real-time analytics** and **yield optimization**.',
    contactEmail: 'info@web3analytics.xyz',
    appUserUrl: 'https://web3analytics.xyz',
    redirectUrls: [
      'https://web3analytics.xyz/auth',
      'https://dashboard.web3analytics.xyz/callback',
    ],
    deploymentStatus: 'prod',
    managerAddress: '0xFEDCBA0987654321FEDCBA0987654321FEDCBA09',
    lastUpdated: new Date('2024-01-12'),
    category: 'Analytics',
    userCount: 43000,
    rating: 4.3,
  },
];

// Mock tools data
const mockAppTools: Record<number, IAppToolDef[]> = {
  1: [
    {
      appId: 1,
      appVersionNumber: 1,
      toolPackageName: '@defiswap/liquidity-pool',
      toolVersion: '2.1.0',
      appVersionIdentity: '1@1',
      toolIdentity: '@defiswap/liquidity-pool@2.1.0',
      identity: 'AppToolDef|1@1/@defiswap/liquidity-pool@2.1.0',
      hiddenSupportedPolicies: [],
    },
    {
      appId: 1,
      appVersionNumber: 1,
      toolPackageName: '@defiswap/token-swapper',
      toolVersion: '1.5.2',
      appVersionIdentity: '1@1',
      toolIdentity: '@defiswap/token-swapper@1.5.2',
      identity: 'AppToolDef|1@1/@defiswap/token-swapper@1.5.2',
      hiddenSupportedPolicies: [],
    },
  ],
  2: [
    {
      appId: 2,
      appVersionNumber: 2,
      toolPackageName: '@cryptolend/lending-protocol',
      toolVersion: '3.0.1',
      appVersionIdentity: '2@2',
      toolIdentity: '@cryptolend/lending-protocol@3.0.1',
      identity: 'AppToolDef|2@2/@cryptolend/lending-protocol@3.0.1',
      hiddenSupportedPolicies: [],
    },
  ],
  3: [
    {
      appId: 3,
      appVersionNumber: 1,
      toolPackageName: '@nftmarket/marketplace-core',
      toolVersion: '1.8.0',
      appVersionIdentity: '3@1',
      toolIdentity: '@nftmarket/marketplace-core@1.8.0',
      identity: 'AppToolDef|3@1/@nftmarket/marketplace-core@1.8.0',
      hiddenSupportedPolicies: [],
    },
    {
      appId: 3,
      appVersionNumber: 1,
      toolPackageName: '@nftmarket/batch-minter',
      toolVersion: '0.9.5',
      appVersionIdentity: '3@1',
      toolIdentity: '@nftmarket/batch-minter@0.9.5',
      identity: 'AppToolDef|3@1/@nftmarket/batch-minter@0.9.5',
      hiddenSupportedPolicies: [],
    },
  ],
};

const mockToolVersions: Record<string, IToolVersionDef> = {
  '@defiswap/liquidity-pool@2.1.0': {
    packageName: '@defiswap/liquidity-pool',
    version: '2.1.0',
    identity: 'ToolVersionDef|@defiswap/liquidity-pool@2.1.0',
    changes: 'Added support for concentrated liquidity positions and improved gas efficiency.',
    repository: 'https://github.com/defiswap/liquidity-pool',
    description: 'Core liquidity pool management tool for DEX operations',
    keywords: ['vincent', 'defi', 'liquidity', 'amm'],
    dependencies: ['@vincent/core@1.2.0', '@vincent/web3@2.1.1'],
    author: { name: 'DeFiSwap Team', email: 'dev@defiswap.com', url: 'https://defiswap.com' },
    contributors: [],
    homepage: 'https://defiswap.com/tools',
    status: 'ready',
    supportedPolicies: ['@vincent/defi-policy@1.0.0'],
    policiesNotInRegistry: [],
    ipfsCid: 'QmX1Y2Z3...',
  },
  '@defiswap/token-swapper@1.5.2': {
    packageName: '@defiswap/token-swapper',
    version: '1.5.2',
    identity: 'ToolVersionDef|@defiswap/token-swapper@1.5.2',
    changes: 'Optimized swap routing and added MEV protection.',
    repository: 'https://github.com/defiswap/token-swapper',
    description: 'Token swapping engine with optimal routing',
    keywords: ['vincent', 'defi', 'swap', 'routing'],
    dependencies: ['@vincent/core@1.2.0'],
    author: { name: 'DeFiSwap Team', email: 'dev@defiswap.com', url: 'https://defiswap.com' },
    contributors: [],
    homepage: 'https://defiswap.com/tools',
    status: 'ready',
    supportedPolicies: ['@vincent/defi-policy@1.0.0'],
    policiesNotInRegistry: [],
    ipfsCid: 'QmA4B5C6...',
  },
};

// Mock policy data
const mockAppPolicies: Record<number, string[]> = {
  1: ['@vincent/defi-policy@1.0.0', '@vincent/security-policy@2.1.0'],
  2: ['@vincent/defi-policy@1.0.0', '@vincent/lending-policy@1.2.0'],
  3: ['@vincent/nft-policy@1.1.0', '@vincent/marketplace-policy@1.0.0'],
  4: ['@vincent/defi-policy@1.0.0', '@vincent/staking-policy@1.3.0'],
  5: ['@vincent/analytics-policy@1.0.0', '@vincent/data-policy@1.1.0'],
};

const mockPolicyVersions: Record<string, IPolicyVersionDef> = {
  '@vincent/defi-policy@1.0.0': {
    packageName: '@vincent/defi-policy',
    version: '1.0.0',
    identity: 'PolicyVersionDef|@vincent/defi-policy@1.0.0',
    changes: 'Initial release of DeFi security and compliance policy.',
    repository: 'https://github.com/vincent-protocol/defi-policy',
    description: 'Security and compliance policy for DeFi applications on Vincent',
    keywords: ['vincent', 'defi', 'policy', 'security'],
    dependencies: ['@vincent/core@1.2.0'],
    author: { name: 'Vincent Protocol', email: 'policies@vincent.com', url: 'https://vincent.com' },
    contributors: [],
    homepage: 'https://vincent.com/policies/defi',
    status: 'ready',
    ipfsCid: 'QmP1Q2R3...',
    parameters: {
      uiSchema:
        '{"type": "object", "properties": {"slippageTolerance": {"type": "number", "title": "Slippage Tolerance (%)", "default": 0.5}}}',
      jsonSchema:
        '{"type": "object", "properties": {"slippageTolerance": {"type": "number", "minimum": 0, "maximum": 10}}}',
    },
  },
  '@vincent/security-policy@2.1.0': {
    packageName: '@vincent/security-policy',
    version: '2.1.0',
    identity: 'PolicyVersionDef|@vincent/security-policy@2.1.0',
    changes: 'Enhanced security checks and multi-signature support.',
    repository: 'https://github.com/vincent-protocol/security-policy',
    description: 'Core security policy for all Vincent applications',
    keywords: ['vincent', 'security', 'policy', 'multisig'],
    dependencies: ['@vincent/core@1.2.0'],
    author: { name: 'Vincent Protocol', email: 'policies@vincent.com', url: 'https://vincent.com' },
    contributors: [],
    homepage: 'https://vincent.com/policies/security',
    status: 'ready',
    ipfsCid: 'QmS4T5U6...',
    parameters: {
      uiSchema:
        '{"type": "object", "properties": {"requireMultiSig": {"type": "boolean", "title": "Require Multi-Signature", "default": true}}}',
      jsonSchema: '{"type": "object", "properties": {"requireMultiSig": {"type": "boolean"}}}',
    },
  },
};

// Mock reviews data with Ethereum addresses
const mockReviews: Record<
  number,
  Array<{
    id: string;
    author: string;
    rating: number;
    date: string;
    title: string;
    content: string;
    likes: number;
    likedBy: string[];
  }>
> = {
  1: [
    {
      id: '1',
      author: '0x742d35Cc6634C0532925a3b8D0Fa8C4C1234567A',
      rating: 5,
      date: '2024-01-10',
      title: "Best DEX I've used",
      content:
        "Amazing liquidity and the lowest fees I've found. The new concentrated liquidity feature is a game changer for LPs.",
      likes: 12,
      likedBy: ['0x123...abc', '0x456...def'],
    },
    {
      id: '2',
      author: '0x9876543210987654321098765432109876543210',
      rating: 5,
      date: '2024-01-08',
      title: 'Solid platform',
      content: 'Great user experience and fast transactions. The MEV protection really works.',
      likes: 8,
      likedBy: ['0x789...ghi'],
    },
    {
      id: '3',
      author: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
      rating: 4,
      date: '2024-01-05',
      title: 'Good but could improve',
      content: 'Love the platform but the UI could be more intuitive for beginners.',
      likes: 3,
      likedBy: [],
    },
  ],
  2: [
    {
      id: '4',
      author: '0x1234567890ABCDEF1234567890ABCDEF12345678',
      rating: 5,
      date: '2024-01-12',
      title: 'Excellent yields',
      content:
        'Getting consistent high yields on my USDC deposits. The auto-compound feature is perfect.',
      likes: 15,
      likedBy: ['0xabc...123'],
    },
    {
      id: '5',
      author: '0xFEDCBA0987654321FEDCBA0987654321FEDCBA09',
      rating: 4,
      date: '2024-01-09',
      title: 'Secure and reliable',
      content: 'Great security features and the insurance fund gives me peace of mind.',
      likes: 6,
      likedBy: [],
    },
  ],
  3: [
    {
      id: '6',
      author: '0x567890ABCDEF1234567890ABCDEF1234567890AB',
      rating: 5,
      date: '2024-01-18',
      title: 'Amazing marketplace',
      content: 'The batch minting feature saved me hundreds in gas fees. Best NFT platform by far.',
      likes: 22,
      likedBy: ['0xdef...456'],
    },
    {
      id: '7',
      author: '0xCDEF1234567890ABCDEF1234567890ABCDEF1234',
      rating: 5,
      date: '2024-01-15',
      title: 'Perfect for creators',
      content: 'Royalty management is seamless and the community is very active.',
      likes: 18,
      likedBy: [],
    },
  ],
};

const renderStarRating = (rating: number, size = 'w-4 h-4') => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${star <= rating ? 'fill-black text-black' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
};

function getDeploymentStatusBadge(status: string) {
  switch (status) {
    case 'prod':
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          Production
        </Badge>
      );
    case 'test':
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          Testing
        </Badge>
      );
    case 'dev':
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
          Development
        </Badge>
      );
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}

function getToolStatusBadge(status: string) {
  switch (status) {
    case 'ready':
      return (
        <Badge variant="default" className="bg-emerald-100 text-emerald-800 border-emerald-200">
          Ready
        </Badge>
      );
    case 'validating':
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
          Validating
        </Badge>
      );
    case 'error':
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
          Error
        </Badge>
      );
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}

export default function AppDetail() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [reviews, setReviews] = useState(mockReviews);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    content: '',
  });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most-likes' | 'least-likes'>(
    'newest',
  );
  const [activeTab, setActiveTab] = useState<'about' | 'tools' | 'policies' | 'reviews'>('about');

  const app = mockApps.find((a) => a.appId.toString() === appId);
  const appTools = appId ? mockAppTools[parseInt(appId)] || [] : [];
  const appPolicies = appId ? mockAppPolicies[parseInt(appId)] || [] : [];

  // Get and sort reviews
  const appReviews = appId ? reviews[parseInt(appId)] || [] : [];
  const sortedReviews = [...appReviews].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'oldest':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'most-likes':
        return b.likes - a.likes;
      case 'least-likes':
        return a.likes - b.likes;
      default:
        return 0;
    }
  });

  const handleAuthenticate = () => {
    // Mock authentication
    setIsAuthenticated(true);
    setUserAddress('0x' + Math.random().toString(16).substr(2, 40));
  };

  const handleSubmitReview = () => {
    if (!appId || !newReview.title.trim() || !newReview.content.trim()) return;

    const review = {
      id: Date.now().toString(),
      author: userAddress,
      rating: newReview.rating,
      date: new Date().toISOString().split('T')[0],
      title: newReview.title,
      content: newReview.content,
      likes: 0,
      likedBy: [],
    };

    setReviews((prev) => ({
      ...prev,
      [parseInt(appId)]: [review, ...(prev[parseInt(appId)] || [])],
    }));

    setNewReview({ rating: 5, title: '', content: '' });
    setShowReviewForm(false);
  };

  const handleLikeReview = (reviewId: string) => {
    if (!isAuthenticated || !appId) return;

    setReviews((prev) => ({
      ...prev,
      [parseInt(appId)]:
        prev[parseInt(appId)]?.map((review) => {
          if (review.id === reviewId) {
            const hasLiked = review.likedBy.includes(userAddress);
            return {
              ...review,
              likes: hasLiked ? review.likes - 1 : review.likes + 1,
              likedBy: hasLiked
                ? review.likedBy.filter((addr) => addr !== userAddress)
                : [...review.likedBy, userAddress],
            };
          }
          return review;
        }) || [],
    }));
  };

  if (!app) {
    return (
      <div className="min-h-screen bg-white">
        <Helmet>
          <title>Vincent | App Not Found</title>
        </Helmet>
        <UserHeader />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Application Not Found</h1>
            <p className="text-gray-600 mb-6">
              The application you're looking for could not be found.
            </p>
            <Button onClick={() => navigate('/explorer')} className="inline-flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Registry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Vincent | {app.name}</title>
      </Helmet>
      <UserHeader />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Authentication Header */}
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/explorer')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Registry
          </Button>
          <div className="flex items-center gap-4">
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
        </div>

        {/* App Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* App Icon */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {app.name.charAt(0)}
              </div>
            </div>

            {/* App Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{app.name}</h1>
                  <div className="flex items-center gap-3 mb-3">
                    {getDeploymentStatusBadge(app.deploymentStatus)}
                    <Badge variant="outline" className="text-gray-600">
                      {app.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{app.userCount.toLocaleString()} users</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStarRating(app.rating)}
                      <span className="font-medium text-black">{app.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Updated {app.lastUpdated.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => window.open(app.appUserUrl, '_blank')}
                    className="bg-black hover:bg-gray-800 text-white px-6 py-2"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Launch App
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/appId/${app.appId}/consent`)}
                    className="border-black text-black hover:bg-black hover:text-white px-6 py-2"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  {[
                    { id: 'about', name: 'About', count: null },
                    { id: 'tools', name: 'Tools', count: appTools.length },
                    { id: 'policies', name: 'Policies', count: appPolicies.length },
                    { id: 'reviews', name: 'Reviews', count: appReviews.length },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() =>
                        setActiveTab(tab.id as 'about' | 'tools' | 'policies' | 'reviews')
                      }
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-black text-black'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } transition-colors`}
                    >
                      {tab.name}
                      {tab.count !== null && (
                        <span
                          className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                            activeTab === tab.id
                              ? 'bg-black text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* About Tab */}
                {activeTab === 'about' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
                    <div
                      className="text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: app.description
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>'),
                      }}
                    />
                  </div>
                )}

                {/* Tools Tab */}
                {activeTab === 'tools' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <Package className="w-5 h-5 mr-2 text-blue-600" />
                      Vincent Tools ({appTools.length})
                    </h2>
                    {appTools.length > 0 ? (
                      <div className="space-y-4">
                        {appTools.map((tool) => {
                          const toolVersion = mockToolVersions[tool.toolIdentity];
                          return (
                            <div
                              key={tool.identity}
                              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Code className="w-4 h-4 text-gray-500" />
                                    <span className="font-mono text-sm font-medium text-gray-900">
                                      {tool.toolPackageName}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      v{tool.toolVersion}
                                    </Badge>
                                  </div>
                                  {toolVersion && (
                                    <>
                                      <p className="text-gray-600 text-sm mb-2">
                                        {toolVersion.description}
                                      </p>
                                      <div className="flex items-center gap-4 text-xs text-gray-500">
                                        {toolVersion.repository && (
                                          <a
                                            href={toolVersion.repository}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 hover:text-blue-600"
                                          >
                                            <GitBranch className="w-3 h-3" />
                                            Repository
                                          </a>
                                        )}
                                        <span className="flex items-center gap-1">
                                          <Users className="w-3 h-3" />
                                          {toolVersion.author.name}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>
                                {toolVersion && getToolStatusBadge(toolVersion.status)}
                              </div>
                              {toolVersion && toolVersion.keywords.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {toolVersion.keywords.map((keyword: string) => (
                                    <Badge
                                      key={keyword}
                                      variant="secondary"
                                      className="text-xs bg-gray-100 text-gray-600"
                                    >
                                      {keyword}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No tools found for this application.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Policies Tab */}
                {activeTab === 'policies' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-purple-600" />
                      Vincent Policies ({appPolicies.length})
                    </h2>
                    {appPolicies.length > 0 ? (
                      <div className="space-y-4">
                        {appPolicies.map((policyIdentity) => {
                          const policyVersion = mockPolicyVersions[policyIdentity];
                          return (
                            <div
                              key={policyIdentity}
                              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <FileText className="w-4 h-4 text-gray-500" />
                                    <span className="font-mono text-sm font-medium text-gray-900">
                                      {policyVersion?.packageName || policyIdentity}
                                    </span>
                                    {policyVersion && (
                                      <Badge variant="outline" className="text-xs">
                                        v{policyVersion.version}
                                      </Badge>
                                    )}
                                  </div>
                                  {policyVersion && (
                                    <>
                                      <p className="text-gray-600 text-sm mb-2">
                                        {policyVersion.description}
                                      </p>
                                      <div className="flex items-center gap-4 text-xs text-gray-500">
                                        {policyVersion.repository && (
                                          <a
                                            href={policyVersion.repository}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 hover:text-blue-600"
                                          >
                                            <GitBranch className="w-3 h-3" />
                                            Repository
                                          </a>
                                        )}
                                        <span className="flex items-center gap-1">
                                          <Users className="w-3 h-3" />
                                          {policyVersion.author.name}
                                        </span>
                                        {policyVersion.homepage && (
                                          <a
                                            href={policyVersion.homepage}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 hover:text-blue-600"
                                          >
                                            <ExternalLink className="w-3 h-3" />
                                            Documentation
                                          </a>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                                {policyVersion && getToolStatusBadge(policyVersion.status)}
                              </div>
                              {policyVersion && policyVersion.keywords.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {policyVersion.keywords.map((keyword: string) => (
                                    <Badge
                                      key={keyword}
                                      variant="secondary"
                                      className="text-xs bg-purple-100 text-purple-600"
                                    >
                                      {keyword}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No policies found for this application.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">Reviews</h2>
                      {isAuthenticated && !showReviewForm && (
                        <Button
                          onClick={() => setShowReviewForm(true)}
                          className="bg-black text-white hover:bg-gray-800"
                        >
                          Write Review
                        </Button>
                      )}
                    </div>

                    {/* Sorting Controls */}
                    {appReviews.length > 0 && (
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                        <div className="text-sm text-gray-600">
                          {appReviews.length} review{appReviews.length !== 1 ? 's' : ''}
                        </div>
                        <div className="relative">
                          <select
                            value={sortBy}
                            onChange={(e) =>
                              setSortBy(
                                e.target.value as
                                  | 'newest'
                                  | 'oldest'
                                  | 'most-likes'
                                  | 'least-likes',
                              )
                            }
                            className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                          >
                            <option value="newest">Newest first</option>
                            <option value="oldest">Oldest first</option>
                            <option value="most-likes">Most liked</option>
                            <option value="least-likes">Least liked</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    )}

                    {/* Review Form */}
                    {isAuthenticated && showReviewForm && (
                      <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
                        <h3 className="font-semibold text-gray-900 mb-3">Write a Review</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Rating
                            </label>
                            <div className="flex items-center gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  onClick={() =>
                                    setNewReview((prev) => ({ ...prev, rating: star }))
                                  }
                                  className={`w-5 h-5 cursor-pointer ${
                                    star <= newReview.rating
                                      ? 'fill-black text-black'
                                      : 'text-gray-300 hover:text-gray-400'
                                  }`}
                                />
                              ))}
                              <span className="text-sm text-gray-600 ml-2">
                                {newReview.rating} star{newReview.rating !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Title
                            </label>
                            <input
                              type="text"
                              value={newReview.title}
                              onChange={(e) =>
                                setNewReview((prev) => ({ ...prev, title: e.target.value }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                              placeholder="Review title..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Review
                            </label>
                            <textarea
                              value={newReview.content}
                              onChange={(e) =>
                                setNewReview((prev) => ({ ...prev, content: e.target.value }))
                              }
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                              placeholder="Share your experience with this app..."
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={handleSubmitReview}
                              className="bg-black text-white hover:bg-gray-800"
                              disabled={!newReview.title.trim() || !newReview.content.trim()}
                            >
                              Submit Review
                            </Button>
                            <Button onClick={() => setShowReviewForm(false)} variant="outline">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reviews List */}
                    <div className="space-y-4">
                      {sortedReviews.length > 0 ? (
                        sortedReviews.map((review) => {
                          const hasLiked = isAuthenticated && review.likedBy.includes(userAddress);
                          return (
                            <div
                              key={review.id}
                              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-mono text-sm font-medium text-gray-900">
                                      {review.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                      {renderStarRating(review.rating)}
                                      <span className="font-medium text-black ml-1">
                                        {review.rating.toFixed(1)}
                                      </span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      <span>{review.date}</span>
                                    </span>
                                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                      {review.author.slice(0, 6)}...{review.author.slice(-4)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-gray-600 text-sm mb-3">{review.content}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {isAuthenticated ? (
                                    <button
                                      onClick={() => handleLikeReview(review.id)}
                                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                                        hasLiked
                                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                      }`}
                                    >
                                      <Heart
                                        className={`w-3 h-3 ${hasLiked ? 'fill-red-600' : ''}`}
                                      />
                                      <span>{review.likes}</span>
                                    </button>
                                  ) : (
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                      <Heart className="w-3 h-3" />
                                      <span>{review.likes}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>No reviews yet. Be the first to review this app!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Technical Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">App ID:</span>
                  <span className="ml-2 font-mono text-gray-900">{app.appId}</span>
                </div>
                <div>
                  <span className="text-gray-500">Identity:</span>
                  <span className="ml-2 font-mono text-gray-900">{app.identity}</span>
                </div>
                <div>
                  <span className="text-gray-500">Version:</span>
                  <span className="ml-2 font-mono text-gray-900">{app.activeVersion}</span>
                </div>
                <div>
                  <span className="text-gray-500">Manager:</span>
                  <span className="ml-2 font-mono text-xs text-gray-900 break-all">
                    {app.managerAddress}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Support Email:</span>
                  <a
                    href={`mailto:${app.contactEmail}`}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    {app.contactEmail}
                  </a>
                </div>
                <div>
                  <span className="text-gray-500">Website:</span>
                  <a
                    href={app.appUserUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    {app.appUserUrl}
                  </a>
                </div>
              </div>
            </div>

            {/* Authorized URLs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Authorized Redirect URLs</h3>
              <div className="space-y-2">
                {app.redirectUrls.map((url: string, index: number) => (
                  <div
                    key={index}
                    className="text-sm font-mono text-gray-600 bg-gray-50 p-2 rounded border break-all"
                  >
                    {url}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
