// Tournament Format Options (was enum, now string constants)
export const TOURNAMENT_FORMATS = {
  T10: "T10",
  T12: "T12", 
  T15: "T15",
  T20: "T20",
  T30: "T30",
  ODI: "ODI",
  TEST: "TEST",
  LEAGUE: "LEAGUE",
  KNOCKOUT: "KNOCKOUT",
  CUSTOM: "CUSTOM"
} as const;

// Tournament Status Options
export const TOURNAMENT_STATUS = {
  UPCOMING: "UPCOMING",
  REGISTRATION_OPEN: "REGISTRATION_OPEN", 
  REGISTRATION_CLOSED: "REGISTRATION_CLOSED",
  ONGOING: "ONGOING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED"
} as const;

// Payment Status Options
export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED", 
  REFUNDED: "REFUNDED"
} as const;

// Player Position Options
export const PLAYER_POSITIONS = {
  BATSMAN: "BATSMAN",
  BOWLER: "BOWLER",
  ALL_ROUNDER: "ALL_ROUNDER",
  WICKET_KEEPER: "WICKET_KEEPER"
} as const;

// Experience Level Options
export const EXPERIENCE_LEVELS = {
  BEGINNER: "BEGINNER",
  INTERMEDIATE: "INTERMEDIATE", 
  ADVANCED: "ADVANCED",
  PROFESSIONAL: "PROFESSIONAL"
} as const;

// Match Status Options
export const MATCH_STATUS = {
  SCHEDULED: "SCHEDULED",
  ONGOING: "ONGOING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  POSTPONED: "POSTPONED"
} as const;

// Image Category Options
export const IMAGE_CATEGORIES = {
  TOURNAMENT: "TOURNAMENT",
  TEAM: "TEAM",
  PLAYER: "PLAYER", 
  FACILITY: "FACILITY",
  GALLERY: "GALLERY"
} as const;

// Registration Status Options
export const REGISTRATION_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED", 
  WAITLISTED: "WAITLISTED"
} as const;

// Helper functions to get dropdown options
export const getTournamentFormatOptions = () => Object.values(TOURNAMENT_FORMATS);
export const getTournamentStatusOptions = () => Object.values(TOURNAMENT_STATUS);
export const getPaymentStatusOptions = () => Object.values(PAYMENT_STATUS);
export const getPlayerPositionOptions = () => Object.values(PLAYER_POSITIONS);
export const getExperienceLevelOptions = () => Object.values(EXPERIENCE_LEVELS);
export const getMatchStatusOptions = () => Object.values(MATCH_STATUS);
export const getImageCategoryOptions = () => Object.values(IMAGE_CATEGORIES);
export const getRegistrationStatusOptions = () => Object.values(REGISTRATION_STATUS);

// Type definitions for TypeScript (optional but recommended)
export type TournamentFormat = typeof TOURNAMENT_FORMATS[keyof typeof TOURNAMENT_FORMATS];
export type TournamentStatus = typeof TOURNAMENT_STATUS[keyof typeof TOURNAMENT_STATUS];
export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];
export type PlayerPosition = typeof PLAYER_POSITIONS[keyof typeof PLAYER_POSITIONS];
export type ExperienceLevel = typeof EXPERIENCE_LEVELS[keyof typeof EXPERIENCE_LEVELS];
export type MatchStatus = typeof MATCH_STATUS[keyof typeof MATCH_STATUS];
export type ImageCategory = typeof IMAGE_CATEGORIES[keyof typeof IMAGE_CATEGORIES];
export type RegistrationStatus = typeof REGISTRATION_STATUS[keyof typeof REGISTRATION_STATUS];
