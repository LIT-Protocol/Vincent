// import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
// import { useRouter } from 'next/router';
// import { useDisconnect } from 'wagmi';
// import ConsentForm, { ConsentFormData } from './ConsentForm';
// import FormSubmission from './FormSubmission';

// interface DashboardProps {
//   currentAccount: IRelayPKP;
//   sessionSigs: SessionSigs;
// }

// export default function Dashboard({
//   currentAccount,
//   sessionSigs,
// }: DashboardProps) {
//   const { disconnectAsync } = useDisconnect();
//   const router = useRouter();

//   const handleRedirect = () => {
//     const returnUrl = router.query.returnUrl as string;
//     // Use the provided returnUrl or fall back to the referring URL
//     window.location.href = returnUrl || document.referrer || '/';
//   };

//   async function handleLogout() {
//     try {
//       await disconnectAsync();
//     } catch (err) { }
//     localStorage.removeItem('lit-wallet-sig');
//     handleRedirect();
//   }

//   const handleFormSubmit = async (formData: ConsentFormData) => {
//     const submitForm = FormSubmission({
//       currentAccount,
//       sessionSigs,
//       formData,
//       onSuccess: () => {
//         // Wait for the animation to play before redirecting
//         return new Promise<void>(resolve => {
//           // Give time for the checkmark animation to complete
//           setTimeout(() => {
//             handleRedirect();
//             resolve();
//           }, 2000); // Increased time to ensure animation is visible
//         });
//       },
//     });
//     await submitForm();
//   };

//   return (
//     <div className="container">
//       <div className="logout-container">
//         <button className="btn btn--link" onClick={handleLogout}>
//           Logout
//         </button>
//       </div>
//       <h1>Agent Consent Notice</h1>
//       <div className="details-card">
//         <p>My address: {currentAccount.ethAddress.toLowerCase()}</p>
//       </div>
//       <div className="divider"></div>
//       <ConsentForm onSubmit={handleFormSubmit} onDisapprove={handleLogout} />
//     </div>
//   );
// }
