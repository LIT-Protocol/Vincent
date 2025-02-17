// import { useState, useEffect, useCallback } from 'react';
// import { useRouter } from 'next/router';
// import { useUrlAppId } from '../hooks/useUrlAppId';
// import { useAppDatabase } from '../hooks/useAppDatabase';
// import { AppInfo } from '../utils/db';

// export interface ConsentFormData {
//   delegatees: string[];
//   policies: string[];
//   tools: string[];
//   policyParameters: {
//     prefixes: string[];
//   };
// }

// interface ConsentFormProps {
//   onSubmit: (data: ConsentFormData) => Promise<void>;
//   onDisapprove: () => void;
// }

// export default function ConsentForm({ onSubmit, onDisapprove }: ConsentFormProps) {
//   const { appId, error: appIdError } = useUrlAppId();
//   const { getApplicationByAppId, loading: dbLoading, error: dbError } = useAppDatabase();
//   const [formData, setFormData] = useState<ConsentFormData | null>(null);
//   const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
//   const [submitting, setSubmitting] = useState<boolean>(false);
//   const [showSuccess, setShowSuccess] = useState<boolean>(false);
//   const [showDisapproval, setShowDisapproval] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
//   const [editingPrefix, setEditingPrefix] = useState<string>('');

//   // Fetch app info from database
//   useEffect(() => {
//     let mounted = true;

//     async function fetchAppInfo() {
//       if (!appId) return;

//       try {
//         console.log('Fetching app info for appId:', appId);
//         const app = await getApplicationByAppId(appId);
//         console.log('Fetched app:', app);
        
//         if (mounted && app) {
//           setAppInfo(app);
//           setFormData({
//             delegatees: [app.appManagementAddress],
//             policies: app.policies.map(p => p.id),
//             tools: [app.toolId],
//             policyParameters: {
//               prefixes: [...(app.defaultPrefixes || [])]
//             }
//           });
//         }
//       } catch (err) {
//         console.error('Error fetching app info:', err);
//         if (mounted) {
//           setError(err instanceof Error ? err.message : 'Failed to fetch app info');
//         }
//       }
//     }

//     fetchAppInfo();

//     return () => {
//       mounted = false;
//     };
//   }, [appId, getApplicationByAppId]);

//   const handleSubmit = useCallback(async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!formData) return;

//     setSubmitting(true);
//     setError(null);

//     try {
//       await onSubmit(formData);
//       setShowSuccess(true);
//       setSubmitting(false);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to submit form');
//       setSubmitting(false);
//     }
//   }, [formData, onSubmit]);

//   const handleDisapprove = useCallback(async () => {
//     setShowDisapproval(true);
//     // Wait for animation to complete before calling onDisapprove
//     setTimeout(onDisapprove, 2000);
//   }, [onDisapprove]);

//   const handlePrefixChange = (index: number, value: string) => {
//     if (!formData) return;
//     const newPrefixes = [...formData.policyParameters.prefixes];
//     newPrefixes[index] = value;
//     setFormData({
//       ...formData,
//       policyParameters: {
//         ...formData.policyParameters,
//         prefixes: newPrefixes
//       }
//     });
//   };

//   const handleAddPrefix = () => {
//     if (!formData || !editingPrefix.trim()) return;
//     setFormData({
//       ...formData,
//       policyParameters: {
//         ...formData.policyParameters,
//         prefixes: [...formData.policyParameters.prefixes, editingPrefix.trim()]
//       }
//     });
//     setEditingPrefix('');
//   };

//   const handleRemovePrefix = (index: number) => {
//     if (!formData) return;
//     const newPrefixes = formData.policyParameters.prefixes.filter((_, i) => i !== index);
//     setFormData({
//       ...formData,
//       policyParameters: {
//         ...formData.policyParameters,
//         prefixes: newPrefixes
//       }
//     });
//   };

//   // Show error message if there's no appId or if there's an error
//   if (!appId || appIdError) {
//     return (
//       <div className="consent-form-container">
//         <div className="alert alert--error">
//           <p>{appIdError || 'No AppId provided'}</p>
//         </div>
//       </div>
//     );
//   }

//   if (dbLoading && !appInfo) {
//     return (
//       <div className="consent-form-container">
//         <div className="loader">Loading app information...</div>
//       </div>
//     );
//   }

//   if (dbError || error) {
//     return (
//       <div className="consent-form-container">
//         <div className="alert alert--error">
//           <p>Error loading app information: {dbError?.message || error || 'Unknown error occurred'}</p>
//         </div>
//       </div>
//     );
//   }

//   if (!formData || !appInfo) {
//     return (
//       <div className="consent-form-container">
//         <div className="alert alert--error">
//           <p>Unable to load consent form data</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="consent-form-container">
//       {showSuccess && (
//         <div className="animation-overlay">
//           <svg className="success-checkmark" viewBox="0 0 52 52">
//             <circle className="success-checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
//             <path className="success-checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
//           </svg>
//         </div>
//       )}

//       {showDisapproval && (
//         <div className="animation-overlay">
//           <svg className="error-x" viewBox="0 0 52 52">
//             <circle className="error-x__circle" cx="26" cy="26" r="25" fill="none"/>
//             <line className="error-x__line error-x__line--first" x1="16" y1="16" x2="36" y2="36"/>
//             <line className="error-x__line error-x__line--second" x1="36" y1="16" x2="16" y2="36"/>
//           </svg>
//         </div>
//       )}

//       {error && (
//         <div className="alert alert--error">
//           <p>{error}</p>
//         </div>
//       )}

//       <form onSubmit={handleSubmit}>
//         {appInfo.appLogo && (
//           <div className="app-logo">
//             <img src={appInfo.appLogo} alt={`${appInfo.metadata.name} logo`} />
//           </div>
//         )}

//         <div className="app-info">
//           <div className="app-title">
//             <h2>{appInfo.metadata.name}</h2>
//             {appInfo.verified && (
//               <div className="verified-icon" title="Verified App">
//                 <svg viewBox="0 0 24 24" width="20" height="20">
//                   <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
//                 </svg>
//               </div>
//             )}
//           </div>
//           {appInfo.verified && (
//             <div className="verified-text">Verified</div>
//           )}
//           <p className="app-description">{appInfo.metadata.description}</p>
//         </div>

//         <div className="permissions-section">
//           <h3>This app would like to:</h3>
//           <ul className="permissions-list">
//             {appInfo.tools.map((tool, index) => (
//               <li key={`tool-${index}`}>{tool}</li>
//             ))}
//           </ul>
//         </div>

//         <div className="policies-section">
//           <h3>Subject to these policies:</h3>
//           <ul className="policies-list">
//             {appInfo.policies.map((policy, index) => (
//               <li key={`policy-${index}`}>{policy.description}</li>
//             ))}
//           </ul>
//         </div>

//         <div className="prefixes-section">
//           <h3>Allowed Message Prefixes:</h3>
//           <p className="prefix-description">Messages must start with one of these prefixes to be signed</p>
          
//           <div className="prefix-list">
//             {formData?.policyParameters.prefixes.map((prefix, index) => (
//               <div key={`prefix-${index}`} className="prefix-item">
//                 <input
//                   type="text"
//                   value={prefix}
//                   onChange={(e) => handlePrefixChange(index, e.target.value)}
//                   className="prefix-input"
//                   placeholder="Enter prefix"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => handleRemovePrefix(index)}
//                   className="btn btn--icon btn--error"
//                   aria-label="Remove prefix"
//                 >
//                   ×
//                 </button>
//               </div>
//             ))}
//           </div>

//           <div className="prefix-add">
//             <input
//               type="text"
//               value={editingPrefix}
//               onChange={(e) => setEditingPrefix(e.target.value)}
//               className="prefix-input"
//               placeholder="Add new prefix"
//             />
//             <button
//               type="button"
//               onClick={handleAddPrefix}
//               className="btn btn--primary"
//               disabled={!editingPrefix.trim()}
//             >
//               Add Prefix
//             </button>
//           </div>
//         </div>

//         <div className="support-info">
//           <p>Need help? Contact: <a href={`mailto:${appInfo.supportEmail}`}>{appInfo.supportEmail}</a></p>
//         </div>

//         <div className="form-actions">
//           <button
//             type="submit"
//             className={`btn btn--primary ${submitting ? 'btn--loading' : ''}`}
//             disabled={submitting || showSuccess || showDisapproval}
//           >
//             {submitting ? 'Approving...' : 'Approve'}
//           </button>
//           <button
//             type="button"
//             className="btn btn--secondary"
//             onClick={handleDisapprove}
//             disabled={submitting || showSuccess || showDisapproval}
//           >
//             Disapprove
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// } 