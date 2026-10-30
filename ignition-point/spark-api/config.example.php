<?php
/**
 * Copy this file to config.php (same folder) and fill in your real values.
 * Never make config.php public or commit it anywhere — it holds secrets.
 *
 * Where to get the Groundhogg values:
 *   WP Admin -> Groundhogg -> Settings -> API tab -> your API key row
 *   shows a Public Key and a Token (click Reissue if you need to see them again).
 */

return [
    'groundhogg_token'      => 'YOUR_GROUNDHOGG_TOKEN',
    'groundhogg_public_key' => 'YOUR_GROUNDHOGG_PUBLIC_KEY',
    'groundhogg_url'        => 'https://josephginsberg.com/wp-json/gh/v4/contacts',

    // Comma-separated origins allowed to call this endpoint (your site URL(s)).
    'allowed_origins'       => 'https://josephginsberg.com',
];
