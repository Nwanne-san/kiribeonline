import * as migration_20260627_113318 from './20260627_113318';
import * as migration_20260627_154047_taxonomy_brand_color from './20260627_154047_taxonomy_brand_color';
import * as migration_20260630_subscriber_double_optin from './20260630_subscriber_double_optin';

export const migrations = [
  {
    up: migration_20260627_113318.up,
    down: migration_20260627_113318.down,
    name: '20260627_113318',
  },
  {
    up: migration_20260627_154047_taxonomy_brand_color.up,
    down: migration_20260627_154047_taxonomy_brand_color.down,
    name: '20260627_154047_taxonomy_brand_color',
  },
  {
    up: migration_20260630_subscriber_double_optin.up,
    down: migration_20260630_subscriber_double_optin.down,
    name: '20260630_subscriber_double_optin',
  },
];
