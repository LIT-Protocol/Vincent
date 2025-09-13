declare global {
  interface ZendeskSettings {
    webWidget?: {
      color?: { theme?: string };
      launcher?: {
        label?: Record<string, string>;
        mobile?: { labelVisible?: boolean };
      };
    };
  }

  type ZE = {
    // Common calls you use
    (command: 'webWidget', action: 'hide' | 'show'): void;
    (command: 'webWidget:on', event: string, handler: (...args: unknown[]) => void): void;

    // Fallback so other calls don’t error during compile
    (...args: unknown[]): void;
  };

  interface Window {
    zE?: ZE;
    zESettings?: ZendeskSettings;
  }
}

export function initZendesk() {
  if (document.getElementById('ze-snippet')) return;

  // Configure widget settings before loading
  window.zESettings = {
    webWidget: {
      color: {
        theme: '#ea580c',
      },
      launcher: {
        label: {
          '*': 'Help',
        },
        mobile: {
          labelVisible: false,
        },
      },
    },
  };

  // Add custom CSS before widget loads
  const style = document.createElement('style');
  style.textContent = `
    #launcher {
      transform: scale(0.85) !important;
      transform-origin: bottom right !important;
    }
    iframe#launcher {
      transform: scale(0.85) !important;
      transform-origin: bottom right !important;
    }
    /* Override launcher styles for better visibility */
    div[data-embed="launcher"] {
      filter: brightness(1.1) !important;
    }
  `;
  document.head.appendChild(style);

  const script = document.createElement('script');
  script.id = 'ze-snippet';
  script.src = `https://static.zdassets.com/ekr/snippet.js?key=0f0d79fc-9fa4-4a27-846d-389524cad855`;
  script.async = true;

  // Apply additional styling after widget loads
  script.onload = () => {
    setTimeout(() => {
      if (window.zE) {
        // Hide and show to refresh widget styling
        window.zE('webWidget', 'hide');
        setTimeout(() => {
          window.zE?.('webWidget', 'show');
        }, 100);
      }
    }, 500);
  };

  document.head.appendChild(script);
}
