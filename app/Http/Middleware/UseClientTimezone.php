<?php

namespace App\Http\Middleware;

use Closure;
use DateTimeZone;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class UseClientTimezone
{
    private const FALLBACK_TIMEZONE = 'Asia/Karachi';

    /**
     * Use the timezone reported by the browser for dates rendered by this request.
     * Direct PDF downloads use the query parameter because browsers cannot add headers
     * to a normal download link.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $timezone = $request->header('X-Timezone')
            ?? $request->query('timezone')
            ?? $request->cookie('client_timezone');

        if (! is_string($timezone) || ! in_array($timezone, DateTimeZone::listIdentifiers(), true)) {
            $timezone = self::FALLBACK_TIMEZONE;
        }

        config(['app.timezone' => $timezone]);
        date_default_timezone_set($timezone);

        $response = $next($request);

        if ($request->cookie('client_timezone') !== $timezone) {
            $response->headers->setCookie(cookie(
                'client_timezone',
                $timezone,
                60 * 24 * 365,
                '/',
                null,
                $request->isSecure(),
                false,
                false,
                'lax',
            ));
        }

        return $response;
    }
}
