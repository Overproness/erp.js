/**
 * AI Optimization Parameters and Machine Learning Model Configurations
 * 
 * Configuration for AI-driven marketing optimizations
 */

const aiSettings = {
  // Global AI settings
  global: {
    enabled: process.env.AI_ENABLED === 'true',
    apiProvider: process.env.AI_PROVIDER || 'openai',
    apiKey: process.env.AI_API_KEY,
    fallbackToRules: true, // Fall back to rule-based system if AI unavailable
    modelCacheTTL: 3600, // Cache AI predictions for 1 hour (seconds)
    loggingLevel: process.env.AI_LOGGING_LEVEL || 'info',
  },
  
  // AI service provider configurations
  providers: {
    // OpenAI configuration
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORGANIZATION,
      defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4',
      embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4096'),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
      timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000'),
      maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES || '3'),
      models: {
        contentGeneration: process.env.OPENAI_CONTENT_MODEL || 'gpt-4',
        subjectLineGeneration: process.env.OPENAI_SUBJECT_MODEL || 'gpt-3.5-turbo',
        sentimentAnalysis: process.env.OPENAI_SENTIMENT_MODEL || 'gpt-3.5-turbo',
        customerSegmentation: process.env.OPENAI_SEGMENTATION_MODEL || 'gpt-4',
        recommendationEngine: process.env.OPENAI_RECOMMENDATION_MODEL || 'gpt-4',
      }
    },
    
    // Google Vertex AI configuration
    vertexai: {
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
      location: process.env.VERTEX_AI_LOCATION || 'us-central1',
      defaultModel: process.env.VERTEX_AI_DEFAULT_MODEL || 'text-bison',
      embeddingModel: process.env.VERTEX_AI_EMBEDDING_MODEL || 'textembedding-gecko',
      maxTokens: parseInt(process.env.VERTEX_AI_MAX_TOKENS || '4096'),
      temperature: parseFloat(process.env.VERTEX_AI_TEMPERATURE || '0.7'),
      timeout: parseInt(process.env.VERTEX_AI_TIMEOUT || '30000'),
      models: {
        contentGeneration: process.env.VERTEX_AI_CONTENT_MODEL || 'text-bison',
        subjectLineGeneration: process.env.VERTEX_AI_SUBJECT_MODEL || 'text-bison',
        sentimentAnalysis: process.env.VERTEX_AI_SENTIMENT_MODEL || 'text-bison',
        customerSegmentation: process.env.VERTEX_AI_SEGMENTATION_MODEL || 'text-bison',
        recommendationEngine: process.env.VERTEX_AI_RECOMMENDATION_MODEL || 'text-bison',
      }
    },
    
    // Azure OpenAI configuration
    azureopenai: {
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2023-05-15',
      maxTokens: parseInt(process.env.AZURE_OPENAI_MAX_TOKENS || '4096'),
      temperature: parseFloat(process.env.AZURE_OPENAI_TEMPERATURE || '0.7'),
      timeout: parseInt(process.env.AZURE_OPENAI_TIMEOUT || '30000'),
      models: {
        contentGeneration: process.env.AZURE_OPENAI_CONTENT_DEPLOYMENT || 'gpt-4',
        subjectLineGeneration: process.env.AZURE_OPENAI_SUBJECT_DEPLOYMENT || 'gpt-35-turbo',
        sentimentAnalysis: process.env.AZURE_OPENAI_SENTIMENT_DEPLOYMENT || 'gpt-35-turbo',
        customerSegmentation: process.env.AZURE_OPENAI_SEGMENTATION_DEPLOYMENT || 'gpt-4',
        recommendationEngine: process.env.AZURE_OPENAI_RECOMMENDATION_DEPLOYMENT || 'gpt-4',
      }
    },
    
    // Hugging Face configuration
    huggingface: {
      apiKey: process.env.HUGGINGFACE_API_KEY,
      defaultModel: process.env.HUGGINGFACE_DEFAULT_MODEL || 'google/flan-t5-xl',
      embeddingModel: process.env.HUGGINGFACE_EMBEDDING_MODEL || 'sentence-transformers/all-mpnet-base-v2',
      timeout: parseInt(process.env.HUGGINGFACE_TIMEOUT || '30000'),
      useInference: process.env.HUGGINGFACE_USE_INFERENCE === 'true',
      models: {
        contentGeneration: process.env.HUGGINGFACE_CONTENT_MODEL || 'google/flan-t5-xl',
        subjectLineGeneration: process.env.HUGGINGFACE_SUBJECT_MODEL || 'google/flan-t5-base',
        sentimentAnalysis: process.env.HUGGINGFACE_SENTIMENT_MODEL || 'distilbert-base-uncased-finetuned-sst-2-english',
        customerSegmentation: process.env.HUGGINGFACE_SEGMENTATION_MODEL || 'google/flan-t5-xl',
        recommendationEngine: process.env.HUGGINGFACE_RECOMMENDATION_MODEL || 'google/flan-t5-xl',
      }
    }
  },
  
  // Campaign optimization settings
  campaignOptimization: {
    enabled: true,
    features: {
      // A/B testing and optimization
      abTesting: {
        enabled: true,
        minSampleSize: 100, // Minimum number of recipients for statistical significance
        confidenceThreshold: 0.95, // 95% confidence level for determining winners
        maxTestDuration: 72, // Maximum test duration in hours
        metrics: ['opens', 'clicks', 'conversions', 'revenue'],
        maxVariants: 5, // Maximum number of variants to test
        autoOptimize: true, // Automatically shift traffic to winning variants
        stopUnderperforming: true, // Stop sending underperforming variants
      },
      
      // Send time optimization
      sendTimeOptimization: {
        enabled: true,
        lookbackPeriod: 90, // Days of historical data to analyze
        minDataPoints: 5, // Minimum interactions required for predictions
        defaultWindow: 4, // Hours to allow for sending if no optimal time found
        updateFrequency: 'weekly', // How often to recalculate optimal times
        considerTimeZone: true, // Consider recipient's timezone
      },
      
      // Subject line optimization
      subjectLineOptimization: {
        enabled: true,
        generationEnabled: true, // Auto-generate subject line variants
        maxVariants: 3, // Maximum number of subject line variants to test
        generations: 5, // Number of AI-generated options to choose from
        evaluationMetrics: ['sentiment', 'clickbait', 'spam_score', 'readability'],
        minLength: 30, // Minimum character length
        maxLength: 70, // Maximum character length
      },
      
      // Content optimization
      contentOptimization: {
        enabled: true,
        generationEnabled: true, // Auto-generate content variants
        maxVariants: 3, // Maximum number of content variants to test
        optimizeFor: 'clicks', // Default optimization goal
        personalizationLevel: 'medium', // How much personalization to apply
        contentElements: ['headline', 'body', 'cta', 'images'],
        preserveTracking: true, // Preserve tracking links during optimization
      },
      
      // Audience optimization
      audienceOptimization: {
        enabled: true,
        segmentation: {
          enabled: true,
          clusteringMethod: 'kmeans',
          maxClusters: 10,
          features: [
            'engagement_history',
            'purchase_behavior',
            'website_activity',
            'demographics',
            'product_interests'
          ]
        },
        propensityScoring: {
          enabled: true,
          models: ['click', 'conversion', 'purchase', 'churn'],
          threshold: 0.5, // Minimum score to include in target audience
          updateFrequency: 'daily',
        },
        suppressionRules: {
          enabled: true,
          maxContactsPerDay: 1,
          maxContactsPerWeek: 3,
          respectFatigue: true,
          fatiguePeriodDays: 30,
        }
      }
    },
    
    // Model training settings
    modelTraining: {
      enabled: true,
      autoTraining: {
        enabled: true,
        frequency: 'weekly',
        minDataPoints: 1000, // Minimum data points required for training
        trainingTimeWindow: { startHour: 1, endHour: 5 }, // Training during off-hours
      },
      dataPreparation: {
        featureSelection: true,
        normalization: true,
        outlierRemoval: true,
        trainTestSplit: 0.8, // 80% training data, 20% testing data
      },
      hyperparameterTuning: {
        enabled: true,
        method: 'grid_search', // 'grid_search', 'random_search', 'bayesian'
        maxIterations: 20,
        crossValidation: 5, // k-fold cross validation
      },
      evaluation: {
        metrics: ['accuracy', 'precision', 'recall', 'f1', 'roc_auc'],
        threshold: 0.7, // Minimum performance metric to deploy model
        compareWithBaseline: true,
      }
    }
  },
  
  // Customer behavior prediction models
  behaviorPrediction: {
    enabled: true,
    models: {
      // Churn prediction model
      churnPrediction: {
        enabled: true,
        lookbackPeriod: 180, // Days of historical data to analyze
        predictionHorizon: 30, // Days to predict ahead
        updateFrequency: 'daily',
        thresholds: {
          high: 0.7, // High risk of churn
          medium: 0.4, // Medium risk
          low: 0.2 // Low risk
        },
        features: [
          'days_since_last_purchase',
          'purchase_frequency',
          'engagement_rate',
          'support_tickets',
          'price_sensitivity',
          'website_visits',
          'email_engagement',
          'product_returns',
          'loyalty_program_activity'
        ]
      },
      
      // Purchase prediction model
      purchasePrediction: {
        enabled: true,
        lookbackPeriod: 90, // Days of historical data to analyze
        predictionHorizon: 7, // Days to predict ahead
        updateFrequency: 'daily',
        thresholds: {
          high: 0.7, // High likelihood of purchase
          medium: 0.4, // Medium likelihood
          low: 0.2 // Low likelihood
        },
        features: [
          'website_browsing_behavior',
          'cart_activity',
          'wishlist_items',
          'previous_purchase_history',
          'email_engagement',
          'product_page_views',
          'search_queries',
          'price_comparison_behavior',
          'device_type',
          'session_duration'
        ]
      },
      
      // Product recommendation model
      productRecommendation: {
        enabled: true,
        algorithms: ['collaborative_filtering', 'content_based', 'hybrid'],
        defaultAlgorithm: 'hybrid',
        similarityMetrics: ['cosine', 'jaccard'],
        maxRecommendations: 10,
        minSimilarityScore: 0.3,
        contextualFactors: {
          timeOfDay: true,
          seasonality: true,
          recentViews: true,
          currentCart: true,
        },
        coldStart: {
          strategy: 'popularity',
          diversityFactor: 0.3,
        },
        updateFrequency: 'daily',
        featureWeighting: {
          category: 2.0,
          brand: 1.5,
          price: 1.0,
          ratings: 1.2,
          purchaseHistory: 3.0,
        }
      },
      
      // Customer lifetime value (CLV) model
      customerLifetimeValue: {
        enabled: true,
        modelType: 'probabilistic',
        timePeriod: 365, // Prediction period in days
        minimumData: {
          transactions: 2,
          timespan: 30 // Minimum days between first and last transaction
        },
        updateFrequency: 'weekly',
        segmentation: {
          thresholds: {
            high: 1000,
            medium: 500,
            low: 100
          },
          percentiles: [10, 25, 50, 75, 90]
        }
      }
    }
  },
  
  // Content generation settings
  contentGeneration: {
    enabled: true,
    types: {
      // Email content generation
      email: {
        enabled: true,
        templates: {
          newsletter: {
            structure: ['header', 'intro', 'main_content', 'promotion', 'conclusion'],
            toneOptions: ['professional', 'friendly', 'enthusiastic'],
            defaultTone: 'friendly',
            lengthOptions: ['short', 'medium', 'long'],
            defaultLength: 'medium',
          },
          promotional: {
            structure: ['headline', 'offer_details', 'benefits', 'social_proof', 'cta'],
            toneOptions: ['persuasive', 'urgent', 'exclusive'],
            defaultTone: 'persuasive',
            lengthOptions: ['short', 'medium'],
            defaultLength: 'short',
          },
          transactional: {
            structure: ['greeting', 'transaction_details', 'next_steps', 'support_info'],
            toneOptions: ['professional', 'helpful'],
            defaultTone: 'professional',
            lengthOptions: ['short'],
            defaultLength: 'short',
          },
        },
        personalization: {
          level: 'medium', // low, medium, high
          fields: ['name', 'recent_purchases', 'browsing_history', 'location'],
          dynamicContent: true
        },
        constraints: {
          maxCharacters: 10000,
          htmlSafety: true,
          forbiddenWords: ['free', 'guarantee', 'no risk', 'winner'], // Spam trigger words
          readabilityScore: 60, // Minimum Flesch reading ease score
        }
      },
      
      // SMS content generation
      sms: {
        enabled: true,
        templates: {
          promotional: {
            structure: ['offer', 'deadline', 'code', 'url'],
            toneOptions: ['concise', 'urgent'],
            defaultTone: 'concise',
          },
          transactional: {
            structure: ['confirmation', 'details', 'next_steps'],
            toneOptions: ['formal', 'friendly'],
            defaultTone: 'friendly',
          },
          reminder: {
            structure: ['greeting', 'reminder_subject', 'time', 'action'],
            toneOptions: ['helpful', 'gentle'],
            defaultTone: 'helpful',
          }
        },
        personalization: {
          level: 'low', // Due to character constraints
          fields: ['first_name'],
        },
        constraints: {
          maxCharacters: 160,
          urlShortening: true,
          complianceFooter: true, // Include opt-out info
        }
      },
      
      // Social media content generation
      socialMedia: {
        enabled: true,
        platforms: {
          facebook: {
            postTypes: ['text', 'image', 'link', 'video'],
            defaultPostType: 'image',
            toneOptions: ['conversational', 'professional', 'engaging'],
            defaultTone: 'conversational',
            maxCharacters: 5000,
            recommendedCharacters: 250,
          },
          instagram: {
            postTypes: ['image', 'carousel', 'story', 'reel'],
            defaultPostType: 'image',
            toneOptions: ['casual', 'inspirational', 'authentic'],
            defaultTone: 'authentic',
            maxCharacters: 2200,
            recommendedCharacters: 150,
            hashtagStrategy: {
              count: { min: 5, max: 20, optimal: 11 },
              placement: 'end', // 'inline', 'comment', 'end'
              relevance: 'high'
            }
          },
          twitter: {
            postTypes: ['text', 'image', 'link', 'poll'],
            defaultPostType: 'text',
            toneOptions: ['concise', 'witty', 'informative'],
            defaultTone: 'concise',
            maxCharacters: 280,
            recommendedCharacters: 240,
            hashtagStrategy: {
              count: { min: 1, max: 2, optimal: 2 },
              placement: 'inline',
              relevance: 'trending'
            }
          },
          linkedin: {
            postTypes: ['text', 'image', 'link', 'article'],
            defaultPostType: 'text',
            toneOptions: ['professional', 'thought_leadership', 'educational'],
            defaultTone: 'professional',
            maxCharacters: 3000,
            recommendedCharacters: 1200,
            hashtagStrategy: {
              count: { min: 1, max: 5, optimal: 3 },
              placement: 'end',
              relevance: 'industry'
            }
          }
        },
        constraints: {
          brandVoiceConsistency: true,
          contentCalendarAwareness: true, // Avoid repeating recent posts
          sensitiveTopicDetection: true,
        }
      }
    }
  },
  
  // Natural language processing settings
  nlp: {
    enabled: true,
    features: {
      // Sentiment analysis
      sentimentAnalysis: {
        enabled: true,
        model: 'default', // Use the default model from the provider
        levels: ['very_negative', 'negative', 'neutral', 'positive', 'very_positive'],
        aspects: ['product', 'service', 'price', 'delivery', 'support'],
        minConfidence: 0.7,
      },
      
      // Entity recognition
      entityRecognition: {
        enabled: true,
        model: 'default',
        entityTypes: [
          'person', 'organization', 'location', 'product',
          'event', 'date', 'money', 'percentage'
        ],
        minConfidence: 0.6,
      },
      
      // Text classification
      textClassification: {
        enabled: true,
        classifiers: {
          intent: ['purchase', 'inquiry', 'complaint', 'feedback', 'support', 'other'],
          topic: ['product', 'pricing', 'shipping', 'returns', 'technical', 'account', 'other'],
          urgency: ['low', 'medium', 'high'],
          stage: ['awareness', 'consideration', 'decision']
        },
        minConfidence: 0.6,
      },
      
      // Language detection
      languageDetection: {
        enabled: true,
        minConfidence: 0.8,
        supportedLanguages: [
          'en', 'es', 'fr', 'de', 'it', 'pt', 'nl',
          'ja', 'ko', 'zh', 'ru', 'ar'
        ],
      },
      
      // Keyword extraction
      keywordExtraction: {
        enabled: true,
        maxKeywords: 10,
        minRelevanceScore: 0.3,
        includeNgrams: true, // Include multi-word phrases
        maxNgramLength: 3,
      }
    }
  },
  
  // Security and compliance settings
  security: {
    dataSecurity: {
      dataEncryption: true,
      encryptionAlgorithm: 'AES-256-GCM',
      personalDataHandling: 'restricted',
      dataAnonymization: {
        enabled: true,
        methods: ['hashing', 'aggregation']
      },
      logActivity: true,
      auditTrail: true,
    },
    modelSecurity: {
      accessControl: 'role_based',
      authenticationRequired: true,
      modelEndpointProtection: true,
      rateLimit: {
        enabled: true,
        requestsPerMinute: 60,
      }
    },
    complianceChecks: {
      sensitiveContentDetection: true,
      contentModeration: true,
      fairnessChecks: {
        enabled: true,
        biasDetection: true,
        demographicParity: true,
      },
      privacyComplianceChecks: {
        enabled: true,
        standards: ['GDPR', 'CCPA', 'HIPAA'],
        PII_detection: true,
        PII_redaction: true,
      }
    }
  },
  
  // Performance monitoring and logging
  monitoring: {
    enabled: true,
    metrics: {
      requestLatency: true,
      throughput: true,
      errorRate: true,
      modelPerformance: true,
      predictionQuality: true,
    },
    logging: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      includeRequest: process.env.NODE_ENV !== 'production',
      includeResponse: process.env.NODE_ENV !== 'production',
      sensitiveDataMasking: true,
      retention: {
        days: 30,
        maxSize: '1GB',
      }
    },
    alerting: {
      enabled: true,
      channels: ['email', 'slack'],
      thresholds: {
        errorRate: 0.05, // 5%
        latency: 2000, // ms
        modelDrift: 0.2, // 20% change in key metrics
      }
    }
  }
};

(aiSettings as any).default = aiSettings;
export = aiSettings;
