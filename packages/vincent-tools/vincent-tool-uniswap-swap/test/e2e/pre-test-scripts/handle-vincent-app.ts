import { handleVincentApp } from '@lit-protocol/vincent-tool-sdk';

import { vincentToolsForVincentApp } from './vincent-tool-and-policies';

(() => handleVincentApp({ vincentTools: vincentToolsForVincentApp }))();
