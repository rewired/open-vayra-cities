/**
 * Centralized distance thresholds for classifying the quality of a street routing anchor
 * for an OSM stop candidate group.
 */

/**
 * Maximum distance (in meters) from an OSM stop candidate to a street line to be considered "ready" for adoption.
 */
export const OSM_STOP_CANDIDATE_STREET_ANCHOR_READY_MAX_DISTANCE_METERS = 35;

/**
 * Maximum distance (in meters) from an OSM stop candidate to a street line to be considered for "review".
 * Beyond this, it is considered "blocked" for automatic adoption.
 */
export const OSM_STOP_CANDIDATE_STREET_ANCHOR_REVIEW_MAX_DISTANCE_METERS = 60;
