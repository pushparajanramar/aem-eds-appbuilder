package com.qsr.core.services;

/**
 * Immutable value object holding per-tenant configuration.
 * <p>
 * Each market (US, UK, JP, …) is a separate tenant with its own
 * locale, currency, EDS host, and content root. Instances are created
 * by {@link TenantResolverService} from OSGi factory configurations.
 */
public final class TenantConfig {

    private final String market;
    private final String locale;
    private final String currency;
    private final String timezone;
    private final String edsHost;
    private final String contentRoot;

    public TenantConfig(String market, String locale, String currency,
                        String timezone, String edsHost, String contentRoot) {
        if (market == null || market.isEmpty()) {
            throw new IllegalArgumentException("market must not be null or empty");
        }
        if (locale == null || locale.isEmpty()) {
            throw new IllegalArgumentException("locale must not be null or empty");
        }
        if (contentRoot == null || contentRoot.isEmpty()) {
            throw new IllegalArgumentException("contentRoot must not be null or empty");
        }
        this.market = market;
        this.locale = locale;
        this.currency = currency != null ? currency : "";
        this.timezone = timezone != null ? timezone : "";
        this.edsHost = edsHost != null ? edsHost : "";
        this.contentRoot = contentRoot;
    }

    /** Market code, e.g. {@code "us"}, {@code "uk"}, {@code "jp"}. */
    public String getMarket() {
        return market;
    }

    /** BCP-47 locale, e.g. {@code "en-US"}, {@code "en-GB"}, {@code "ja-JP"}. */
    public String getLocale() {
        return locale;
    }

    /** ISO-4217 currency code, e.g. {@code "USD"}, {@code "GBP"}, {@code "JPY"}. */
    public String getCurrency() {
        return currency;
    }

    /** IANA timezone, e.g. {@code "America/Los_Angeles"}. */
    public String getTimezone() {
        return timezone;
    }

    /** EDS live host, e.g. {@code "main--qsr-us--org.aem.live"}. */
    public String getEdsHost() {
        return edsHost;
    }

    /** AEM content root path, e.g. {@code "/content/qsr/us"}. */
    public String getContentRoot() {
        return contentRoot;
    }
}
