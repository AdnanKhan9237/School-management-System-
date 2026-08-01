<?php

if (! function_exists('paisa_to_pkr')) {
    /**
     * Convert currency from paisa (integer) to formatted PKR string.
     */
    function paisa_to_pkr(int $paisa): string
    {
        return 'PKR '.number_format($paisa / 100, 2);
    }
}
