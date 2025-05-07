import { RJSFSchema, UiSchema } from '@rjsf/utils';

export const mockJsonSchemas: Record<string, RJSFSchema> = {
  userInfo: {
    type: 'object',
    properties: {
      userInfo: {
        type: 'string',
        title: 'User Information',
      },
    },
  },
  tokenAmount: {
    type: 'object',
    properties: {
      tokenAmount: {
        type: 'number',
        title: 'Token Amount',
        minimum: 0,
      },
    },
  },
  termsAccepted: {
    type: 'object',
    properties: {
      termsAccepted: {
        type: 'boolean',
        title: 'Terms Accepted',
      },
    },
  },
};

export const mockUiSchemas: Record<string, UiSchema> = {
  userInfo: {
    userInfo: {
      'ui:placeholder': 'Enter your information',
      'ui:help': 'Please provide your information',
    },
  },
  tokenAmount: {
    tokenAmount: {
      'ui:widget': 'updown',
      'ui:placeholder': 'Enter token amount',
      'ui:help': 'Specify the amount of tokens',
    },
  },
  termsAccepted: {
    termsAccepted: {
      'ui:widget': 'checkbox',
      'ui:help': 'You must accept the terms to continue',
    },
  },
};
