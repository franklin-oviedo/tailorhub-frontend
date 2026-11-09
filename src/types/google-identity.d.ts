interface GoogleIdentityCredentialResponse {
  credential: string;
  select_by?: string;
  clientId?: string;
}

interface GoogleIdentityInitializeConfig {
  client_id: string;
  callback: (response: GoogleIdentityCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface GoogleIdentityButtonOptions {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number;
  locale?: string;
}

interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: GoogleIdentityInitializeConfig) => void;
        renderButton: (
          element: HTMLElement,
          options?: GoogleIdentityButtonOptions
        ) => void;
      };
    };
  };
}
