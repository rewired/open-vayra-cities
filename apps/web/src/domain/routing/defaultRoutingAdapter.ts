import { OsrmAdapter } from './OsrmAdapter';
import type { RoutingAdapter } from './RoutingAdapter';

/**
 * Returns the default routing adapter for the application.
 * Currently uses the local OSRM instance.
 */
export function getDefaultRoutingAdapter(): RoutingAdapter {
  return new OsrmAdapter();
}
