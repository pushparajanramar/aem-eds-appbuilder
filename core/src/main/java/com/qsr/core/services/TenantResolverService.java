package com.qsr.core.services;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;

/**
 * OSGi service that resolves the current tenant from a resource path.
 * <p>
 * Tenants are registered via factory configurations. Each factory instance
 * defines a market code and its associated metadata (locale, currency,
 * EDS host, etc.). The service builds an internal lookup map keyed by
 * market code.
 * <p>
 * The content path convention is {@code /content/qsr/{market}/…}, so the
 * resolver extracts the third path segment and matches it against the
 * registered tenants.
 */
@Component(service = TenantResolverService.class, immediate = true)
@Designate(ocd = TenantResolverService.Config.class, factory = true)
public class TenantResolverService {

    @ObjectClassDefinition(
        name = "QSR Tenant Configuration",
        description = "Defines a market tenant with locale, currency, EDS host, and content root."
    )
    public @interface Config {

        @AttributeDefinition(name = "Market Code",
            description = "Unique market identifier, e.g. us, uk, jp")
        String market() default "us";

        @AttributeDefinition(name = "Locale",
            description = "BCP-47 locale, e.g. en-US, en-GB, ja-JP")
        String locale() default "en-US";

        @AttributeDefinition(name = "Currency",
            description = "ISO-4217 currency code, e.g. USD, GBP, JPY")
        String currency() default "USD";

        @AttributeDefinition(name = "Timezone",
            description = "IANA timezone, e.g. America/Los_Angeles")
        String timezone() default "America/Los_Angeles";

        @AttributeDefinition(name = "EDS Host",
            description = "Edge Delivery Services live host, e.g. main--qsr-us--org.aem.live")
        String edsHost() default "main--qsr-us--org.aem.live";

        @AttributeDefinition(name = "Content Root",
            description = "AEM content root path for this market, e.g. /content/qsr/us")
        String contentRoot() default "/content/qsr/us";
    }

    /** Shared tenant registry across all factory instances. */
    private static final Map<String, TenantConfig> TENANTS = new ConcurrentHashMap<>();

    /** Default market code used as fallback. */
    private static final String DEFAULT_MARKET = "us";

    private String registeredMarket;

    @Activate
    @Modified
    protected void activate(Config config) {
        registeredMarket = config.market();
        TenantConfig tenant = new TenantConfig(
            config.market(),
            config.locale(),
            config.currency(),
            config.timezone(),
            config.edsHost(),
            config.contentRoot()
        );
        TENANTS.put(config.market(), tenant);
    }

    @Deactivate
    protected void deactivate() {
        if (registeredMarket != null) {
            TENANTS.remove(registeredMarket);
        }
    }

    /**
     * Resolves a tenant from a JCR resource path.
     * <p>
     * Expects paths of the form {@code /content/qsr/{market}/...}.
     *
     * @param resourcePath absolute JCR path
     * @return matching {@link TenantConfig}, or the default (US) tenant
     */
    public TenantConfig resolve(String resourcePath) {
        if (resourcePath == null) {
            return getDefault();
        }
        String market = extractMarket(resourcePath);
        TenantConfig config = TENANTS.get(market);
        return config != null ? config : getDefault();
    }

    /**
     * Returns the tenant configuration for a specific market code.
     *
     * @param market market code (e.g. "us", "uk", "jp")
     * @return matching {@link TenantConfig}, or {@code null} if not registered
     */
    public TenantConfig getTenant(String market) {
        return TENANTS.get(market);
    }

    /**
     * Returns the default (fallback) tenant configuration.
     *
     * @return default tenant config, or {@code null} if no tenants are registered
     */
    public TenantConfig getDefault() {
        return TENANTS.get(DEFAULT_MARKET);
    }

    /**
     * Returns all registered tenant configurations.
     *
     * @return unmodifiable collection of all tenants
     */
    public Collection<TenantConfig> getAllTenants() {
        return Collections.unmodifiableCollection(TENANTS.values());
    }

    /**
     * Checks whether the given EDS origin hostname matches any registered tenant.
     *
     * @param hostname the hostname from an Origin header (e.g. "main--qsr-us--org.hlx.page")
     * @return {@code true} if the hostname contains a registered tenant's EDS host prefix
     */
    public boolean isAllowedEdsOrigin(String hostname) {
        for (TenantConfig tenant : TENANTS.values()) {
            String edsHost = tenant.getEdsHost();
            // EDS preview/live hosts follow the pattern: {branch}--{site}--{org}.{hlx|aem}.{page|live}
            // Extract the site identifier (e.g. "qsr-us") from the registered host
            String siteId = extractSiteId(edsHost);
            if (siteId != null && hostname.contains(siteId)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Extracts the market code from a content path.
     * Path convention: /content/qsr/{market}/...
     */
    static String extractMarket(String path) {
        if (path == null) {
            return DEFAULT_MARKET;
        }
        // Split on "/" — e.g. ["", "content", "qsr", "us", ...]
        String[] segments = path.split("/");
        if (segments.length >= 4 && "content".equals(segments[1]) && "qsr".equals(segments[2])) {
            return segments[3];
        }
        return DEFAULT_MARKET;
    }

    /**
     * Extracts the site identifier from an EDS host.
     * E.g. "main--qsr-us--org.aem.live" → "qsr-us"
     */
    private static String extractSiteId(String edsHost) {
        if (edsHost == null) {
            return null;
        }
        // Pattern: {branch}--{siteId}--{org}.{domain}
        String[] parts = edsHost.split("--");
        if (parts.length >= 2) {
            return parts[1];
        }
        return null;
    }
}
