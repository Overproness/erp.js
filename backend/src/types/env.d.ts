declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: string;
    PORT?: string;
    DATABASE?: string;
    FRONTEND_URL?: string;
    JWT_SECRET?: string;
    JWT_EXPIRATION?: string;

    // AI
    AI_ENABLED?: string;
    AI_PROVIDER?: string;
    AI_API_KEY?: string;
    AI_LOGGING_LEVEL?: string;
    OPENAI_API_KEY?: string;
    OPENAI_ORGANIZATION?: string;
    OPENAI_DEFAULT_MODEL?: string;
    OPENAI_EMBEDDING_MODEL?: string;
    OPENAI_MAX_TOKENS?: string;
    OPENAI_TEMPERATURE?: string;
    OPENAI_TIMEOUT?: string;
    OPENAI_MAX_RETRIES?: string;
    OPENAI_CONTENT_MODEL?: string;
    OPENAI_SUBJECT_MODEL?: string;
    OPENAI_SENTIMENT_MODEL?: string;
    OPENAI_SEGMENTATION_MODEL?: string;
    OPENAI_RECOMMENDATION_MODEL?: string;
    ANTHROPIC_API_KEY?: string;
    GOOGLE_GENERATIVE_AI_KEY?: string;
    GOOGLE_CLOUD_PROJECT?: string;

    // Azure
    AZURE_OPENAI_API_KEY?: string;
    AZURE_OPENAI_ENDPOINT?: string;
    AZURE_OPENAI_DEPLOYMENT_NAME?: string;
    AZURE_OPENAI_API_VERSION?: string;

    // Vertex AI
    VERTEX_AI_LOCATION?: string;
    VERTEX_AI_DEFAULT_MODEL?: string;

    // HuggingFace
    HUGGINGFACE_API_KEY?: string;
    HUGGINGFACE_DEFAULT_MODEL?: string;

    // Email
    EMAIL_HOST?: string;
    EMAIL_PORT?: string;
    EMAIL_SECURE?: string;
    EMAIL_USER?: string;
    EMAIL_PASS?: string;
    DEFAULT_SENDER?: string;

    // SMS
    SMS_ENABLED?: string;
    TWILIO_ACCOUNT_SID?: string;
    TWILIO_AUTH_TOKEN?: string;
    TWILIO_PHONE_NUMBER?: string;

    // Social
    SOCIAL_ENABLED?: string;
    FACEBOOK_APP_ID?: string;
    FACEBOOK_APP_SECRET?: string;
    INSTAGRAM_APP_ID?: string;
    INSTAGRAM_APP_SECRET?: string;
    TWITTER_API_KEY?: string;
    TWITTER_API_SECRET?: string;

    // Push
    PUSH_ENABLED?: string;
    FIREBASE_CREDENTIAL_FILE?: string;
    FIREBASE_DATABASE_URL?: string;
    FIREBASE_PROJECT_ID?: string;

    // Web
    WEB_ENABLED?: string;
    WEB_SCRIPT_URL?: string;

    // Misc
    WEBSOCKET_PORT?: string;
    SENDGRID_API_KEY?: string;
    SENDGRID_FROM_EMAIL?: string;
    SENDGRID_FROM_NAME?: string;
    SENDGRID_REPLY_TO?: string;
    SENDGRID_WEBHOOK_SECRET?: string;

    [key: string]: string | undefined;
  }
}
