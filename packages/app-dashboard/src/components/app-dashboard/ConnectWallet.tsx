import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function ConnectWalletScreen() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'white',
        textAlign: 'center',
        padding: '20px',
        margin: 0,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
      }}
    >
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <img
          src="/vincent-main-logo.png"
          alt="Vincent by Lit Protocol - Assistant for user owned automation"
          style={{
            maxWidth: '400px',
            marginBottom: '20px',
          }}
        />
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: '500',
            color: '#111',
            marginBottom: '1rem',
            marginTop: 0,
          }}
        >
          Developer Dashboard
        </h1>

        <div style={{ marginBottom: '10px' }}>
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              authenticationStatus,
              mounted,
            }) => {
              const ready = mounted && authenticationStatus !== 'loading';
              const connected =
                ready &&
                account &&
                chain &&
                (!authenticationStatus || authenticationStatus === 'authenticated');

              const buttonStyle = {
                backgroundColor: '#111',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '20px',
                textDecoration: 'none',
                fontWeight: '500',
                margin: '10px',
                display: 'inline-block',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              };

              const outlineButtonStyle = {
                ...buttonStyle,
                backgroundColor: 'transparent',
                color: '#111',
                border: '1px solid #111',
              };

              const errorButtonStyle = {
                ...buttonStyle,
                backgroundColor: '#dc2626',
              };

              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    style: {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button style={buttonStyle} onClick={openConnectModal}>
                          Connect Wallet
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button style={errorButtonStyle} onClick={openChainModal}>
                          Wrong network
                        </button>
                      );
                    }

                    return (
                      <div
                        style={{
                          display: 'flex',
                          gap: '10px',
                          justifyContent: 'center',
                          flexWrap: 'wrap',
                        }}
                      >
                        <button style={outlineButtonStyle} onClick={openChainModal}>
                          {chain.name}
                        </button>
                        <button style={outlineButtonStyle} onClick={openAccountModal}>
                          {account.displayName}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>

        <div
          style={{
            marginTop: '10px',
            marginBottom: '30px',
          }}
        >
          <a
            target="_blank"
            href="https://docs.heyvincent.ai/"
            style={{
              color: '#666',
              textDecoration: 'none',
            }}
            rel="noopener noreferrer"
          >
            Developer Docs
          </a>
        </div>

        <div
          style={{
            marginTop: '40px',
            color: '#999',
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          Protected by
        </div>
        <a
          href="https://www.litprotocol.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            marginTop: '10px',
            cursor: 'pointer',
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.7';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          <svg
            style={{
              width: '40px',
            }}
            width="40"
            viewBox="0 0 311 228"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Lit Protocol logo"
          >
            <path
              d="M311 104.987V51.9125H256.038V29.2084L256.245 0.621826H202.816V174.264C202.816 181.242 204.193 188.153 206.866 194.599C209.54 201.045 213.459 206.9 218.398 211.83C223.337 216.76 229.2 220.667 235.652 223.328C242.103 225.989 249.016 227.352 255.994 227.338L311 227.25V175.045H269.794C267.969 175.047 266.162 174.689 264.477 173.992C262.791 173.295 261.259 172.272 259.969 170.982C258.679 169.692 257.656 168.16 256.959 166.474C256.262 164.789 255.904 162.982 255.906 161.157V140.517H256.053C256.053 128.723 256.053 116.929 256.053 104.943L311 104.987Z"
              fill="black"
            />
            <path
              d="M142.841 51.9125H184.564V0.621826H131.489V227.442H184.564V93.9711C184.564 88.7506 182.208 83.8089 178.151 80.5223L142.841 51.9125Z"
              fill="black"
            />
            <path
              d="M53.2347 161.157V0.621826H0.160156V174.264C0.160143 181.242 1.53637 188.153 4.21006 194.599C6.88376 201.045 10.8024 206.9 15.7418 211.83C20.6811 216.76 26.5442 220.667 32.9954 223.328C39.4466 225.989 46.3593 227.352 53.3379 227.338L113.12 227.25V175.045H67.1225C63.4392 175.045 59.9068 173.582 57.3023 170.978C54.6978 168.373 53.2347 164.841 53.2347 161.157Z"
              fill="black"
            />
          </svg>
        </a>
      </main>

      <footer
        style={{
          position: 'fixed',
          bottom: '20px',
          color: '#999',
          fontSize: '0.8rem',
        }}
      >
        <a
          target="_blank"
          href="https://www.litprotocol.com/legal/terms-of-service"
          style={{
            color: '#999',
            textDecoration: 'none',
            margin: '0 5px',
          }}
          rel="noopener noreferrer"
        >
          Terms
        </a>
        {' / '}
        <a
          target="_blank"
          href="https://www.litprotocol.com/legal/privacy-policy"
          style={{
            color: '#999',
            textDecoration: 'none',
            margin: '0 5px',
          }}
          rel="noopener noreferrer"
        >
          Privacy
        </a>
      </footer>
    </div>
  );
}
