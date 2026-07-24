<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | For a multi-tenant SaaS, we allow requests from the central domain and
    | any of its subdomains (each tenant is served on its own subdomain), and
    | we enable credentials so Sanctum cookie-based auth works across them.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [],

    // Allow the central domain and all of its subdomains (any scheme/port).
    // e.g. http://localhost, http://acme.localhost, https://acme.example.com
    'allowed_origins_patterns' => [
        '#^https?://([a-z0-9-]+\.)?'.preg_quote(env('CENTRAL_DOMAIN', 'localhost'), '#').'(:\d+)?$#i',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
