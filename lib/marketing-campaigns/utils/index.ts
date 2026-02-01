export {
  replaceVariables,
  replaceTemplateVariables,
  getUnfilledRequiredVariables,
  validateVariables,
  getPreviewWithPlaceholders,
  extractVariableKeys,
} from "./variable-replacer";

export {
  validateContentLength,
  validateHashtagCount,
  validateEmailContent,
  validateTwitterContent,
  validateInstagramContent,
  validateTikTokContent,
  validateFacebookContent,
  validateLinkedInContent,
  validateAllPlatformContent,
  getOverallValidation,
  type ValidationResult,
} from "./platform-validator";
