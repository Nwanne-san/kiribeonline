import * as migration_20260627_113318 from './20260627_113318';
import * as migration_20260627_154047_taxonomy_brand_color from './20260627_154047_taxonomy_brand_color';
import * as migration_20260630_subscriber_double_optin from './20260630_subscriber_double_optin';
import * as migration_20260708_205842_phase1_3_roles_author_message_read from './20260708_205842_phase1_3_roles_author_message_read';
import * as migration_20260709_062804_invite_token_fields from './20260709_062804_invite_token_fields';
import * as migration_20260717_205519_media_image_sizes from './20260717_205519_media_image_sizes';
import * as migration_20260717_205600_creators_reels_full_schema from './20260717_205600_creators_reels_full_schema';
import * as migration_20260717_210000_locked_docs_creators_reels from './20260717_210000_locked_docs_creators_reels';

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
  {
    up: migration_20260708_205842_phase1_3_roles_author_message_read.up,
    down: migration_20260708_205842_phase1_3_roles_author_message_read.down,
    name: '20260708_205842_phase1_3_roles_author_message_read',
  },
  {
    up: migration_20260709_062804_invite_token_fields.up,
    down: migration_20260709_062804_invite_token_fields.down,
    name: '20260709_062804_invite_token_fields',
  },
  {
    up: migration_20260717_205519_media_image_sizes.up,
    down: migration_20260717_205519_media_image_sizes.down,
    name: '20260717_205519_media_image_sizes'
  },
  {
    up: migration_20260717_205600_creators_reels_full_schema.up,
    down: migration_20260717_205600_creators_reels_full_schema.down,
    name: '20260717_205600_creators_reels_full_schema',
  },
  {
    up: migration_20260717_210000_locked_docs_creators_reels.up,
    down: migration_20260717_210000_locked_docs_creators_reels.down,
    name: '20260717_210000_locked_docs_creators_reels',
  },
];
