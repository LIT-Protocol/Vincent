// Global variable to store the current app definition
let appDefinition = null;

/**
 * Vincent MCP Server - App Definition Display
 *
 * This script fetches the app definition from the server and displays it
 * in a user-friendly format, including the app details and available abilities.
 */

/**
 * Decodes a JWT token
 * @param {string} token - The JWT token to decode
 * @returns {Object|null} The decoded token payload or null if invalid
 */
function decodeJwt(token) {
  try {
    // Split the token into its parts
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode the payload (second part)
    const payload = parts[1];
    // Replace URL-safe characters and decode
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error decoding JWT:', e);
    return null;
  }
}

/**
 * Checks if a JWT token is expired
 * @param {Object} decodedToken - The decoded JWT token
 * @returns {boolean} True if expired, false otherwise
 */
function isTokenExpired(decodedToken) {
  if (!decodedToken || !decodedToken.exp) return true;
  const currentTime = Math.floor(Date.now() / 1000);
  return decodedToken.exp < currentTime;
}

/**
 * Gets the storage key for the JWT token based on app ID
 * @param {string} appId - The application ID
 * @returns {string} The storage key
 */
function getJwtStorageKey(appId) {
  return `vincent-${appId}`;
}

/**
 * Saves the JWT token to localStorage
 * @param {string} appId - The application ID
 * @param {string} token - The JWT token to save
 */
function saveJwtToken(appId, token) {
  if (!appId || !token) return;
  const key = getJwtStorageKey(appId);
  try {
    localStorage.setItem(key, token);
  } catch (e) {
    console.error('Error saving JWT to localStorage:', e);
  }
}

/**
 * Loads the JWT token from localStorage and validates it
 * @param {string} appId - The application ID
 * @returns {string|null} The valid JWT token or null if not found or expired
 */
function loadJwtToken(appId) {
  if (!appId) return null;
  const key = getJwtStorageKey(appId);
  try {
    const token = localStorage.getItem(key);
    if (!token) return null;

    // Check if token is expired
    const decoded = decodeJwt(token);
    if (isTokenExpired(decoded)) {
      // Remove expired token
      localStorage.removeItem(key);
      return null;
    }

    return token;
  } catch (e) {
    console.error('Error loading JWT from localStorage:', e);
    return null;
  }
}

/**
 * Shows a feedback message when copying to clipboard
 * @param {string} message - The message to show
 * @param {boolean} [isSuccess=true] - Whether the operation was successful
 */
function showCopyFeedback(message, isSuccess = true) {
  // Remove any existing feedback
  const existingFeedback = document.querySelector('.copy-feedback');
  if (existingFeedback) {
    existingFeedback.remove();
  }

  // Create feedback element
  const feedback = document.createElement('div');
  feedback.className = `copy-feedback ${isSuccess ? 'success' : 'error'}`;

  // Add icon based on success/failure
  const icon = document.createElement('span');
  icon.innerHTML = isSuccess ? '✓' : '✕';
  feedback.appendChild(icon);

  // Add message
  const text = document.createElement('span');
  text.textContent = message;
  feedback.appendChild(text);

  // Add to document
  document.body.appendChild(feedback);

  // Remove after animation completes
  setTimeout(() => {
    feedback.remove();
  }, 2000);
}

/**
 * Shows the MCP connection modal with the connection link
 */
function showMCPConnectionModal() {
  if (!appDefinition?.id) {
    console.error('No app definition found');
    return;
  }

  const jwtToken = localStorage.getItem(getJwtStorageKey(appDefinition.id));
  if (!jwtToken) {
    console.error('No JWT token found');
    return;
  }

  const modal = document.getElementById('mcp-modal');
  const connectionLink = document.getElementById('mcp-connection-link');
  const modalAppName = document.getElementById('modal-app-name');
  const copyButton = document.getElementById('copy-link-btn');
  const crossButton = document.querySelector('.modal-close');
  const closeButton = document.querySelector('.close-modal');

  if (!modal || !connectionLink || !modalAppName || !copyButton || !crossButton || !closeButton) {
    console.error('Required modal elements not found');
    return;
  }

  // Set app name in modal
  modalAppName.textContent = appDefinition.name || 'Vincent App';

  // Create connection URL
  const connectionUrl = `${window.location.origin}/mcp?jwt=${encodeURIComponent(jwtToken)}`;
  connectionLink.value = connectionUrl;

  // Handle copy button click
  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(connectionUrl);
      showCopyFeedback('Copied to clipboard!', true);
    } catch (err) {
      console.error('Failed to copy:', err);
      showCopyFeedback('Failed to copy', false);
    }
  };

  // Add event listeners
  copyButton.onclick = handleCopyClick;
  crossButton.onclick = closeModal;
  closeButton.onclick = closeModal;

  // Show the modal
  document.body.style.overflow = 'hidden';
  modal.classList.add('show');

  // Focus the copy button for better keyboard navigation
  copyButton.focus();
}

/**
 * Closes the MCP connection modal
 */
function closeModal() {
  const modal = document.getElementById('mcp-modal');
  if (modal) {
    document.body.style.overflow = '';
    modal.classList.remove('show');
  }
}

/**
 * Initializes modal functionality
 */
function initModal() {
  const modal = document.getElementById('mcp-modal');
  if (!modal) return;

  // Close when clicking outside content
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Vincent MCP landing page script loaded.');

  const appName = document.getElementById('app-name');
  const appDescription = document.getElementById('app-description');
  const appVersion = document.getElementById('app-version');
  const abilitiesContainer = document.getElementById('abilities-container');
  const approveButton = document.getElementById('approve-button');
  const connectButton = document.getElementById('connect-button');

  function updateConnectButtonState() {
    if (!connectButton) return;

    const hasValidJwt = !!localStorage.getItem(getJwtStorageKey(appDefinition?.id));
    connectButton.disabled = !hasValidJwt;

    if (hasValidJwt) {
      connectButton.removeAttribute('title');
    } else {
      connectButton.setAttribute('title', 'You must approve Vincent App first');
    }
  }

  function displayPkpAddress(decodedToken) {
    if (!decodedToken?.pkp?.ethAddress) return;

    const existingContainer = document.querySelector('.pkp-address-container');
    if (existingContainer) {
      existingContainer.remove();
    }

    const container = document.createElement('div');
    container.className = 'pkp-address-container';

    const label = document.createElement('div');
    label.className = 'pkp-address-label';
    label.textContent = 'Approved Vincent App with PKP:';

    const address = document.createElement('div');
    address.className = 'pkp-address';
    address.textContent = decodedToken.pkp.ethAddress;
    address.title = decodedToken.pkp.ethAddress; // Show full address on hover

    container.appendChild(label);
    container.appendChild(address);

    const appActions = document.querySelector('.app-actions');
    if (appActions && appActions.parentNode) {
      appActions.parentNode.insertBefore(container, appActions.nextSibling);
    }
  }

  try {
    const response = await fetch('/appDef');
    if (!response.ok) {
      throw new Error(`Failed to load app definition: ${response.status} ${response.statusText}`);
    }

    appDefinition = await response.json();
    displayAppDefinition(appDefinition);

    // Check for JWT in URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    let jwtToken = urlParams.get('jwt');
    let decodedToken = null;

    if (jwtToken) {
      console.log('JWT token found in URL');
      // Clean up the URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      // Decode the token to get the app ID and check expiration
      decodedToken = decodeJwt(jwtToken);
      if (decodedToken && !isTokenExpired(decodedToken)) {
        // Save the token with the app ID from the token
        const tokenAppId = decodedToken.app?.id;
        if (tokenAppId) {
          saveJwtToken(tokenAppId, jwtToken);
        }
      }
    } else {
      if (appDefinition?.id) {
        const savedToken = loadJwtToken(appDefinition.id);
        if (savedToken) {
          jwtToken = savedToken;
          decodedToken = decodeJwt(jwtToken);
        }
      }
    }

    // Handle valid JWT token
    if (jwtToken && decodedToken && !isTokenExpired(decodedToken)) {
      updateConnectButtonState();
      displayPkpAddress(decodedToken);
    }

    if (approveButton) {
      approveButton.addEventListener('click', () => {
        if (appDefinition?.id) {
          const currentUrl = encodeURIComponent(window.location.origin);
          window.location.href = `https://dashboard.heyvincent.ai/appId/${appDefinition.id}/connect?redirectUri=${currentUrl}`;
        } else {
          console.error('App definition not loaded');
        }
      });
    }

    if (connectButton) {
      connectButton.addEventListener('click', showMCPConnectionModal);
      updateConnectButtonState();
    }

    initModal();
  } catch (error) {
    console.error('Error loading app definition:', error);
    appName.textContent = 'Error loading app definition';
    appDescription.textContent =
      'Failed to load the application definition. Please try again later.';
  }
});

/**
 * Displays the app definition on the page
 * @param {Object} appDef - The app definition object
 */
function displayAppDefinition(appDef) {
  const { name, description, version, abilities } = appDef;

  document.getElementById('app-name').textContent = name;
  document.getElementById('app-description').textContent = description;
  document.getElementById('app-version').textContent = `v${version}`;

  const abilitiesContainer = document.getElementById('abilities-container');
  abilitiesContainer.innerHTML = '';

  Object.values(abilities).forEach((ability) => {
    const abilityElement = createAbilityElement(ability);
    abilitiesContainer.appendChild(abilityElement);
  });
}

/**
 * Creates a DOM element for an ability
 * @param {Object} ability - The ability object
 * @returns {HTMLElement} The created ability element
 */
function createAbilityElement(ability) {
  const abilityElement = document.createElement('div');
  abilityElement.className = 'ability-card';

  abilityElement.innerHTML = `
    <h3 class="ability-name">${escapeHtml(ability.name)}</h3>
    <p class="ability-description">${escapeHtml(ability.description)}</p>
  `;

  if (ability.parameters && ability.parameters.length > 0) {
    const parametersTitle = document.createElement('div');
    parametersTitle.className = 'parameters-title';
    parametersTitle.textContent = 'Parameters';
    abilityElement.appendChild(parametersTitle);

    const parametersList = document.createElement('div');

    ability.parameters.forEach((param) => {
      const paramElement = document.createElement('div');
      paramElement.className = 'parameter-item';

      const nameElement = document.createElement('div');
      nameElement.className = 'parameter-name';
      nameElement.innerHTML = `
        ${escapeHtml(param.name)}
        <span class="parameter-type">${escapeHtml(param.type)}</span>
      `;

      const descElement = document.createElement('div');
      descElement.className = 'parameter-description';
      descElement.textContent = param.description || 'No description provided.';

      paramElement.appendChild(nameElement);
      paramElement.appendChild(descElement);
      parametersList.appendChild(paramElement);
    });

    abilityElement.appendChild(parametersList);
  }

  return abilityElement;
}

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} unsafe - The unsafe string
 * @returns {string} The escaped string
 */
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return unsafe;
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
