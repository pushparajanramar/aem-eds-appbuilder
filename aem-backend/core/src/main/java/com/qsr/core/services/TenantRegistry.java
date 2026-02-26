package com.qsr.core.services;

import java.util.Collection;

/**
 * Singleton OSGi service that acts as the central tenant registry.
 * <p>
 * Factory-configured {@link TenantResolverService} instances register and
 * deregister tenants via this registry. Consumer code (servlets, filters)
 * should depend on this interface to resolve tenants from resource paths.
 */
public interface TenantRegistry {

    /**
     * Registers a tenant configuration.
     *
     * @param config the tenant to register (keyed by market)
     */
    void register(TenantConfig config);

    /**
     * Unregisters the tenant for the given market.
     *
     * @param market the market code to remove
     */
    void unregister(String market);

    /**
     * Resolves a tenant from a JCR resource path.
     * <p>
     * Expects paths of the form {@code /content/qsr/{market}/...}.
     *
     * @param resourcePath absolute JCR path
     * @return matching {@link TenantConfig}, or the default (US) tenant
     */
    TenantConfig resolve(String resourcePath);

    /**
     * Returns the tenant configuration for a specific market code.
     *
     * @param market market code (e.g. "us", "uk", "jp")
     * @return matching {@link TenantConfig}, or {@code null} if not registered
     */
    TenantConfig getTenant(String market);

    /**
     * Returns the default (fallback) tenant configuration.
     *
     * @return default tenant config, or {@code null} if no tenants are registered
     */
    TenantConfig getDefault();

    /**
     * Returns all registered tenant configurations.
     *
     * @return unmodifiable collection of all tenants
     */
    Collection<TenantConfig> getAllTenants();

    /**
     * Checks whether the given EDS origin hostname matches any registered tenant.
     *
     * @param hostname the hostname from an Origin header
     * @return {@code true} if the hostname matches a registered tenant's EDS host pattern
     */
    boolean isAllowedEdsOrigin(String hostname);
}
